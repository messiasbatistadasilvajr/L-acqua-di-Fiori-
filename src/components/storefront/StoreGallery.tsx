import React, { useState } from 'react';
import { StoreGalleryItem, Product } from '../../types';
import { STORE_GALLERY_ITEMS } from '../../data/seedData';
import { useBranch } from '../../context/BranchContext';
import { useCart } from '../../context/CartContext';
import {
  Camera,
  Eye,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Truck,
  CheckCircle2,
  Tag,
} from 'lucide-react';

interface StoreGalleryProps {
  onSelectProduct?: (product: Product) => void;
  products?: Product[];
}

export const StoreGallery: React.FC<StoreGalleryProps> = ({ onSelectProduct, products = [] }) => {
  const { selectedBranch } = useBranch();
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activePhoto, setActivePhoto] = useState<StoreGalleryItem | null>(null);

  const categories = [
    { id: 'todos', label: 'Todas as Fotos (10)' },
    { id: 'prateleiras', label: 'Fragrâncias & Prateleiras' },
    { id: 'presentes', label: 'Kits & Presentes' },
    { id: 'vitrine', label: 'Vitrines Especiais' },
    { id: 'promocoes', label: 'Ofertas & Entregas' },
    { id: 'fachada', label: 'Fachada da Loja' },
  ];

  const filteredItems = STORE_GALLERY_ITEMS.filter((item) => {
    if (selectedCategory === 'todos') return true;
    return item.category === selectedCategory;
  });

  const handleOpenPhoto = (item: StoreGalleryItem) => {
    setActivePhoto(item);
  };

  const handleNextPhoto = () => {
    if (!activePhoto) return;
    const currentIndex = STORE_GALLERY_ITEMS.findIndex((i) => i.id === activePhoto.id);
    const nextIndex = (currentIndex + 1) % STORE_GALLERY_ITEMS.length;
    setActivePhoto(STORE_GALLERY_ITEMS[nextIndex]);
  };

  const handlePrevPhoto = () => {
    if (!activePhoto) return;
    const currentIndex = STORE_GALLERY_ITEMS.findIndex((i) => i.id === activePhoto.id);
    const prevIndex = (currentIndex - 1 + STORE_GALLERY_ITEMS.length) % STORE_GALLERY_ITEMS.length;
    setActivePhoto(STORE_GALLERY_ITEMS[prevIndex]);
  };

  const handleProductClick = (productId?: string) => {
    if (!productId || !onSelectProduct) return;
    const found = products.find((p) => p.id === productId);
    if (found) {
      onSelectProduct(found);
    }
  };

  const handleWhatsAppForPhoto = (item: StoreGalleryItem) => {
    const text = `Olá! Estava visualizando as fotos da loja na galeria (*${item.title}*) e gostaria de tirar dúvidas sobre os produtos e valores desta foto. Vocês têm disponibilidade na *${selectedBranch.name}*?`;
    window.open(`https://wa.me/${selectedBranch.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section id="galeria" className="py-16 bg-[#F4EFE6]/60 border-t border-b border-[#E8E1D5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#DDD3C2]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#1B5E20] font-bold mb-2 bg-[#E8F5E9] px-3 py-1 rounded-md w-fit">
              <Camera className="w-4 h-4 text-[#1B5E20]" />
              <span>Fotos Reais da Nossa Boutique & Vitrines</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
              Galeria Oficial da Perfumaria
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-2xl">
              Transparência e elegância: veja as fotos tiradas diretamente de nossas prateleiras na <strong className="text-[#1B5E20]">Loja Centro & Tele-Entregas</strong>, com valores atualizados, estojos para presente e sacolas prontas para entrega expressa.
            </p>
          </div>

          {/* Tele-entrega quick notice badge */}
          <div className="mt-4 md:mt-0 p-3.5 bg-white rounded-xl border border-[#A5D6A7] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0D5C3A] text-[#EBD399] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-[#1B5E20] tracking-wider block">
                Tele-Entregas Rápidas no Dia
              </span>
              <span className="text-xs font-bold text-[#1B5E20] block">
                Ligue: (85) 3231-1507 / WhatsApp
              </span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 touch-manipulation cursor-pointer flex items-center justify-center ${
                selectedCategory === cat.id
                  ? 'bg-[#0D5C3A] text-white shadow-sm'
                  : 'bg-white text-neutral-700 hover:bg-[#EAE3D6] border border-[#DDD3C2]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenPhoto(item)}
              className="group bg-white rounded-2xl border border-[#E0D7C6] overflow-hidden hover:border-[#1B5E20] hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* Photo Display */}
              <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Badges Overlay */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                  {item.badge && (
                    <span className="bg-[#0D5C3A]/90 backdrop-blur-xs text-[#EBD399] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-xs border border-[#C5A059]/30">
                      {item.badge}
                    </span>
                  )}
                  {item.highlightedPrice && (
                    <span className="bg-[#FAF8F5]/95 backdrop-blur-xs text-[#1B5E20] text-[10px] font-bold px-2 py-1 rounded-sm shadow-xs border border-[#A5D6A7]">
                      {item.highlightedPrice}
                    </span>
                  )}
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-4 py-2 bg-white/95 text-neutral-900 text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#1B5E20]" />
                    <span>Ampliar & Ver Produtos</span>
                  </span>
                </div>
              </div>

              {/* Photo Caption & Information */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 group-hover:text-[#1B5E20] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Featured Products Pills in this photo */}
                {item.featuredProducts && item.featuredProducts.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#F2ECE1]">
                    <span className="text-[10px] uppercase font-bold text-[#1B5E20] tracking-wider block mb-2">
                      Fragrâncias e Itens na Foto:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.featuredProducts.slice(0, 3).map((prod, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(prod.productId);
                          }}
                          className="min-h-[34px] px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#E8F5E9] text-neutral-800 text-[11px] font-medium rounded-lg border border-[#DDD3C2] hover:border-[#A5D6A7] transition-all flex items-center gap-1 active:scale-95 touch-manipulation cursor-pointer"
                        >
                          <Tag className="w-3 h-3 text-[#1B5E20]" />
                          <span>{prod.name}</span>
                          <strong className="text-[#1B5E20]">R$ {prod.price.toFixed(2).replace('.', ',')}</strong>
                        </button>
                      ))}
                      {item.featuredProducts.length > 3 && (
                        <span className="text-[11px] text-neutral-500 self-center">
                          +{item.featuredProducts.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Highlighted Banner on Real Store & WhatsApp Service */}
        <div className="mt-12 bg-linear-to-r from-[#111111] via-[#1A2E20] to-[#111111] rounded-2xl p-6 sm:p-8 border border-[#2E7D32]/40 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#25D366] font-bold">
              <Sparkles className="w-4 h-4 text-[#25D366]" />
              <span>Garantia de Autenticidade & Atendimento Humanizado</span>
            </div>
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold">
              Viu algum produto nas fotos que deseja encomendar?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
              Nossa equipe da <strong className="text-white">{selectedBranch.name}</strong> em Fortaleza está pronta para fotografar o lote, enviar fotos adicionais de kits e montar sua encomenda personalizada com tele-entrega expressa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <a
              href={`https://wa.me/${selectedBranch.whatsapp}?text=Ol%C3%A1%2C%20vi%20as%20fotos%20da%20vitrine%20na%20galeria%20da%20L'acqua%20di%20Fiori%20e%20gostaria%20de%20fazer%20um%20pedido%20na%20${encodeURIComponent(selectedBranch.name)}!`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 bg-[#1B5E20] hover:bg-[#144A19] active:scale-[0.98] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all touch-manipulation cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Pedir Fotos no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal for Selected Photo */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md overflow-y-auto"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-[#1A1A1A] rounded-2xl border border-[#C5A059]/40 overflow-hidden shadow-2xl my-6 flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/20 active:scale-90 transition-all touch-manipulation cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 active:scale-90 transition-all touch-manipulation cursor-pointer"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 active:scale-90 transition-all touch-manipulation cursor-pointer"
              aria-label="Próxima foto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image Preview Container */}
            <div className="md:w-3/5 bg-black flex items-center justify-center p-4 relative min-h-[350px] sm:min-h-[480px]">
              <img
                src={activePhoto.imageUrl}
                alt={activePhoto.title}
                className="max-h-[560px] w-auto max-w-full object-contain rounded-lg"
              />
              {activePhoto.badge && (
                <span className="absolute bottom-4 left-4 bg-[#0D5C3A]/90 text-[#EBD399] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-[#C5A059]/40">
                  {activePhoto.badge}
                </span>
              )}
            </div>

            {/* Information Column */}
            <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between bg-[#151515] text-white space-y-6">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#25D366] font-bold block mb-1">
                  Foto Real da Vitrine
                </span>
                <h3 className="font-serif-luxury text-2xl font-bold text-white leading-tight">
                  {activePhoto.title}
                </h3>

                {activePhoto.highlightedPrice && (
                  <div className="mt-3 inline-block px-3 py-1 bg-[#0D5C3A] rounded-md text-xs font-bold text-white border border-[#25D366]/40">
                    {activePhoto.highlightedPrice}
                  </div>
                )}

                <p className="mt-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {activePhoto.description}
                </p>

                {/* Items displayed in photo */}
                {activePhoto.featuredProducts && activePhoto.featuredProducts.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-neutral-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#25D366] block mb-3">
                      Produtos Disponíveis Nesta Foto:
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activePhoto.featuredProducts.map((prod, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block">{prod.name}</span>
                            <span className="text-[#25D366] font-bold">
                              R$ {prod.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          {prod.productId && (
                            <button
                              type="button"
                              onClick={() => {
                                handleProductClick(prod.productId);
                                setActivePhoto(null);
                              }}
                              className="min-h-[36px] px-3.5 py-1.5 bg-[#1B5E20] hover:bg-[#144A19] active:scale-95 text-white font-bold rounded-lg text-[11px] transition-all shrink-0 touch-manipulation cursor-pointer"
                            >
                              Ver Detalhes
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-neutral-800 space-y-3">
                <button
                  type="button"
                  onClick={() => handleWhatsAppForPhoto(activePhoto)}
                  className="w-full min-h-[50px] py-3.5 px-4 bg-[#1B5E20] hover:bg-[#144A19] active:scale-[0.98] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1B5E20]/30 touch-manipulation cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Pedir Itens Desta Foto pelo WhatsApp</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Valores conferidos e fotos tiradas na loja física</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
