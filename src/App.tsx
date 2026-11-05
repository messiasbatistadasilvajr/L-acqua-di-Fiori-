import React, { useState, useEffect } from 'react';
import { BranchProvider, useBranch } from './context/BranchContext';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Product, Category } from './types';

// Layout & Storefront Components
import { TopBanner } from './components/layout/TopBanner';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/storefront/HeroSection';
import { CategoryBar } from './components/storefront/CategoryBar';
import { StoreGallery } from './components/storefront/StoreGallery';
import { ProductCard } from './components/product/ProductCard';
import { ProductModal } from './components/product/ProductModal';
import { BranchSelectorModal } from './components/branch/BranchSelectorModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { AIConsultantModal } from './components/ai/AIConsultantModal';
import { WhatsAppFloatingButton } from './components/whatsapp/WhatsAppFloatingButton';
import { LoginModal } from './components/auth/LoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Sparkles, Award, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

const StoreContent: React.FC = () => {
  const { selectedBranch } = useBranch();
  const { user } = useAuth();

  // Navigation & Modals
  const [isAdminView, setIsAdminView] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isAIConsultantOpen, setIsAIConsultantOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Catalog State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedGender, setSelectedGender] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);

  // Load Categories & Products with branch-level inventory
  const fetchProducts = async () => {
    setIsLoadingCatalog(true);
    try {
      const [cats, prods] = await Promise.all([
        api.getCategories(),
        api.getProducts({
          category: selectedCategory,
          gender: selectedGender !== 'Todos' ? selectedGender : undefined,
          search: searchQuery || undefined,
          branchId: selectedBranch.id,
        }),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error('Erro ao carregar catálogo:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedGender, searchQuery, selectedBranch.id]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If in Admin Mode, show full Admin Dashboard
  if (isAdminView) {
    return <AdminDashboard onExitAdmin={() => setIsAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E1E1E] flex flex-col selection:bg-[#C5A059] selection:text-white">
      {/* 1. Subtle Luxury Top Announcement Banner */}
      <TopBanner />

      {/* 2. Top Bar Contract Header */}
      <Header
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onOpenAIConsultant={() => setIsAIConsultantOpen(true)}
        onScrollToSection={scrollToSection}
        onToggleAdminView={() => setIsAdminView(true)}
        isAdminView={isAdminView}
      />

      {/* 3. Hero Section with Luxury Campaign Visual */}
      <HeroSection
        onExploreCatalog={() => scrollToSection('catalogo')}
        onOpenAIConsultant={() => setIsAIConsultantOpen(true)}
      />

      {/* 4. Filter Bar (Search, Category Tabs, Gender Tabs) */}
      <div id="catalogo">
        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGender={selectedGender}
          onSelectGender={setSelectedGender}
        />
      </div>

      {/* 5. Main Product Showcase Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-4 border-b border-[#E8E1D5]">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#0D5C3A] font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#1B5E20]" />
              <span>Coleção Oficial L'acqua di Fiori</span>
            </div>
            <h2 className="font-serif-luxury text-3xl font-bold text-neutral-900">
              Fragrâncias Exclusivas & Cosméticos
            </h2>
          </div>
          <span className="text-xs text-neutral-500 mt-2 sm:mt-0 font-medium">
            Mostrando <strong className="text-[#1B5E20] font-bold">{products.length}</strong> produtos disponíveis na <strong className="text-neutral-900">{selectedBranch.name}</strong>
          </span>
        </div>

        {/* Product Cards Grid */}
        {isLoadingCatalog ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-[#E8E1D5] p-5 h-96 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#E8E1D5] p-8">
            <p className="font-serif-luxury text-xl text-neutral-800">
              Nenhuma fragrância encontrada com os filtros selecionados.
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              Tente redefinir a busca ou selecione outra categoria.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('todos');
                setSelectedGender('Todos');
                setSearchQuery('');
              }}
              className="mt-4 px-5 py-2.5 min-h-[44px] bg-[#111111] hover:bg-[#1B5E20] text-[#EBD399] hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              Ver Catálogo Completo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={(p) => setSelectedProductForModal(p)}
                branchStock={(product as any).branchStock}
              />
            ))}
          </div>
        )}

        {/* 6. Special Heritage & Art of Perfumery Section */}
        <section id="destaques" className="mt-24 p-8 sm:p-12 rounded-3xl bg-[#111111] text-white relative overflow-hidden border border-[#C5A059]/40 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#4ADE80] font-bold block">
                Herança & Criação Artística
              </span>
              <h3 className="font-serif-luxury text-3xl sm:text-4xl font-bold leading-tight text-white">
                Mais de 40 anos despertando emoções com assinatura olfativa única.
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Cada criação da L'acqua di Fiori passa por um minucioso processo de maceração e equilíbrio entre notas nobres de saída, corpo e fixação duradoura. 
                De aromas viris e amadeirados como o <strong>Ladro</strong> a buquês florais apaixonantes como <strong>Ototemo</strong> e <strong>Cupidon</strong>, nossas essências contam histórias.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#4ADE80]" />
                  <span>Matérias-Primas Importadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
                  <span>Fixação de Longa Duração</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#4ADE80]" />
                  <span>Fórmula Não Testada em Animais</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="/src/assets/images/perfume_ladro_luxury_1793757508691.jpg"
                alt="Fragrância Clássica Ladro"
                className="w-full max-h-[380px] object-contain rounded-2xl bg-neutral-900/60 p-4 border border-[#C5A059]/30"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>

        {/* 7. Kits & Gift Showcase */}
        <section id="kits" className="mt-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-widest text-[#0D5C3A] font-bold block mb-1">
              Para Momentos Especiais
            </span>
            <h3 className="font-serif-luxury text-3xl font-bold text-neutral-900">
              Kits & Embalagens Exclusivas para Presente
            </h3>
            <p className="text-xs text-neutral-600 mt-2">
              Presenteie com o charme e requinte das nossas caixas rígidas douradas com laço de cetim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D5C3A] block mb-1">
                  Kit Masculino de Prestígio
                </span>
                <h4 className="font-serif-luxury font-bold text-xl text-neutral-900">
                  Estojo Luxo Vezzo
                </h4>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  Colônia 100ml + Shower Gel corporal perfumado em caixa rígida para homens autênticos.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
                <span className="font-bold text-xl text-[#1B5E20] tabular-nums">R$ 229,90</span>
                <button
                  onClick={() => {
                    const kit = products.find((p) => p.categoryId === 'cat-kits');
                    if (kit) setSelectedProductForModal(kit);
                  }}
                  className="px-4 py-2.5 min-h-[42px] bg-[#111111] hover:bg-[#1B5E20] text-[#EBD399] hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D5C3A] block mb-1">
                  Romance & Encanto
                </span>
                <h4 className="font-serif-luxury font-bold text-xl text-neutral-900">
                  Combo Ototemo Deep & Emulsão
                </h4>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  A fragrância clássica aliada ao hidratante acetinado com manteiga de karité para máxima fixação.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
                <span className="font-bold text-xl text-[#1B5E20] tabular-nums">R$ 229,80</span>
                <button
                  onClick={() => {
                    const oto = products.find((p) => p.id === 'prod-ototemo');
                    if (oto) setSelectedProductForModal(oto);
                  }}
                  className="px-4 py-2.5 min-h-[42px] bg-[#111111] hover:bg-[#1B5E20] text-[#EBD399] hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#F2EDE2] border border-[#DDD3C2] flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D5C3A] block mb-1">
                  Atendimento Especial
                </span>
                <h4 className="font-serif-luxury font-bold text-xl text-neutral-900">
                  Monte seu Kit Personalizado
                </h4>
                <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
                  Escolha os produtos e fale com nossa consultora no WhatsApp para montar uma cesta ou caixa personalizada.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E0D7C6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wide">Sob consulta</span>
                <a
                  href={`https://wa.me/${selectedBranch.whatsapp}?text=Ol%C3%A1%2C%20gostaria%20de%20montar%20um%20kit%20personalizado%20para%20presente%20na%20${encodeURIComponent(selectedBranch.name)}!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>Chamar no WhatsApp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Galeria Oficial da Loja & Vitrines Reais */}
      <StoreGallery
        products={products}
        onSelectProduct={(p) => setSelectedProductForModal(p)}
      />

      {/* 9. Footer */}
      <Footer />

      {/* 9. Floating WhatsApp Support Button */}
      <WhatsAppFloatingButton onOpenAIConsultant={() => setIsAIConsultantOpen(true)} />

      {/* 10. Modals & Overlays */}
      <BranchSelectorModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
      />

      <ProductModal
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
      />

      <CartDrawer onOpenBranchModal={() => setIsBranchModalOpen(true)} />

      <CheckoutModal />

      <AIConsultantModal
        isOpen={isAIConsultantOpen}
        onClose={() => setIsAIConsultantOpen(false)}
        onSelectProduct={(p) => setSelectedProductForModal(p)}
        onNavigateToCatalog={(filter) => {
          if (filter?.gender) {
            setSelectedGender(filter.gender);
          } else {
            setSelectedGender('Todos');
          }
          if (filter?.category) {
            setSelectedCategory(filter.category);
          } else {
            setSelectedCategory('todos');
          }
          if (filter?.search) {
            setSearchQuery(filter.search);
          }
          setIsAIConsultantOpen(false);
          scrollToSection('catalogo');
        }}
      />

      <LoginModal />
    </div>
  );
};

export default function App() {
  return (
    <BranchProvider>
      <CartProvider>
        <AuthProvider>
          <StoreContent />
        </AuthProvider>
      </CartProvider>
    </BranchProvider>
  );
}
