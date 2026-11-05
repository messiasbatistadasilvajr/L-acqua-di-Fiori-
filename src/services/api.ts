import { Branch, Category, Product, BranchInventory, Order, Coupon, Customer, StoreGalleryItem, User } from '../types';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('ldf_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  login: async (email: string, password: string): Promise<{ success: boolean; token: string; user: User }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Credenciais inválidas');
    }
    return data;
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Sessão inválida');
    }
    return data;
  },

  // Gallery
  getGallery: async (): Promise<StoreGalleryItem[]> => {
    const res = await fetch('/api/gallery');
    return res.json();
  },

  // Branches
  getBranches: async (): Promise<Branch[]> => {
    const res = await fetch('/api/branches');
    return res.json();
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const res = await fetch('/api/categories');
    return res.json();
  },

  // Products
  getProducts: async (params?: { category?: string; search?: string; gender?: string; branchId?: string }): Promise<Product[]> => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.gender) query.append('gender', params.gender);
    if (params?.branchId) query.append('branchId', params.branchId);

    const res = await fetch(`/api/products?${query.toString()}`);
    return res.json();
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`);
    return res.json();
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar produto');
    }
    return res.json();
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar produto');
    }
    return res.json();
  },

  deleteProduct: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao remover produto');
    }
    return res.json();
  },

  // Inventory
  getInventory: async (branchId?: string): Promise<(BranchInventory & { productName: string; productSku: string; branchName: string; isLowStock: boolean })[]> => {
    const url = branchId ? `/api/inventory?branchId=${branchId}` : '/api/inventory';
    const res = await fetch(url);
    return res.json();
  },

  adjustStock: async (branchId: string, productId: string, delta: number, reason?: string) => {
    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ branchId, productId, delta, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao ajustar estoque');
    }
    return res.json();
  },

  transferStock: async (fromBranchId: string, toBranchId: string, productId: string, quantity: number) => {
    const res = await fetch('/api/inventory/transfer', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fromBranchId, toBranchId, productId, quantity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao transferir estoque');
    }
    return res.json();
  },

  // Orders
  getOrders: async (branchId?: string, status?: string): Promise<Order[]> => {
    const query = new URLSearchParams();
    if (branchId) query.append('branchId', branchId);
    if (status) query.append('status', status);

    const res = await fetch(`/api/orders?${query.toString()}`);
    return res.json();
  },

  createOrder: async (orderData: any): Promise<{ success: boolean; order: Order; formattedMessage: string; whatsappUrl: string }> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar pedido');
    }
    return res.json();
  },

  updateOrderStatus: async (id: string, status: string): Promise<{ success: boolean; order: Order }> => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar status');
    }
    return res.json();
  },

  // Coupons
  validateCoupon: async (code: string, subtotal: number): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    return res.json();
  },

  getCoupons: async (): Promise<Coupon[]> => {
    const res = await fetch('/api/coupons');
    return res.json();
  },

  createCoupon: async (couponData: Partial<Coupon>): Promise<Coupon> => {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(couponData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar cupom');
    }
    return res.json();
  },

  // Customers (protegido)
  getCustomers: async (): Promise<Customer[]> => {
    const res = await fetch('/api/customers', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  // Dashboard KPI (protegido)
  getDashboardMetrics: async () => {
    const res = await fetch('/api/reports/dashboard', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao obter métricas');
    }
    return res.json();
  },

  // AI Olfactory Consultant
  consultFragranceAI: async (userMessage: string, history?: { role: string; content: string }[]) => {
    const res = await fetch('/api/ai/consultant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, history }),
    });
    return res.json();
  },
};
