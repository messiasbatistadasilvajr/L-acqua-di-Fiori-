export type Role = 'ADMIN_GERAL' | 'GERENTE_FILIAL' | 'FUNCIONARIO' | 'ESTOQUISTA' | 'ATENDENTE';

export type OrderStatus =
  | 'NOVO_PEDIDO'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADO'
  | 'EM_PREPARACAO'
  | 'PRONTO_RETIRADA'
  | 'SAIU_ENTREGA'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type DeliveryType = 'RETIRADA_LOJA' | 'ENTREGA_DELIVERY';
export type PaymentMethod = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string; // Ex: 5511999999999
  openingHours: string;
  deliveryCoverageKm: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  volume: string; // 100ml, 50ml, 200ml
  originalPrice: number;
  promotionalPrice?: number;
  imageUrl: string;
  galleryImages?: string[];
  realStorePhotoUrl?: string;
  olfactoryFamily: string; // Amadeirado Especiado, Floral Oriental, Chipre, etc.
  topNotes: string; // Notas de Saída/Topo
  heartNotes: string; // Notas de Corpo/Coração
  baseNotes: string; // Notas de Fundo
  gender: 'Feminino' | 'Masculino' | 'Unissex';
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isLaunch?: boolean;
  isActive: boolean;
}

export interface BranchInventory {
  branchId: string;
  productId: string;
  quantity: number;
  minAlert: number;
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  branchId: string;
  productId: string;
  type: 'ENTRADA' | 'SAIDA_VENDA' | 'AJUSTE' | 'TRANSFERENCIA';
  quantity: number;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  lgpdConsent: boolean;
  totalSpent: number;
  ordersCount: number;
  lastOrderAt?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  volume: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface StoreGalleryItem {
  id: string;
  title: string;
  category: 'vitrine' | 'prateleiras' | 'presentes' | 'fachada' | 'promocoes';
  imageUrl: string;
  description: string;
  highlightedPrice?: string;
  badge?: string;
  featuredProducts?: {
    name: string;
    price: number;
    productId?: string;
  }[];
}

export interface Order {
  id: string;
  orderNumber: string; // Ex: #LDF-2026-0042
  branchId: string;
  branchName: string;
  branchWhatsapp: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTUAL' | 'FIXO';
  value: number;
  minOrder: number;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVolume?: string;
}
