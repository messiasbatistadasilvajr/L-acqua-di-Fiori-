import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useBranch } from '../../context/BranchContext';
import { ShoppingBag, MessageCircle, Eye, Sparkles, Camera } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  branchStock?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  branchStock = 12,
}) => {
  const { addToCart } = useCart();
  const { selectedBranch } = useBranch();

  const isPromo = product.promotionalPrice && product.promotionalPrice < product.originalPrice;
  const currentPrice = product.promotionalPrice || product.originalPrice;

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `Olá! Tenho interesse no *${product.name}* (${product.volume}) no valor de R$ ${currentPrice.toFixed(2).replace('.', ',')}. Vocês possuem a pronta entrega na *${selectedBranch.name}*?`;
    window.open(`https://wa.me/${selectedBranch.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <article
      onClick={() => onOpenDetails(product)}
      className="group bg-white rounded-xl border border-[#E8E1D5] overflow-hidden hover:border-[#C5A059]/60 hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Product Image Slot */}
      <div className="relative aspect-[4/3] bg-[#F7F4EE] overflow-hidden flex items-center justify-center p-4">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Promotion indicator with emerald green */}
        {isPromo && (
          <div className="absolute top-3 left-3 bg-[#0D5C3A] text-[#EBD399] text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-sm shadow-xs border border-[#C5A059]/30">
            Oferta Especial
          </div>
        )}

        {/* Real Store Photo Indicator */}
        {product.realStorePhotoUrl && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[#0D5C3A] text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded-sm border border-[#DDD3C2] flex items-center gap-1 shadow-xs">
            <Camera className="w-3 h-3 text-[#1B5E20]" />
            <span>Foto da Loja</span>
          </div>
        )}

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="px-3.5 py-2 bg-white/95 text-neutral-900 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#1B5E20]" />
            Ver Detalhes & Notas
          </span>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata line with typographic separators (Zero Pill Discipline) */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#1B5E20] uppercase tracking-wider font-bold mb-1.5">
            <span>{product.brand}</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span>{product.olfactoryFamily}</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-neutral-500 font-normal">{product.volume}</span>
          </div>

          {/* Title */}
          <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 group-hover:text-[#1B5E20] transition-colors leading-snug line-clamp-1">
            {product.name}
          </h3>

          {/* Scent notes teaser */}
          <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing, Branch Stock & Action Buttons */}
        <div className="mt-4 pt-4 border-t border-[#F2ECE1]">
          {/* Disponibilidade confirmada pela loja física */}
          <div className="flex items-center justify-between text-[11px] mb-2.5">
            <span className="text-neutral-500 flex items-center gap-1.5 truncate max-w-[55%]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20] inline-block shrink-0"></span>
              <span className="truncate">{selectedBranch.name.replace("L'acqua di Fiori — ", '')}</span>
            </span>
            <span className="text-[#1B5E20] font-medium text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0">
              Disponibilidade confirmada pela loja
            </span>
          </div>

          {/* Price display with standout green and tabular nums */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-bold text-xl text-[#1B5E20] tabular-nums">
              R$ {currentPrice.toFixed(2).replace('.', ',')}
            </span>
            {isPromo && (
              <span className="text-xs text-neutral-400 line-through tabular-nums">
                R$ {product.originalPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Working Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full min-h-[44px] py-2.5 px-2 sm:px-3 bg-[#111111] hover:bg-[#2A2A2A] active:scale-95 text-[#EBD399] hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs touch-manipulation cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <span className="truncate">+ Sacola</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="w-full min-h-[44px] py-2.5 px-2 sm:px-3 bg-[#E8F8EE] hover:bg-[#D4F2DE] active:scale-95 text-[#1E7E34] border border-[#25D366]/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation cursor-pointer"
              title="Perguntar sobre este produto no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
              <span className="truncate">WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
