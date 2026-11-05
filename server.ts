import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { STORE_GALLERY_ITEMS } from './src/data/seedData';
import { Order, OrderStatus, Product, StockMovement } from './src/types';
import {
  db,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  sanitizeCsvField,
  SessionPayload,
} from './src/server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ==========================================
// Rate Limiter Helpers (Memory Sliding Window)
// ==========================================
interface RateLimitBucket {
  timestamps: number[];
}
const rateLimitMaps = {
  ai: new Map<string, RateLimitBucket>(),
  orders: new Map<string, RateLimitBucket>(),
  auth: new Map<string, RateLimitBucket>(),
};

function checkRateLimit(category: 'ai' | 'orders' | 'auth', ip: string, limit: number, windowMs: number): boolean {
  const map = rateLimitMaps[category];
  const now = Date.now();
  let bucket = map.get(ip);
  if (!bucket) {
    bucket = { timestamps: [] };
    map.set(ip, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    return false;
  }
  bucket.timestamps.push(now);
  return true;
}

// ==========================================
// Authentication Middlewares
// ==========================================
export interface AuthenticatedRequest extends Request {
  user?: SessionPayload;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login primeiro.' });
  }
  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
  req.user = session;
  next();
}

function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente para esta ação.' });
    }
    next();
  };
}

// Gemini AI Client Setup
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// Helper: Format WhatsApp Message
// ==========================================
function formatWhatsAppOrderMessage(order: Order): string {
  const itemsText = order.items
    .map(
      (item, idx) =>
        `  ${idx + 1}. *${item.productName}* (${item.volume})\n     Qtd: ${item.quantity}x | R$ ${item.unitPrice.toFixed(2).replace('.', ',')} = R$ ${item.total.toFixed(2).replace('.', ',')}`
    )
    .join('\n\n');

  const deliveryText =
    order.deliveryType === 'RETIRADA_LOJA'
      ? `🛍️ *Modalidade:* Retirada na Loja (${order.branchName})`
      : `🛵 *Modalidade:* Entrega Delivery\n📍 *Endereço:* ${order.deliveryAddress || 'A combinar'}`;

  const discountText = order.discount > 0 ? `\n🏷️ *Desconto Cupom (${order.couponCode}):* -R$ ${order.discount.toFixed(2).replace('.', ',')}` : '';
  const deliveryFeeText = order.deliveryFee > 0 ? `\n📦 *Taxa de Entrega:* R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}` : '';

  return `✨ *NOVO PEDIDO DE PERFUMARIA — L'ACQUA DI FIORI* ✨
━━━━━━━━━━━━━━━━━━━━━━
Olá equipe da *${order.branchName}*!
Gostaria de confirmar meu pedido feito pelo catálogo digital:

📋 *Número do Pedido:* ${order.orderNumber}
👤 *Cliente:* ${order.customerName}
📱 *WhatsApp:* ${order.customerPhone}

🛒 *ITENS SELECIONADOS:*
${itemsText}

${deliveryText}
💳 *Forma de Pagamento Pretendida:* ${order.paymentMethod}
━━━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* R$ ${order.subtotal.toFixed(2).replace('.', ',')}${discountText}${deliveryFeeText}
💎 *TOTAL GERAL: R$ ${order.total.toFixed(2).replace('.', ',')}*
━━━━━━━━━━━━━━━━━━━━━━
${order.notes ? `📝 *Observações:* ${order.notes}\n` : ''}
Poderiam me confirmar a separação e o link/chave para pagamento? Muito obrigado(a)!`;
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Login com verificação de hash e emissão de token assinado
app.post('/api/auth/login', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit('auth', clientIp, 10, 60 * 1000)) {
    return res.status(429).json({ error: 'Muitas tentativas de login. Aguarde um minuto.' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
  }

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
  });

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      isActive: user.isActive,
    },
  });
});

// Checar sessão ativa
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Branches / Filiais
app.get('/api/branches', (_req: Request, res: Response) => {
  res.json(db.getBranches());
});

app.put('/api/branches/:id', requireAuth, requireRole(['ADMIN_GERAL']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const branches = db.getBranches();
  const index = branches.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Filial não encontrada' });
  }
  branches[index] = { ...branches[index], ...req.body };
  db.persist();
  res.json(branches[index]);
});

// 2. Categories
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json(db.getCategories());
});

app.post('/api/categories', requireAuth, requireRole(['ADMIN_GERAL']), (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ error: 'Nome e slug são obrigatórios' });
  }
  const newCat = {
    id: `cat-${Date.now()}`,
    name,
    slug,
    description: description || '',
  };
  db.getCategories().push(newCat);
  db.persist();
  res.status(201).json(newCat);
});

// Gallery - Fotos Reais da Loja & Vitrines
app.get('/api/gallery', (_req: Request, res: Response) => {
  res.json(STORE_GALLERY_ITEMS);
});

// 3. Products
app.get('/api/products', (req: Request, res: Response) => {
  const { category, search, gender, branchId } = req.query;
  const products = db.getProducts();
  const inventory = db.getInventory();
  let filtered = [...products];

  if (category && category !== 'todos' && category !== 'cat-todos') {
    if (category === 'promocoes' || category === 'cat-promos') {
      filtered = filtered.filter((p) => p.promotionalPrice && p.promotionalPrice < p.originalPrice);
    } else {
      filtered = filtered.filter((p) => p.categoryId === category || p.categoryId.includes(category as string));
    }
  }

  if (gender) {
    filtered = filtered.filter((p) => p.gender === gender);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.olfactoryFamily.toLowerCase().includes(q) ||
        p.topNotes.toLowerCase().includes(q) ||
        p.heartNotes.toLowerCase().includes(q) ||
        p.baseNotes.toLowerCase().includes(q)
    );
  }

  // Attach branch-specific stock if branchId provided
  if (branchId) {
    const enriched = filtered.map((p) => {
      const inv = inventory.find((i) => i.branchId === branchId && i.productId === p.id);
      return {
        ...p,
        branchStock: inv ? inv.quantity : 0,
      };
    });
    return res.json(enriched);
  }

  res.json(filtered);
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const prod = db.getProducts().find((p) => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(prod);
});

// Criar produto (apenas ADMIN_GERAL)
app.post('/api/products', requireAuth, requireRole(['ADMIN_GERAL']), (req: AuthenticatedRequest, res: Response) => {
  const { name, categoryId, description, volume, originalPrice, promotionalPrice, olfactoryFamily, topNotes, heartNotes, baseNotes, gender, imageUrl } = req.body;
  if (!name || !originalPrice || !categoryId) {
    return res.status(400).json({ error: 'Campos essenciais ausentes' });
  }

  const products = db.getProducts();
  const inventory = db.getInventory();
  const branches = db.getBranches();

  const newProd: Product = {
    id: `prod-${Date.now()}`,
    sku: `LDF-${Math.floor(100 + Math.random() * 900)}`,
    name,
    brand: "L'acqua di Fiori",
    categoryId,
    description: description || '',
    volume: volume || '100ml',
    originalPrice: Number(originalPrice),
    promotionalPrice: promotionalPrice ? Number(promotionalPrice) : undefined,
    imageUrl: imageUrl || '/src/assets/images/perfume_ladro_luxury_1793757508691.jpg',
    olfactoryFamily: olfactoryFamily || 'Fragrância Exclusiva',
    topNotes: topNotes || 'Notas Cítricas e Aromáticas',
    heartNotes: heartNotes || 'Acordes Florais e Amadeirados',
    baseNotes: baseNotes || 'Âmbar e Almíscar',
    gender: gender || 'Unissex',
    isActive: true,
  };

  products.push(newProd);

  // Inicializar inventário em todas as filiais
  branches.forEach((b) => {
    inventory.push({
      branchId: b.id,
      productId: newProd.id,
      quantity: 10,
      minAlert: 4,
    });
  });

  db.persist();
  res.status(201).json(newProd);
});

// Editar produto (apenas ADMIN_GERAL)
app.put('/api/products/:id', requireAuth, requireRole(['ADMIN_GERAL']), (req: AuthenticatedRequest, res: Response) => {
  const products = db.getProducts();
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });

  products[index] = {
    ...products[index],
    ...req.body,
  };
  db.persist();
  res.json(products[index]);
});

// Excluir produto (apenas ADMIN_GERAL)
app.delete('/api/products/:id', requireAuth, requireRole(['ADMIN_GERAL']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const products = db.getProducts();
  const inventory = db.getInventory();

  const pIndex = products.findIndex((p) => p.id === id);
  if (pIndex !== -1) {
    products.splice(pIndex, 1);
  }

  const remainingInv = inventory.filter((i) => i.productId !== id);
  inventory.length = 0;
  inventory.push(...remainingInv);

  db.persist();
  res.json({ success: true, message: 'Produto removido com sucesso' });
});

// 4. Inventory / Estoque
app.get('/api/inventory', (req: Request, res: Response) => {
  const { branchId } = req.query;
  const inventory = db.getInventory();
  const products = db.getProducts();
  const branches = db.getBranches();

  let result = [...inventory];
  if (branchId) {
    result = result.filter((i) => i.branchId === branchId);
  }

  const enriched = result.map((inv) => {
    const product = products.find((p) => p.id === inv.productId);
    const branch = branches.find((b) => b.id === inv.branchId);
    return {
      ...inv,
      productName: product?.name || 'Desconhecido',
      productSku: product?.sku || '',
      productVolume: product?.volume || '',
      productPrice: product?.promotionalPrice || product?.originalPrice || 0,
      branchName: branch?.name || 'Filial Desconhecida',
      isLowStock: inv.quantity <= inv.minAlert,
    };
  });

  res.json(enriched);
});

// Adjust stock / Entrada manual (requer autenticação)
app.post('/api/inventory/adjust', requireAuth, requireRole(['ADMIN_GERAL', 'GERENTE_FILIAL']), (req: AuthenticatedRequest, res: Response) => {
  const { branchId, productId, delta, reason } = req.body;
  if (!branchId || !productId || typeof delta !== 'number') {
    return res.status(400).json({ error: 'Dados de ajuste inválidos' });
  }

  const inventory = db.getInventory();
  const stockMovements = db.getStockMovements();

  let item = inventory.find((i) => i.branchId === branchId && i.productId === productId);
  if (!item) {
    item = { branchId, productId, quantity: Math.max(0, delta), minAlert: 4 };
    inventory.push(item);
  } else {
    item.quantity = Math.max(0, item.quantity + delta);
  }

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    inventoryId: `${branchId}-${productId}`,
    branchId,
    productId,
    type: delta >= 0 ? 'ENTRADA' : 'AJUSTE',
    quantity: delta,
    notes: reason || `Ajuste manual efetuado por ${req.user?.name}`,
    createdAt: new Date().toISOString(),
  };
  stockMovements.push(movement);

  db.persist();
  res.json({ success: true, inventory: item, movement });
});

// Transfer stock between branches (requer autenticação)
app.post('/api/inventory/transfer', requireAuth, requireRole(['ADMIN_GERAL', 'GERENTE_FILIAL']), (req: AuthenticatedRequest, res: Response) => {
  const { fromBranchId, toBranchId, productId, quantity } = req.body;
  const qty = Number(quantity);

  if (!fromBranchId || !toBranchId || !productId || qty <= 0) {
    return res.status(400).json({ error: 'Parâmetros de transferência inválidos' });
  }

  if (fromBranchId === toBranchId) {
    return res.status(400).json({ error: 'Origem e destino devem ser diferentes' });
  }

  const inventory = db.getInventory();
  const branches = db.getBranches();
  const stockMovements = db.getStockMovements();

  const source = inventory.find((i) => i.branchId === fromBranchId && i.productId === productId);
  if (!source || source.quantity < qty) {
    return res.status(400).json({ error: 'Estoque insuficiente na filial de origem' });
  }

  let dest = inventory.find((i) => i.branchId === toBranchId && i.productId === productId);
  if (!dest) {
    dest = { branchId: toBranchId, productId, quantity: 0, minAlert: 4 };
    inventory.push(dest);
  }

  source.quantity -= qty;
  dest.quantity += qty;

  const movement: StockMovement = {
    id: `mov-trans-${Date.now()}`,
    inventoryId: `${fromBranchId}->${toBranchId}`,
    branchId: fromBranchId,
    productId,
    type: 'TRANSFERENCIA',
    quantity: qty,
    notes: `Transferência de ${branches.find((b) => b.id === fromBranchId)?.name} para ${branches.find((b) => b.id === toBranchId)?.name} autorizada por ${req.user?.name}`,
    createdAt: new Date().toISOString(),
  };
  stockMovements.push(movement);

  db.persist();
  res.json({ success: true, source, dest, movement });
});

// 5. Orders / Pedidos
app.get('/api/orders', (req: Request, res: Response) => {
  const { branchId, status } = req.query;
  const orders = db.getOrders();
  let filtered = [...orders];

  if (branchId) {
    filtered = filtered.filter((o) => o.branchId === branchId);
  }
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  // Ordenar por data decrescente
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(filtered);
});

// Criar pedido com validação, persistência e formatação de mensagem WhatsApp
app.post('/api/orders', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit('orders', clientIp, 10, 60 * 1000)) {
    return res.status(429).json({ error: 'Muitos pedidos registrados recentemente. Aguarde alguns instantes.' });
  }

  const {
    branchId,
    customerName,
    customerPhone,
    deliveryType,
    deliveryAddress,
    paymentMethod,
    couponCode,
    notes,
    items,
  } = req.body;

  if (!branchId || !customerName || !customerPhone || !items || !items.length) {
    return res.status(400).json({ error: 'Informações obrigatórias ausentes para o pedido' });
  }

  const branches = db.getBranches();
  const products = db.getProducts();
  const coupons = db.getCoupons();
  const inventory = db.getInventory();
  const stockMovements = db.getStockMovements();
  const customers = db.getCustomers();
  const orders = db.getOrders();

  const branch = branches.find((b) => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Filial selecionada não existe' });
  }

  // Calcular subtotal e descontos
  let subtotal = 0;
  const processedItems = items.map((it: any) => {
    const prod = products.find((p) => p.id === it.productId);
    const unitPrice = prod?.promotionalPrice || prod?.originalPrice || it.unitPrice || 0;
    const total = unitPrice * it.quantity;
    subtotal += total;
    return {
      productId: it.productId,
      productName: prod?.name || it.productName,
      sku: prod?.sku || 'LDF-GEN',
      volume: prod?.volume || '100ml',
      unitPrice,
      quantity: it.quantity,
      total,
    };
  });

  // Validar cupom
  let discount = 0;
  if (couponCode) {
    const coup = coupons.find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive);
    if (coup && subtotal >= coup.minOrder) {
      if (coup.discountType === 'PERCENTUAL') {
        discount = (subtotal * coup.value) / 100;
      } else {
        discount = coup.value;
      }
      coup.usageCount += 1;
    }
  }

  const deliveryFee = deliveryType === 'ENTREGA_DELIVERY' ? 15.0 : 0;
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

  // Reservar estoque
  for (const item of items) {
    const inv = inventory.find((i) => i.branchId === branchId && i.productId === item.productId);
    if (inv) {
      inv.quantity = Math.max(0, inv.quantity - item.quantity);
      stockMovements.push({
        id: `mov-sale-${Date.now()}-${item.productId}`,
        inventoryId: `${branchId}-${item.productId}`,
        branchId,
        productId: item.productId,
        type: 'SAIDA_VENDA',
        quantity: -item.quantity,
        notes: `Solicitação de compra via catálogo digital`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Cadastrar ou atualizar cliente
  let customer = customers.find((c) => c.phone.replace(/\D/g, '') === customerPhone.replace(/\D/g, ''));
  if (!customer) {
    customer = {
      id: `cust-${Date.now()}`,
      name: customerName,
      phone: customerPhone,
      address: deliveryAddress || '',
      lgpdConsent: true,
      totalSpent: grandTotal,
      ordersCount: 1,
      lastOrderAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    customers.push(customer);
  } else {
    customer.name = customerName;
    customer.totalSpent += grandTotal;
    customer.ordersCount += 1;
    customer.lastOrderAt = new Date().toISOString();
    if (deliveryAddress) customer.address = deliveryAddress;
  }

  const orderNumber = `#LDF-2026-${String(orders.length + 1042).padStart(4, '0')}`;

  const newOrder: Order = {
    id: `order-${Date.now()}`,
    orderNumber,
    branchId: branch.id,
    branchName: branch.name,
    branchWhatsapp: branch.whatsapp,
    customerId: customer.id,
    customerName,
    customerPhone,
    deliveryType,
    deliveryAddress: deliveryType === 'ENTREGA_DELIVERY' ? deliveryAddress : undefined,
    subtotal,
    discount,
    deliveryFee,
    total: grandTotal,
    paymentMethod,
    couponCode: discount > 0 ? couponCode : undefined,
    notes,
    status: 'NOVO_PEDIDO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: processedItems,
  };

  orders.unshift(newOrder);

  // Salvar no disco atomicamente
  db.persist();

  // Formatar mensagem do WhatsApp
  const formattedMessage = formatWhatsAppOrderMessage(newOrder);
  const whatsappUrl = `https://wa.me/${branch.whatsapp}?text=${encodeURIComponent(formattedMessage)}`;

  res.status(201).json({
    success: true,
    order: newOrder,
    formattedMessage,
    whatsappUrl,
  });
});

// Atualizar status do pedido (requer autenticação)
app.patch('/api/orders/:id/status', requireAuth, requireRole(['ADMIN_GERAL', 'GERENTE_FILIAL', 'ATENDENTE']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses: OrderStatus[] = [
    'NOVO_PEDIDO',
    'AGUARDANDO_CONFIRMACAO',
    'CONFIRMADO',
    'EM_PREPARACAO',
    'PRONTO_RETIRADA',
    'SAIU_ENTREGA',
    'CONCLUIDO',
    'CANCELADO',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status de pedido inválido' });
  }

  const orders = db.getOrders();
  const inventory = db.getInventory();
  const stockMovements = db.getStockMovements();

  const order = orders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  // Se cancelado, estorna o estoque
  if (status === 'CANCELADO' && order.status !== 'CANCELADO') {
    for (const item of order.items) {
      const inv = inventory.find((i) => i.branchId === order.branchId && i.productId === item.productId);
      if (inv) {
        inv.quantity += item.quantity;
        stockMovements.push({
          id: `mov-refund-${Date.now()}-${item.productId}`,
          inventoryId: `${order.branchId}-${item.productId}`,
          branchId: order.branchId,
          productId: item.productId,
          type: 'ENTRADA',
          quantity: item.quantity,
          notes: `Estorno de cancelamento do pedido ${order.orderNumber} por ${req.user?.name}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  db.persist();
  res.json({ success: true, order });
});

// 6. Cupons
app.get('/api/coupons', (_req: Request, res: Response) => {
  res.json(db.getCoupons());
});

app.post('/api/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Código de cupom obrigatório' });

  const coup = db.getCoupons().find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
  if (!coup) {
    return res.status(404).json({ error: 'Cupom inválido ou expirado' });
  }

  if (subtotal && subtotal < coup.minOrder) {
    return res.status(400).json({
      error: `Valor mínimo para este cupom é R$ ${coup.minOrder.toFixed(2).replace('.', ',')}`,
    });
  }

  res.json({
    valid: true,
    coupon: coup,
  });
});

app.post('/api/coupons', requireAuth, requireRole(['ADMIN_GERAL']), (_req: AuthenticatedRequest, res: Response) => {
  const { code, discountType, value, minOrder, validUntil } = _req.body;
  if (!code || !value) {
    return res.status(400).json({ error: 'Código e valor são obrigatórios' });
  }

  const newCoupon = {
    id: `coup-${Date.now()}`,
    code: code.toUpperCase().trim(),
    discountType: discountType || 'PERCENTUAL',
    value: Number(value),
    minOrder: Number(minOrder || 0),
    validUntil: validUntil || '2027-12-31',
    usageCount: 0,
    isActive: true,
  };
  db.getCoupons().push(newCoupon);
  db.persist();
  res.status(201).json(newCoupon);
});

// 7. Customers / Clientes (protegido por autenticação)
app.get('/api/customers', requireAuth, requireRole(['ADMIN_GERAL', 'GERENTE_FILIAL', 'ATENDENTE']), (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getCustomers());
});

// 8. Relatórios & Dashboard KPIs (protegido por autenticação)
app.get('/api/reports/dashboard', requireAuth, requireRole(['ADMIN_GERAL', 'GERENTE_FILIAL']), (_req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders();
  const branches = db.getBranches();
  const inventory = db.getInventory();
  const products = db.getProducts();

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELADO')
    .reduce((acc, o) => acc + o.total, 0);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'NOVO_PEDIDO' || o.status === 'AGUARDANDO_CONFIRMACAO').length;
  const completedOrders = orders.filter((o) => o.status === 'CONCLUIDO').length;
  const averageTicket = totalOrders > 0 ? totalRevenue / (totalOrders - orders.filter((o) => o.status === 'CANCELADO').length || 1) : 0;

  // Filiais breakdown
  const branchBreakdown = branches.map((b) => {
    const branchOrders = orders.filter((o) => o.branchId === b.id && o.status !== 'CANCELADO');
    const branchRevenue = branchOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      branchId: b.id,
      branchName: b.name,
      ordersCount: branchOrders.length,
      revenue: branchRevenue,
    };
  });

  // Produtos com estoque baixo
  const lowStockAlerts = inventory
    .filter((i) => i.quantity <= i.minAlert)
    .map((i) => {
      const prod = products.find((p) => p.id === i.productId);
      const branch = branches.find((b) => b.id === i.branchId);
      return {
        productId: i.productId,
        productName: prod?.name || 'Desconhecido',
        branchName: branch?.name || 'Filial',
        quantity: i.quantity,
        minAlert: i.minAlert,
      };
    });

  res.json({
    totalRevenue,
    totalOrders,
    pendingOrders,
    completedOrders,
    averageTicket,
    branchBreakdown,
    lowStockAlerts,
  });
});

// Exportação CSV de pedidos com sanitização contra fórmula injection
app.get('/api/reports/export/orders.csv', requireAuth, requireRole(['ADMIN_GERAL', 'GERENTE_FILIAL']), (_req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders();
  const headers = 'ID,Numero_Pedido,Filial,Cliente,Telefone,Status,Subtotal,Desconto,Total,Pagamento,Data\n';
  const rows = orders
    .map(
      (o) =>
        [
          sanitizeCsvField(o.id),
          sanitizeCsvField(o.orderNumber),
          sanitizeCsvField(o.branchName),
          sanitizeCsvField(o.customerName),
          sanitizeCsvField(o.customerPhone),
          sanitizeCsvField(o.status),
          sanitizeCsvField(o.subtotal.toFixed(2)),
          sanitizeCsvField(o.discount.toFixed(2)),
          sanitizeCsvField(o.total.toFixed(2)),
          sanitizeCsvField(o.paymentMethod),
          sanitizeCsvField(o.createdAt),
        ].join(',')
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="pedidos_lacqua_di_fiori.csv"');
  res.send('\uFEFF' + headers + rows);
});

// 9. Assistente Olfativo Comercial — Gemini 3.8 Flash (com rate limiting e fallback)
app.post('/api/ai/consultant', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit('ai', clientIp, 15, 60 * 1000)) {
    return res.status(429).json({
      error: 'Limite de consultas atingido. Nossas consultoras estão no WhatsApp!',
      reply: 'Você atingiu o limite de consultas automáticas por minuto. Nossa equipe da Loja Centro está à disposição imediata no WhatsApp para atendê-lo(a)!',
      whatsappPreFill: 'Olá! Gostaria de conversar com a equipe da Loja Centro sobre as fragrâncias!',
    });
  }

  const { userMessage, history } = req.body;
  if (!userMessage) {
    return res.status(400).json({ error: 'Mensagem do usuário é obrigatória' });
  }

  const products = db.getProducts();

  // Prepara o contexto de catálogo real da L'acqua di Fiori
  const catalogContext = products
    .filter((p) => p.isActive)
    .map(
      (p) =>
        `- ${p.name} (${p.volume}): Família ${p.olfactoryFamily}. Gênero: ${p.gender}. Preço: R$ ${(p.promotionalPrice || p.originalPrice).toFixed(2)}. Notas de Saída: ${p.topNotes}; Notas de Corpo: ${p.heartNotes}; Notas de Fundo: ${p.baseNotes}. Descrição: ${p.description}. Id: ${p.id}`
    )
    .join('\n');

  const systemInstruction = `Você é a Consultora Olfativa Virtual Sênior da prestigiada perfumaria brasileira "L'acqua di Fiori" (Loja Centro & Tele-Entregas em Fortaleza/CE).
Sua missão é encantar o cliente com vocabulário refinado, sensorial, envolvente e persuasivo de alta perfumaria, conduzindo-o com carinho para a compra e para o atendimento consultivo.

DIRETRIZES DE ATENDIMENTO E VOCABULÁRIO:
1. DESCREVA COM PROFUNDIDADE: Nunca dê respostas monossilábicas ou rasas. Explique as notas de saída (o primeiro impacto ao borrifar), notas de corpo (o coração e a aura que perdura) e notas de fundo (o rastro e a fixação na pele).
2. CONTEXTUALIZE A OCASIÃO: Explique se a fragrância combina com o dia a dia, clima quente de Fortaleza, eventos noturnos, encontros românticos, reuniões de trabalho ou presentes inesquecíveis.
3. CONDUZA PARA A AÇÃO:
   - Ofereça direcionamento para ver a coleção completa na vitrine do catálogo.
   - Recomende o WhatsApp oficial da Loja Centro para tirar dúvidas, reservar o frasco ou solicitar tele-entrega rápida em Fortaleza.
4. NUNCA INVENTE PRODUTOS: Recomende exclusivamente itens presentes no catálogo fornecido.
5. TOM DE VOZ: Elegante, caloroso, atencioso, acolhedor e poético, próprio de uma maison de perfumes clássica desde 1980.

CATÁLOGO REAL DA L'ACQUA DI FIORI:
${catalogContext}

UNIDADE OFICIAL:
Loja Centro & Tele-Entregas: Rua Senador Pompeu, 1020 - Centro / Fortaleza - CE. Telefone: (85) 3231-1507. WhatsApp: (85) 99660-5034. Horário de Atendimento: Segunda a Sábado das 08:00 às 17:00.`;

  // Helper para identificar intenção de navegação
  const qLower = userMessage.toLowerCase();
  let navigationTarget: { label: string; filter: { gender?: string; category?: string; search?: string } } | null = null;
  let whatsappPreFill: string = '';

  if (qLower.includes('masculin') || qLower.includes('homem') || qLower.includes('ladro') || qLower.includes('vezzo') || qLower.includes('ele')) {
    navigationTarget = {
      label: 'Ver todos os Perfumes Masculinos na Vitrine',
      filter: { gender: 'Masculino' },
    };
    whatsappPreFill = "Olá! Conversei com a Consultora Virtual sobre os perfumes masculinos (como Ladro e Vezzo) e gostaria de maiores informações e confirmar a disponibilidade!";
  } else if (qLower.includes('feminin') || qLower.includes('mulher') || qLower.includes('ototemo') || qLower.includes('cupidon') || qLower.includes('ela')) {
    navigationTarget = {
      label: 'Ver todos os Perfumes Femininos na Vitrine',
      filter: { gender: 'Feminino' },
    };
    whatsappPreFill = "Olá! Estava na consultoria virtual da loja vendo os perfumes femininos (como Ototemo Deep e Cupidon) e gostaria de saber mais detalhes e entrega!";
  } else if (qLower.includes('presente') || qLower.includes('kit') || qLower.includes('lembrancinha') || qLower.includes('aniversario')) {
    navigationTarget = {
      label: 'Ver Kits e Presentes Especiais na Vitrine',
      filter: { category: 'cat-kits' },
    };
    whatsappPreFill = "Olá! Gostaria de ajuda para montar um kit de presente personalizado da L'acqua di Fiori na loja física do Centro!";
  } else if (qLower.includes('promo') || qLower.includes('desconto') || qLower.includes('oferta') || qLower.includes('barato')) {
    navigationTarget = {
      label: 'Ver Ofertas e Promoções da Vitrine',
      filter: { category: 'cat-promos' },
    };
    whatsappPreFill = "Olá! Vi as promoções da vitrine na Consultoria Virtual e gostaria de aproveitar as ofertas de hoje!";
  }

  try {
    if (ai) {
      const chatMessages = (history || []).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));

      chatMessages.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatMessages,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text || 'Estou à disposição para apresentar nossas criações olfativas.';

      // Encontrar produtos mencionados
      const recommendedProducts = products.filter((p) =>
        reply.toLowerCase().includes(p.name.toLowerCase().split(' ')[0].toLowerCase())
      );

      return res.json({
        reply,
        recommendedProducts: recommendedProducts.slice(0, 4),
        navigationTarget,
        whatsappPreFill: whatsappPreFill || `Olá! Estava conversando com a Consultora Virtual da loja sobre "${userMessage}" e gostaria de atendimento humano para tirar dúvidas.`,
      });
    } else {
      // Fallback enriquecido de alta perfumaria caso o SDK não possua chave conectada
      let reply = '';
      let matchedProds: Product[] = [];

      if (qLower.includes('masculin') || qLower.includes('homem') || qLower.includes('ele')) {
        reply = `Com todo o prazer! A perfumaria masculina da **L'acqua di Fiori** é consagrada nacionalmente por unir virilidade, sofisticação e fixação de altíssimo nível. Nossas criações foram pensadas para destacar a presença masculina em diferentes momentos:

✨ **1. Ladro Desodorante Colônia (100ml - R$ 199,90):**
Nosso maior clássico atemporal. Um amadeirado aromático imponente e elegante, que abre com o frescor vibrante da bergamota e cardamomo verde, revelando um coração encorpado de cedro e nós-moscada sobre uma base quente de sândalo e âmbar. É o perfume da liderança e da autoconfiança.

🔥 **2. Vezzo Desodorante Colônia (100ml - R$ 199,90):**
Magnetismo e sedução. Um amadeirado especiado quente que combina a picância da canela e cravo com a nobreza de madeiras aveludadas e couro. Excelente para noites, clima ameno ou ocasiões onde você deseja ser lembrado.

⚡ **3. Piercing Ele (100ml - R$ 199,90):**
Moderno, dinâmico e provocante. Perfeito para homens jovens ou de espírito despojado que apreciam frescor com personalidade.

🌟 **4. Linha Paris Elysees — Vodka Wild & Caviar Black (a partir de R$ 79,90):**
Sucessos da perfumaria internacional com excelente custo-benefício, perfeitos para a rotina diária em Fortaleza.

Você pode **clicar no botão abaixo para ir direto à vitrine de masculinos** ou **conversar no WhatsApp com nossas consultoras da Loja Centro** para confirmar o teste olfativo e a tele-entrega:`;
        matchedProds = products.filter((p) => p.gender === 'Masculino').slice(0, 4);
      } else if (qLower.includes('feminin') || qLower.includes('mulher') || qLower.includes('ela')) {
        reply = `Uma escolha encantadora! As fragrâncias femininas da **L'acqua di Fiori** traduzem sensualidade, delicadeza e poder em criações autorais apaixonantes:

🌸 **1. Ototemo Deep (100ml - R$ 199,90):**
O ícone do mistério feminino. Um floral oriental marcante e envolvente com buquê de flores brancas ricas, nuances adocicadas e a cremosidade inebriante da baunilha de Madagascar. Deixa um rastro inesquecível.

💖 **2. Cupidon (100ml - R$ 199,90):**
A essência do romance. Um floral frutal radiante com notas alegres de lichia, maçã vermelha e pétalas de peônia, sobre uma base confortável de almíscar e madeiras suaves.

✨ **3. Poesia (100ml - R$ 119,90 - Edição Especial em Oferta):**
Delicadeza poética para quem aprecia elegância discreta e feminina no dia a dia.

🌺 **4. Paris Elysees — Billion Woman (100ml - R$ 79,90):**
Brilho e sofisticação dourada com excelente fixação para momentos festivos.

Deseja que eu filtre toda a nossa vitrine feminina para você, ou prefere falar no WhatsApp para tirar dúvidas com nossa equipe de Fortaleza?`;
        matchedProds = products.filter((p) => p.gender === 'Feminino').slice(0, 4);
      } else if (qLower.includes('presente') || qLower.includes('kit') || qLower.includes('lembrancinha')) {
        reply = `Presentear com **L'acqua di Fiori** é um gesto de puro requinte e carinho! Na nossa Loja física do Centro preparamos estojos artesanais com celofane especial, caixas rígidas e a lendária fita de cetim:

🎁 **1. Kit Mimo com Laço de Cetim (a partir de R$ 29,90):**
Lembrancinhas com sabonete perfumado e hidratante em miniatura, ideais para aniversários e agradecimentos.

🏆 **2. Estojos de Luxo Vezzo & Ladro (R$ 229,90):**
Fragrância clássica 100ml + Shower Gel ou sabonete perfumado em caixa rígida luxuosa.

🌸 **3. Combo Ototemo Deep & Emulsão Acetinada (R$ 229,80):**
Fragrância e hidratante para potencializar a fixação na pele o dia todo.

Monte seu kit personalizado! Podemos montar a cesta dos seus sonhos diretamente pelo WhatsApp da loja:`;
        matchedProds = products.filter((p) => p.categoryId === 'cat-kits' || p.isFeatured).slice(0, 4);
      } else if (qLower.includes('fresc') || qLower.includes('calor') || qLower.includes('dia a dia') || qLower.includes('fortaleza')) {
        reply = `Para o clima ensolarado e quente de Fortaleza, as fragrâncias com acordes cítricos, aromáticos e aquáticos são as melhores aliadas, trazendo sensação prolongada de banho tomado e frescor elegante:

🌊 **1. H2O Desodorante Colônia:**
Frescor revitalizante com notas de limão siciliano, lavanda e acordes aquáticos cristalinos. Não pesa mesmo nos dias mais quentes.

🍃 **2. Piercing Ele / Piercing Ela:**
Frescor jovem e equilibrado com alta versatilidade para trabalho, faculdade e passeios à beira-mar.

🍋 **3. Paris Elysees — Vodka Wild (R$ 79,90):**
Aroma fresco, vibrante e marcante para encarar a rotina com energia.`;
        matchedProds = products.filter((p) => p.olfactoryFamily.toLowerCase().includes('arom') || p.olfactoryFamily.toLowerCase().includes('fresc') || p.id === 'prod-pe-vodka').slice(0, 3);
      } else {
        reply = `Olá! Que alegria receber você na **Consultoria Olfativa Virtual da L'acqua di Fiori**!

Cada uma de nossas criações carrega mais de 40 anos de história da alta perfumaria brasileira, elaboradas com matérias-primas nobres, maceração cuidadosa e fixação duradoura.

Posso ajudar você a encontrar:
- 👔 **Fragrâncias Masculinas Marcantes** (como os lendários *Ladro* e *Vezzo*)
- 👗 **Fragrâncias Femininas Envolventes** (como *Ototemo Deep* e *Cupidon*)
- ☀️ **Perfumes Frescos e Cítricos** para o dia a dia e o clima de Fortaleza
- 🎁 **Kits e Estojos Especiais para Presente** (a partir de R$ 29,90)

Qual é a ocasião ou perfil sensorial que você tem em mente? Se desejar, clique nos botões abaixo para ver os produtos na vitrine ou chamar nossa consultora no WhatsApp!`;
        matchedProds = products.filter((p) => p.isFeatured || p.isBestSeller).slice(0, 3);
      }

      return res.json({
        reply,
        recommendedProducts: matchedProds,
        navigationTarget,
        whatsappPreFill: whatsappPreFill || "Olá! Gostaria de conversar com a equipe da Loja Centro sobre as fragrâncias da L'acqua di Fiori!",
      });
    }
  } catch (err: any) {
    console.error('Erro no consultor olfativo Gemini:', err);
    return res.status(500).json({
      error: 'Não foi possível consultar a IA no momento.',
      reply: 'Nossas consultoras estão à disposição diretamente no WhatsApp oficial da Loja Centro para apresentar nosso acervo de perfumes!',
      whatsappPreFill: 'Olá! Gostaria de tirar dúvidas com uma consultora da loja sobre as fragrâncias.',
    });
  }
});

// ==========================================
// Full-Stack Server Bootstrapping
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite Dev Server Middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`✨ L'acqua di Fiori Server running on http://localhost:${PORT}`);
  });
}

startServer();
