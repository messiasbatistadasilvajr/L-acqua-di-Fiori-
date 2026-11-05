import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  INITIAL_BRANCHES,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY,
  INITIAL_COUPONS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
} from '../data/seedData';
import {
  Branch,
  Category,
  Product,
  BranchInventory,
  Coupon,
  Customer,
  Order,
  StockMovement,
  Role,
} from '../types';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: Role;
  branchId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StoreData {
  version: number;
  lastUpdated: string;
  branches: Branch[];
  categories: Category[];
  products: Product[];
  inventory: BranchInventory[];
  coupons: Coupon[];
  customers: Customer[];
  orders: Order[];
  stockMovements: StockMovement[];
  users: StoredUser[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const JWT_SECRET = process.env.JWT_SECRET || 'lacqua-di-fiori-secret-key-fortaleza-2026-production';

// Helpers para hashing seguro PBKDF2
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const { hash: calculatedHash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(calculatedHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// Helpers para token de sessão assinado com HMAC-SHA256 (sem dependências externas)
export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  branchId?: string;
  exp: number; // timestamp ms
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>, expiresInHours = 48): string {
  const exp = Date.now() + expiresInHours * 60 * 60 * 1000;
  const fullPayload: SessionPayload = { ...payload, exp };
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(payloadStr);

    if (Date.now() > payload.exp) {
      return null; // Expirado
    }

    return payload;
  } catch {
    return null;
  }
}

// Sanitização estrita de CSV para evitar injeção de fórmulas (=, +, -, @, tab, cr)
export function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Se começar com caracteres gatilho de execução no Excel/Calc, prefixa com aspas simples apóstrofo
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escapa aspas duplas
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

class StoreDatabase {
  private data: StoreData;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadOrInit();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadOrInit(): StoreData {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.orders) && Array.isArray(parsed.products)) {
          // Garante que usuários padrão existam
          this.ensureDefaultUsers(parsed);
          return parsed;
        }
      } catch (err) {
        console.error('Falha ao ler store.json existente, reinicializando a partir do seed:', err);
      }
    }

    // Inicialização a partir de dados seed
    const initialUsers = this.generateDefaultUsers();
    const initialData: StoreData = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      branches: [...INITIAL_BRANCHES],
      categories: [...INITIAL_CATEGORIES],
      products: [...INITIAL_PRODUCTS],
      inventory: [...INITIAL_INVENTORY],
      coupons: [...INITIAL_COUPONS],
      customers: [...INITIAL_CUSTOMERS],
      orders: [...INITIAL_ORDERS],
      stockMovements: [],
      users: initialUsers,
    };

    this.saveData(initialData);
    return initialData;
  }

  private generateDefaultUsers(): StoredUser[] {
    const adminPass = process.env.ADMIN_PASSWORD || 'Lacqua@2026!';
    const gerentePass = process.env.GERENTE_PASSWORD || 'Centro@2026!';
    const atendentePass = process.env.ATENDENTE_PASSWORD || 'Atende@2026!';

    const adminHash = hashPassword(adminPass);
    const gerenteHash = hashPassword(gerentePass);
    const atendenteHash = hashPassword(atendentePass);

    return [
      {
        id: 'usr-admin-1',
        name: 'Administrador Geral',
        email: 'admin@lacquadifiori.com.br',
        passwordHash: adminHash.hash,
        salt: adminHash.salt,
        role: 'ADMIN_GERAL',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-gerente-1',
        name: 'Gerente Loja Centro',
        email: 'gerente.centro@lacquadifiori.com.br',
        passwordHash: gerenteHash.hash,
        salt: gerenteHash.salt,
        role: 'GERENTE_FILIAL',
        branchId: 'branch-fortaleza',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-atendente-1',
        name: 'Atendente Comercial',
        email: 'atendente@lacquadifiori.com.br',
        passwordHash: atendenteHash.hash,
        salt: atendenteHash.salt,
        role: 'ATENDENTE',
        branchId: 'branch-fortaleza',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private ensureDefaultUsers(targetData: StoreData) {
    if (!targetData.users || targetData.users.length === 0) {
      targetData.users = this.generateDefaultUsers();
      this.saveData(targetData);
    }
  }

  public persist() {
    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
  }

  private saveData(dataToSave: StoreData) {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Erro ao persistir banco em store.json:', err);
    }
  }

  // Getters & Mutators
  public getBranches() { return this.data.branches; }
  public getCategories() { return this.data.categories; }
  public getProducts() { return this.data.products; }
  public getInventory() { return this.data.inventory; }
  public getCoupons() { return this.data.coupons; }
  public getCustomers() { return this.data.customers; }
  public getOrders() { return this.data.orders; }
  public getStockMovements() { return this.data.stockMovements; }
  public getUsers() { return this.data.users; }

  public getUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.isActive);
  }
}

export const db = new StoreDatabase();
