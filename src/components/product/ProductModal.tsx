import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useBranch } from '../../context/BranchContext';
import { X, ShoppingBag, MessageCircle, MapPin, Sparkles, Droplets, CheckCircle2 } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { selectedBranch, branches } = useBranch();
  const [activeImage, setActiveImage] = React.useState<string>(product?.imageUrl || '');

  React.useEffect(() => {
    if (product) {
      setActiveImage(product.imageUrl);
    }
  }, [product]);

  if (!product) return null;

  const currentPrice = product.promotionalPrice || product.originalPrice;
  const isPromo = product.promotionalPrice && product.promotionalPrice < product.originalPrice;

  const allImages = Array.from(
    new Set([
      product.imageUrl,
      ...(product.galleryImages || []),
      ...(product.realStorePhotoUrl ? [product.realStorePhotoUrl] : []),
    ])
  ).filter(Boolean);

  const handleWhatsApp = () => {
    const msg = `Olá! Gostaria de comprar o perfume *${product.name}* (${product.volume}) no valor de R$ ${currentPrice.toFixed(2).replace('.', ',')}. Como faço para finalizar com a *${selectedBranch.name}*?`;
    window.open(`https://wa.me/${selectedBranch.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAdd = () => {
    addToCart(product, 1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#C5A059]/40 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-700 flex items-center justify-center border border-[#DDD3C2] active:scale-95 transition-all shadow-xs touch-manipulation cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Column */}
          <div className="bg-[#F4EFE6] p-6 flex flex-col items-center justify-between relative">
            <div className="w-full flex-1 flex items-center justify-center min-h-[260px] max-h-[360px] p-2">
              <img
                src={activeImage || product.imageUrl}
                alt={product.name}
                className="max-h-[320px] w-auto max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {isPromo && (
              <span className="absolute top-4 left-4 bg-[#0D5C3A] text-[#EBD399] text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-xs border border-[#C5A059]/40">
                Oferta Especial
              </span>
            )}

            {/* Gallery Thumbnails (Studio render vs Real store shelf) */}
            {allImages.length > 1 && (
              <div className="w-full mt-4 pt-3 border-t border-[#E8E1D5] flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {allImages.map((img, idx) => {
                  const isStorePic = img.includes('/assets/aistudio/');
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-14 h-14 min-w-[56px] min-h-[56px] rounded-lg overflow-hidden border-2 shrink-0 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                        activeImage === img
                          ? 'border-[#0D5C3A] ring-2 ring-[#0D5C3A]/30 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                      {isStorePic && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#0D5C3A]/90 text-[8px] text-[#EBD399] font-bold text-center py-0.5 leading-none">
                          LOJA
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Olfactory Family with Noble Green Lettering */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#1B5E20] font-bold mb-1">
                <span>{product.brand}</span>
                <span>·</span>
                <span>{product.gender}</span>
                <span>·</span>
                <span>{product.volume}</span>
              </div>

              <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">
                {product.name}
              </h2>

              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                {product.description}
              </p>

              {/* Price with Standout Green */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-[#1B5E20] tabular-nums">
                  R$ {currentPrice.toFixed(2).replace('.', ',')}
                </span>
                {isPromo && (
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                )}
                <span className="text-xs text-[#2E7D32] font-medium bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                  em até 3x sem juros
                </span>
              </div>

              {/* Deep Olfactory Pyramid */}
              <div className="mt-6 pt-5 border-t border-[#E8E1D5] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B5E20]">
                  <Droplets className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Pirâmide Olfativa Completa</span>
                </div>

                <div className="space-y-2 bg-white/70 p-3.5 rounded-xl border border-[#E8E1D5] text-xs">
                  <div>
                    <strong className="text-neutral-900 font-semibold block text-[11px] uppercase tracking-wide">
                      Notas de Saída (Topo):
                    </strong>
                    <span className="text-neutral-600">{product.topNotes}</span>
                  </div>

                  <div className="pt-1 border-t border-[#F1ECE1]">
                    <strong className="text-neutral-900 font-semibold block text-[11px] uppercase tracking-wide">
                      Notas de Corpo (Coração):
                    </strong>
                    <span className="text-neutral-600">{product.heartNotes}</span>
                  </div>

                  <div className="pt-1 border-t border-[#F1ECE1]">
                    <strong className="text-neutral-900 font-semibold block text-[11px] uppercase tracking-wide">
                      Notas de Fundo:
                    </strong>
                    <span className="text-neutral-600">{product.baseNotes}</span>
                  </div>
                </div>
              </div>

              {/* Branch stock presence */}
              <div className="mt-4 flex items-center gap-2 text-xs text-neutral-700 bg-[#EFE9DC]/60 p-2.5 rounded-lg border border-[#DDD3C2]">
                <MapPin className="w-4 h-4 text-[#1B5E20] shrink-0" />
                <span>
                  Disponível para retirada imediata ou tele-entrega na unidade <strong className="text-[#1B5E20]">{selectedBranch.name.replace("L'acqua di Fiori — ", '')}</strong>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#E8E1D5] grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={handleAdd}
                className="w-full min-h-[48px] py-3.5 px-4 bg-[#111111] hover:bg-[#2A2A2A] active:scale-[0.98] text-[#EBD399] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md touch-manipulation cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Adicionar à Sacola</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full min-h-[48px] py-3.5 px-4 bg-[#25D366] hover:bg-[#20BA5A] active:scale-[0.98] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md touch-manipulation cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Comprar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
