import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { api } from '../../services/api';
import { Order, OrderStatus, Product, BranchInventory, Coupon, Customer, Branch } from '../../types';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  Store,
  Users,
  Tag,
  FileSpreadsheet,
  LogOut,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Plus,
  RefreshCw,
  Search,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

type AdminTab = 'dashboard' | 'orders' | 'inventory' | 'products' | 'customers' | 'coupons' | 'branches' | 'reports';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitAdmin }) => {
  const { user, logout } = useAuth();
  const { branches } = useBranch();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [filterBranchId, setFilterBranchId] = useState<string>(
    user?.role === 'GERENTE_FILIAL' && user.branchId ? user.branchId : 'all'
  );

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals inside Admin
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<any>(null);

  // Transfer form state
  const [transferFrom, setTransferFrom] = useState(branches[0]?.id || '');
  const [transferTo, setTransferTo] = useState(branches[1]?.id || branches[0]?.id || '');
  const [transferProduct, setTransferProduct] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Adjust form state
  const [adjustDelta, setAdjustDelta] = useState(5);
  const [adjustReason, setAdjustReason] = useState('Entrada de nota fiscal');

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('cat-masc');
  const [newProdPrice, setNewProdPrice] = useState('179.90');
  const [newProdVolume, setNewProdVolume] = useState('100ml');
  const [newProdFamily, setNewProdFamily] = useState('Amadeirado Elegante');
  const [newProdTopNotes, setNewProdTopNotes] = useState('Bergamota e Cardamomo');
  const [newProdHeartNotes, setNewProdHeartNotes] = useState('Cedro e Noz-Moscada');
  const [newProdBaseNotes, setNewProdBaseNotes] = useState('Âmbar e Sândalo');
  const [newProdGender, setNewProdGender] = useState<'Feminino' | 'Masculino' | 'Unissex'>('Masculino');
  const [newProdDesc, setNewProdDesc] = useState('');

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const bId = filterBranchId === 'all' ? undefined : filterBranchId;
      const [dash, ords, inv, prods, custs, coups] = await Promise.all([
        api.getDashboardMetrics(),
        api.getOrders(bId),
        api.getInventory(bId),
        api.getProducts(),
        api.getCustomers(),
        api.getCoupons(),
      ]);
      setMetrics(dash);
      setOrders(ords);
      setInventoryList(inv);
      setProductsList(prods);
      setCustomersList(custs);
      setCouponsList(coups);
      if (prods.length > 0 && !transferProduct) {
        setTransferProduct(prods[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados administrativos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [filterBranchId]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      // Reload inventory in case of cancellation
      if (newStatus === 'CANCELADO') {
        const inv = await api.getInventory(filterBranchId === 'all' ? undefined : filterBranchId);
        setInventoryList(inv);
      }
    } catch (err) {
      alert('Erro ao atualizar status do pedido');
    }
  };

  const handleNotifyWhatsApp = (order: Order) => {
    const statusMessages: Record<OrderStatus, string> = {
      NOVO_PEDIDO: `Olá ${order.customerName}! Recebemos seu pedido ${order.orderNumber} na L'acqua di Fiori e estamos analisando.`,
      AGUARDANDO_CONFIRMACAO: `Olá ${order.customerName}! Seu pedido ${order.orderNumber} está aguardando confirmação de pagamento. Chave PIX / Link disponível.`,
      CONFIRMADO: `Olá ${order.customerName}! Pagamento do pedido ${order.orderNumber} CONFIRMADO com sucesso! Já iniciamos a separação na ${order.branchName}.`,
      EM_PREPARACAO: `Olá ${order.customerName}! Seu pedido ${order.orderNumber} está sendo cuidadosamente embalado e preparado.`,
      PRONTO_RETIRADA: `Olá ${order.customerName}! Seu pedido ${order.orderNumber} está PRONTO PARA RETIRADA na ${order.branchName}! Esperamos por você.`,
      SAIU_ENTREGA: `Olá ${order.customerName}! Seu pedido ${order.orderNumber} SAIU PARA ENTREGA no seu endereço!`,
      CONCLUIDO: `Olá ${order.customerName}! Seu pedido ${order.orderNumber} foi concluído! Agradecemos a preferência pela L'acqua di Fiori.`,
      CANCELADO: `Olá ${order.customerName}. Informamos que seu pedido ${order.orderNumber} foi cancelado. Dúvidas estamos à disposição.`,
    };

    const msg = statusMessages[order.status] || `Atualização do pedido ${order.orderNumber} na L'acqua di Fiori.`;
    window.open(`https://wa.me/${order.customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    try {
      const res = await api.transferStock(transferFrom, transferTo, transferProduct, transferQty);
      if (res.success) {
        setShowTransferModal(false);
        loadAllData();
      } else {
        setTransferError(res.error || 'Erro na transferência');
      }
    } catch (err: any) {
      setTransferError(err.message || 'Falha ao executar transferência');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;
    try {
      await api.adjustStock(
        selectedProductForAdjust.branchId,
        selectedProductForAdjust.productId,
        adjustDelta,
        adjustReason
      );
      setShowAdjustModal(false);
      loadAllData();
    } catch (err: any) {
      alert('Falha no ajuste');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: newProdName,
        sku: newProdSku || `LDF-${Math.floor(Math.random() * 900 + 100)}`,
        categoryId: newProdCategory,
        originalPrice: Number(newProdPrice),
        volume: newProdVolume,
        olfactoryFamily: newProdFamily,
        topNotes: newProdTopNotes,
        heartNotes: newProdHeartNotes,
        baseNotes: newProdBaseNotes,
        gender: newProdGender,
        description: newProdDesc || 'Criação exclusiva da L\'acqua di Fiori com ingredientes nobres.',
      });
      setShowNewProductModal(false);
      setNewProdName('');
      loadAllData();
    } catch (err) {
      alert('Erro ao cadastrar produto');
    }
  };

  const handleToggleProductActive = async (prod: Product) => {
    try {
      await api.updateProduct(prod.id, { isActive: !prod.isActive });
      setProductsList((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (err) {
      alert('Erro ao alterar status do produto');
    }
  };

  const statusColors: Record<OrderStatus, string> = {
    NOVO_PEDIDO: 'bg-blue-100 text-blue-800 border-blue-200',
    AGUARDANDO_CONFIRMACAO: 'bg-amber-100 text-amber-800 border-amber-200',
    CONFIRMADO: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    EM_PREPARACAO: 'bg-purple-100 text-purple-800 border-purple-200',
    PRONTO_RETIRADA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    SAIU_ENTREGA: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    CONCLUIDO: 'bg-gray-100 text-gray-800 border-gray-200',
    CANCELADO: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#1E1E1E] flex flex-col">
      {/* Admin Top Navigation */}
      <header className="bg-[#111111] text-white border-b border-[#C5A059]/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center text-black font-serif-luxury font-bold text-sm shrink-0">
              L
            </div>
            <div>
              <span className="font-serif-luxury text-base sm:text-lg font-bold tracking-wider text-white block leading-none">
                L'ACQUA DI FIORI
              </span>
              <span className="text-[10px] tracking-widest text-[#4ADE80] uppercase font-bold">
                Painel Administrativo Oficial
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Branch Filter */}
            <div className="flex items-center gap-2 bg-[#1E1E1E] border border-neutral-700 rounded-xl px-2.5 py-1.5 min-h-[38px] text-xs">
              <Store className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                disabled={user?.role === 'GERENTE_FILIAL'}
                className="bg-transparent text-neutral-200 focus:outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-[#1E1E1E] text-white">Todas as Filiais</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1E1E1E] text-white">
                    {b.name.replace("L'acqua di Fiori — ", '')}
                  </option>
                ))}
              </select>
            </div>

            {/* User Profile Tag */}
            <div className="hidden lg:flex items-center gap-2 text-xs bg-[#1E1E1E] border border-neutral-700 px-3 py-1.5 min-h-[38px] rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span className="text-neutral-300">{user?.name}</span>
              <span className="text-[10px] bg-[#0D5C3A] text-white px-1.5 py-0.5 rounded font-bold">
                {user?.role}
              </span>
            </div>

            {/* Exit / Return to Store */}
            <button
              onClick={onExitAdmin}
              className="px-3.5 py-2 min-h-[38px] bg-[#C5A059] hover:bg-[#EBD399] active:scale-95 text-black font-semibold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
            >
              Ver Loja
            </button>

            <button
              onClick={() => {
                logout();
                onExitAdmin();
              }}
              className="p-2 min-w-[38px] min-h-[38px] text-neutral-400 hover:text-red-400 active:scale-95 transition-all rounded-xl hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs - Horizontal scroll on mobile, vertical stack on desktop */}
        <aside className="w-full md:w-64 bg-white rounded-2xl border border-[#E8E1D5] p-2.5 sm:p-3 shadow-xs shrink-0 self-start">
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1.5 pb-1 md:pb-0 text-xs no-scrollbar">
            {[
              { id: 'dashboard', label: 'Dashboard & Indicadores', icon: LayoutDashboard },
              { id: 'orders', label: 'Gestão de Pedidos', icon: ClipboardList, badge: orders.filter((o) => o.status === 'NOVO_PEDIDO').length },
              { id: 'inventory', label: 'Estoque Multiunidade', icon: Boxes },
              { id: 'products', label: 'Produtos & Catálogo', icon: Package },
              { id: 'customers', label: 'Clientes & LGPD', icon: Users },
              { id: 'coupons', label: 'Cupons & Campanhas', icon: Tag },
              { id: 'branches', label: 'Unidades & Lojas', icon: Store },
              { id: 'reports', label: 'Relatórios & Exportação', icon: FileSpreadsheet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`flex items-center justify-between px-3.5 py-2.5 min-h-[42px] rounded-xl font-medium transition-all shrink-0 md:shrink md:w-full whitespace-nowrap active:scale-98 cursor-pointer ${
                    isSelected
                      ? 'bg-[#111111] text-[#4ADE80] shadow-sm font-semibold'
                      : 'text-neutral-600 hover:bg-[#F9F7F2] hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#4ADE80]' : 'text-neutral-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="w-5 h-5 rounded-full bg-[#1B5E20] text-white text-[10px] font-bold flex items-center justify-center shrink-0 ml-2">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Body */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* TAB 1: DASHBOARD METRICS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Cards Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E8E1D5] shadow-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide block">
                    Faturamento Realizado
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#1B5E20] tabular-nums">
                      R$ {(metrics?.totalRevenue || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#0D5C3A] font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#25D366]" /> Pedidos pagos/concluídos
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8E1D5] shadow-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide block">
                    Total de Pedidos
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-neutral-900 tabular-nums">
                      {orders.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    <strong className="text-[#1B5E20]">{orders.filter((o) => o.status === 'NOVO_PEDIDO').length}</strong> aguardando atendimento
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8E1D5] shadow-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide block">
                    Ticket Médio
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#1B5E20] tabular-nums">
                      R$ {(metrics?.averageTicket || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Média por cliente atendido
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8E1D5] shadow-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide block">
                    Alertas de Estoque
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-amber-700 tabular-nums">
                      {metrics?.lowStockAlerts?.length || 0}
                    </span>
                    <span className="text-xs text-neutral-500">itens abaixo do mín.</span>
                  </div>
                  <span className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Requer reposição
                  </span>
                </div>
              </div>

              {/* Branch Performance Comparison */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D5] shadow-xs">
                <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 mb-4">
                  Desempenho Comercial por Filial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {branches.map((b) => {
                    const branchOrders = orders.filter((o) => o.branchId === b.id && o.status !== 'CANCELADO');
                    const branchRev = branchOrders.reduce((sum, o) => sum + o.total, 0);
                    return (
                      <div key={b.id} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2]">
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-neutral-900 text-sm font-serif-luxury">
                            {b.name.replace("L'acqua di Fiori — ", '')}
                          </strong>
                          <span className="text-[10px] bg-[#0D5C3A]/10 text-[#0D5C3A] font-bold px-2 py-0.5 rounded-full">
                            {b.city}/{b.state}
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-neutral-600">
                          <div className="flex justify-between">
                            <span>Faturamento:</span>
                            <strong className="text-[#1B5E20] font-bold tabular-nums">
                              R$ {branchRev.toFixed(2).replace('.', ',')}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Pedidos:</span>
                            <span className="font-semibold text-neutral-900 tabular-nums">
                              {branchOrders.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] pt-1 border-t border-[#E8E1D5]">
                            <span>WhatsApp:</span>
                            <a
                              href={`https://wa.me/${b.whatsapp}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1B5E20] font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <span>Abrir Loja</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D5] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif-luxury text-lg font-bold text-neutral-900">
                    Últimos Pedidos Recebidos
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#0D5C3A] font-bold hover:underline flex items-center gap-1 min-h-[36px] py-1 active:scale-95 cursor-pointer"
                  >
                    <span>Ver Todos os Pedidos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-[#F2ECE1] text-xs">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-neutral-900 font-semibold">{o.orderNumber}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[o.status]}`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          {o.customerName} · {o.branchName.replace("L'acqua di Fiori — ", '')} · {new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <strong className="text-[#1B5E20] font-bold tabular-nums text-sm">
                          R$ {o.total.toFixed(2).replace('.', ',')}
                        </strong>
                        <button
                          onClick={() => handleNotifyWhatsApp(o)}
                          className="min-w-[36px] min-h-[36px] bg-[#E8F8EE] text-[#1E7E34] hover:bg-[#D4F2DE] rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                          title="Falar no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT & KANBAN */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-neutral-900">
                    Gestão de Pedidos & Atendimento WhatsApp
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Atualize os status e dispare mensagens automáticas no WhatsApp com 1 clique.
                  </p>
                </div>
                <button
                  onClick={loadAllData}
                  className="px-4 py-2 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] hover:bg-[#F2EDE2] rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto active:scale-95 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#0D5C3A]" />
                  <span>Atualizar</span>
                </button>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E1D5] text-neutral-600 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-3">Pedido</th>
                      <th className="py-3 px-3">Cliente / WhatsApp</th>
                      <th className="py-3 px-3">Filial</th>
                      <th className="py-3 px-3">Itens</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE1]">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-neutral-900 block">{order.orderNumber}</span>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-neutral-800 block">{order.customerName}</span>
                          <span className="text-neutral-500 text-[11px]">{order.customerPhone}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-medium text-neutral-700">
                            {order.branchName.replace("L'acqua di Fiori — ", '')}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="max-w-[200px]">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="truncate text-[11px] text-neutral-600">
                                {it.quantity}x {it.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <strong className="text-[#1B5E20] font-bold tabular-nums text-sm">
                            R$ {order.total.toFixed(2).replace('.', ',')}
                          </strong>
                          <span className="block text-[10px] text-neutral-500">{order.paymentMethod}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className={`text-[11px] font-bold rounded-lg border px-2.5 py-1.5 min-h-[36px] cursor-pointer ${statusColors[order.status]}`}
                          >
                            <option value="NOVO_PEDIDO">Novo Pedido</option>
                            <option value="AGUARDANDO_CONFIRMACAO">Aguardando Confirmação</option>
                            <option value="CONFIRMADO">Confirmado</option>
                            <option value="EM_PREPARACAO">Em Preparação</option>
                            <option value="PRONTO_RETIRADA">Pronto para Retirada</option>
                            <option value="SAIU_ENTREGA">Saiu para Entrega</option>
                            <option value="CONCLUIDO">Concluído</option>
                            <option value="CANCELADO">Cancelado (Estorna Estoque)</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleNotifyWhatsApp(order)}
                            className="px-3 py-2 min-h-[38px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="Enviar atualização de status pelo WhatsApp do cliente"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                            <span>WhatsApp</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-BRANCH INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-neutral-900">
                    Controle de Estoque Multi-Filial
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Saldo em tempo real, alertas de estoque crítico e transferências entre lojas.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-4 py-2.5 min-h-[42px] bg-[#111111] hover:bg-[#1B5E20] text-[#EBD399] hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#4ADE80]" />
                    <span>Transferir entre Filiais</span>
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E1D5] text-neutral-600 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-3">Produto / SKU</th>
                      <th className="py-3 px-3">Filial</th>
                      <th className="py-3 px-3">Saldo Disponível</th>
                      <th className="py-3 px-3">Estoque Mínimo</th>
                      <th className="py-3 px-3">Situação</th>
                      <th className="py-3 px-3 text-right">Ajuste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE1]">
                    {inventoryList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-neutral-900 font-semibold block">{item.productName}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">{item.productSku} · {item.productVolume}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-neutral-700">
                          {item.branchName.replace("L'acqua di Fiori — ", '')}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#1B5E20] tabular-nums text-sm">
                          {item.quantity} un
                        </td>
                        <td className="py-3 px-3 text-neutral-500 tabular-nums">
                          {item.minAlert} un
                        </td>
                        <td className="py-3 px-3">
                          {item.quantity <= item.minAlert ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Estoque Crítico
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0D5C3A]/10 text-[#0D5C3A]">
                              <CheckCircle className="w-3 h-3 text-[#25D366]" />
                              Adequado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedProductForAdjust(item);
                              setShowAdjustModal(true);
                            }}
                            className="px-3 py-1.5 min-h-[36px] bg-white hover:bg-[#F2EDE2] border border-[#DDD3C2] text-neutral-700 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                          >
                            Entrada / Ajuste
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-neutral-900">
                    Catálogo de Perfumes & Criações
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Cadastre novas fragrâncias com pirâmide olfativa completa e fotos de alta resolução.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewProductModal(true)}
                  className="px-4 py-2.5 min-h-[42px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#4ADE80]" />
                  <span>Novo Perfume</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productsList.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-xl border border-[#E8E1D5] bg-[#FAF8F5] flex items-center gap-4"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-20 h-20 object-contain rounded-lg bg-white p-1 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-[#0D5C3A]">{prod.gender}</span>
                        <span className="text-[10px] text-neutral-400">·</span>
                        <span className="text-[10px] text-neutral-500">{prod.volume}</span>
                      </div>
                      <h4 className="font-serif-luxury font-bold text-sm text-neutral-900 truncate">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate">{prod.olfactoryFamily}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-bold text-[#1B5E20] text-base tabular-nums">
                          R$ {(prod.promotionalPrice || prod.originalPrice).toFixed(2).replace('.', ',')}
                        </span>
                        {prod.promotionalPrice && (
                          <span className="text-[10px] text-neutral-400 line-through tabular-nums">
                            R$ {prod.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleProductActive(prod)}
                        className={`px-3 py-1.5 min-h-[36px] text-[11px] font-semibold rounded-xl transition-all active:scale-95 cursor-pointer ${
                          prod.isActive
                            ? 'bg-[#0D5C3A]/10 text-[#0D5C3A] hover:bg-[#0D5C3A]/20 font-bold'
                            : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                        }`}
                      >
                        {prod.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMERS & LGPD */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-serif-luxury text-xl font-bold text-neutral-900">
                  Clientes & Fidelidade (Conforme LGPD)
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Base de clientes cadastrados através das compras pelo WhatsApp com histórico de consumo.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E1D5] text-neutral-600 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-3">Cliente</th>
                      <th className="py-3 px-3">WhatsApp</th>
                      <th className="py-3 px-3">Cidade / UF</th>
                      <th className="py-3 px-3">Total Compras</th>
                      <th className="py-3 px-3">Pedidos</th>
                      <th className="py-3 px-3 text-right">Contato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE1]">
                    {customersList.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-neutral-900 font-semibold block">{c.name}</strong>
                          <span className="text-[10px] text-[#0D5C3A] font-semibold">Consentimento LGPD Ativo</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-700">{c.phone}</td>
                        <td className="py-3 px-3 text-neutral-600">{c.city || 'Fortaleza'} - {c.state || 'CE'}</td>
                        <td className="py-3 px-3 font-bold text-[#1B5E20] tabular-nums text-sm">
                          R$ {c.totalSpent.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3 px-3 text-neutral-700 tabular-nums font-semibold">{c.ordersCount} pedidos</td>
                        <td className="py-3 px-3 text-right">
                          <a
                            href={`https://wa.me/${c.phone}?text=Ol%C3%A1%20${encodeURIComponent(c.name)}%2C%20da%20L'acqua%20di%20Fiori!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 min-h-[36px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white rounded-xl inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-semibold"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                            <span>WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-serif-luxury text-xl font-bold text-neutral-900">
                  Cupons & Campanhas Promocionais
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Cupons aplicáveis no checkout para incentivar fechamentos no WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {couponsList.map((coup) => (
                  <div key={coup.id} className="p-4 rounded-xl border border-[#DDD3C2] bg-[#FAF8F5] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-[#DDD3C2]">
                        {coup.code}
                      </span>
                      <span className="text-[10px] font-bold text-[#0D5C3A] bg-[#0D5C3A]/10 px-2.5 py-1 rounded-full">
                        Ativo
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Desconto:</span>
                        <strong className="text-[#1B5E20] font-bold">
                          {coup.discountType === 'PERCENTUAL' ? `${coup.value}% OFF` : `R$ ${coup.value} OFF`}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Pedido Mínimo:</span>
                        <span className="tabular-nums">R$ {coup.minOrder.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilizações:</span>
                        <span className="font-semibold text-neutral-900 tabular-nums">{coup.usageCount} vezes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: BRANCHES */}
          {activeTab === 'branches' && (
            <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-serif-luxury text-xl font-bold text-neutral-900">
                  Gestão da Unidade Oficial
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Endereço físico, canais oficiais de WhatsApp e horários de funcionamento.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 max-w-2xl gap-6">
                {branches.map((b) => (
                  <div key={b.id} className="p-5 rounded-xl border border-[#DDD3C2] bg-[#FAF8F5] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-luxury font-bold text-base text-neutral-900">
                        {b.name.replace("L'acqua di Fiori — ", '')}
                      </h4>
                      <span className="text-[10px] bg-[#0D5C3A] text-white font-bold px-2.5 py-1 rounded-full">
                        {b.code}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-600 space-y-2">
                      <p><strong>Endereço:</strong> {b.address}</p>
                      <p><strong>Cidade:</strong> {b.city} - {b.state}</p>
                      <p><strong>Telefone:</strong> <span className="text-[#1B5E20] font-bold">{b.phone}</span></p>
                      <p><strong>WhatsApp:</strong> <span className="text-[#1B5E20] font-bold">+{b.whatsapp}</span></p>
                      <p><strong>Horário:</strong> {b.openingHours}</p>
                    </div>

                    <div className="pt-2 border-t border-[#E8E1D5] flex justify-between items-center text-xs">
                      <a
                        href={`https://wa.me/${b.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 min-h-[38px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                        <span>Testar WhatsApp Oficial</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: REPORTS & CSV EXPORT */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-neutral-900">
                    Relatórios & Auditoria de Vendas
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Exporte o histórico consolidado de pedidos em formato CSV para planilhas e contabilidade.
                  </p>
                </div>
                <a
                  href={`/api/reports/export/orders.csv?token=${encodeURIComponent(localStorage.getItem('ldf_token') || '')}`}
                  download="pedidos_lacqua_di_fiori.csv"
                  className="px-4 py-2.5 min-h-[44px] bg-[#111111] hover:bg-[#1B5E20] text-[#EBD399] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#4ADE80]" />
                  <span>Baixar Relatório CSV</span>
                </a>
              </div>

              <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs space-y-3">
                <h4 className="font-semibold text-neutral-900">Resumo dos Indicadores:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-white rounded-lg border border-[#E8E1D5]">
                    <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Volume de Pedidos</span>
                    <strong className="text-base text-neutral-900">{orders.length}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#E8E1D5]">
                    <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Vendas Totais</span>
                    <strong className="text-base text-[#1B5E20] font-bold">R$ {(metrics?.totalRevenue || 0).toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#E8E1D5]">
                    <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Filiais Operando</span>
                    <strong className="text-base text-neutral-900">{branches.length}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#E8E1D5]">
                    <span className="text-neutral-500 block text-[10px] uppercase font-semibold">SKUs Cadastrados</span>
                    <strong className="text-base text-neutral-900">{productsList.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: TRANSFERÊNCIA ENTRE FILIAIS */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#C5A059]/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="font-serif-luxury text-lg font-bold text-neutral-900">
                Transferência de Estoque
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferError && (
              <p className="p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">
                {transferError}
              </p>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Filial de Origem (Saída)</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Filial de Destino (Entrada)</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Perfume a Transferir</label>
                <select
                  value={transferProduct}
                  onChange={(e) => setTransferProduct(e.target.value)}
                  className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl cursor-pointer"
                >
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.volume})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Quantidade de Frascos</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl font-bold text-neutral-900"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 min-h-[42px] text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium active:scale-95 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[42px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white font-bold rounded-xl active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Confirmar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE / ENTRADA MANUAL DE ESTOQUE */}
      {showAdjustModal && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#C5A059]/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="font-serif-luxury text-lg font-bold text-neutral-900">
                Ajuste Manual de Estoque
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Item: <strong>{selectedProductForAdjust.productName}</strong> na <strong>{selectedProductForAdjust.branchName}</strong>. Saldo atual: <strong className="text-[#1B5E20]">{selectedProductForAdjust.quantity} un</strong>.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Variação (+ entrada ou - saída)</label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl text-sm font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Motivo / Justificativa</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2.5 min-h-[42px] text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium active:scale-95 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[42px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white font-bold rounded-xl active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Salvar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO PRODUTO */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#C5A059]/40 p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="font-serif-luxury text-lg font-bold text-neutral-900">
                Cadastrar Novo Perfume
              </h3>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Nome do Perfume *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Ex: Ladro Intenso"
                    className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Código / SKU</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="Ex: LDF-INT-100"
                    className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Categoria</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl cursor-pointer"
                  >
                    <option value="cat-masc">Masculino</option>
                    <option value="cat-fem">Feminino</option>
                    <option value="cat-unissex">Unissex</option>
                    <option value="cat-kits">Kits & Presentes</option>
                    <option value="cat-cuidados">Cuidados</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Volume</label>
                  <input
                    type="text"
                    value={newProdVolume}
                    onChange={(e) => setNewProdVolume(e.target.value)}
                    className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Preço (R$) *</label>
                  <input
                    type="text"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl font-bold text-[#1B5E20]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Família Olfativa</label>
                <input
                  type="text"
                  value={newProdFamily}
                  onChange={(e) => setNewProdFamily(e.target.value)}
                  placeholder="Ex: Amadeirado Oriental Especiado"
                  className="w-full p-2.5 min-h-[40px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Notas de Saída</label>
                  <input
                    type="text"
                    value={newProdTopNotes}
                    onChange={(e) => setNewProdTopNotes(e.target.value)}
                    className="w-full p-2 min-h-[38px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Notas de Corpo</label>
                  <input
                    type="text"
                    value={newProdHeartNotes}
                    onChange={(e) => setNewProdHeartNotes(e.target.value)}
                    className="w-full p-2 min-h-[38px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Notas de Fundo</label>
                  <input
                    type="text"
                    value={newProdBaseNotes}
                    onChange={(e) => setNewProdBaseNotes(e.target.value)}
                    className="w-full p-2 min-h-[38px] bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Descrição Comercial</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Descrição sedutora e elegante da fragrância..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl resize-none"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2.5 min-h-[42px] text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium active:scale-95 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[42px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white font-bold rounded-xl active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Salvar Perfume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
