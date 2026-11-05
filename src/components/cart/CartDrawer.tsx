import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useBranch } from '../../context/BranchContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, MapPin, Truck, Store } from 'lucide-react';

interface CartDrawerProps {
  onOpenBranchModal: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenBranchModal }) => {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discount,
    deliveryFee,
    total,
    coupon,
    couponError,
    applyCoupon,
    removeCoupon,
    deliveryType,
    setDeliveryType,
    setIsCheckoutOpen,
  } = useCart();

  const { selectedBranch } = useBranch();
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponInput.trim());
    setIsApplyingCoupon(false);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div
        className="relative w-full max-w-md bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between border-l border-[#C5A059]/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 bg-[#111111] text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#25D366]" />
            <h2 className="font-serif-luxury text-xl font-bold tracking-wide">
              Sua Sacola de Perfumaria
            </h2>
            <span className="text-xs bg-[#0D5C3A] text-[#EBD399] px-2.5 py-0.5 rounded-full font-bold">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} itens
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center active:scale-95 transition-all touch-manipulation cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Branch Banner */}
        <div className="px-5 sm:px-6 py-3 bg-[#F1F8F4] border-b border-[#C8E6C9] flex items-center justify-between text-xs text-neutral-800 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#1B5E20] shrink-0" />
            <span className="truncate">
              Loja Oficial: <strong className="text-[#1B5E20]">{selectedBranch.name}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenBranchModal}
            className="min-h-[36px] px-2.5 py-1 text-xs font-bold text-[#1B5E20] hover:underline shrink-0 ml-2 rounded-lg active:scale-95 transition-all touch-manipulation cursor-pointer"
          >
            Ver Loja
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-12">
              <ShoppingBag className="w-12 h-12 text-[#1B5E20]/40 mb-3 stroke-[1.5]" />
              <p className="font-serif-luxury text-xl text-neutral-800 font-bold">Sua sacola está vazia</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                Explore nossas criações olfativas e selecione suas fragrâncias favoritas.
              </p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="mt-6 min-h-[44px] px-6 py-3 bg-[#111111] hover:bg-[#2A2A2A] active:scale-95 text-[#EBD399] rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation cursor-pointer"
              >
                Ver Perfumes
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const price = item.product.promotionalPrice || item.product.originalPrice;
              const itemTotal = price * item.quantity;
              return (
                <div
                  key={item.product.id}
                  className="bg-white p-3.5 rounded-xl border border-[#E8E1D5] flex items-center gap-3 shadow-xs"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 object-contain bg-[#FAF8F5] rounded-lg p-1 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#1B5E20] uppercase tracking-wider font-bold block">
                      {item.product.brand} · {item.product.volume}
                    </span>
                    <h4 className="font-serif-luxury font-bold text-sm text-neutral-900 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-xs font-bold text-[#1B5E20] tabular-nums">
                      R$ {price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-neutral-400 hover:text-red-600 rounded-lg active:scale-90 transition-all touch-manipulation cursor-pointer"
                      title="Remover item"
                      aria-label="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#DDD3C2] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center text-neutral-700 hover:bg-white active:scale-90 rounded-md transition-all touch-manipulation cursor-pointer font-bold"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center tabular-nums text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center text-neutral-700 hover:bg-white active:scale-90 rounded-md transition-all touch-manipulation cursor-pointer font-bold"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Calculations and Checkout Trigger */}
        {cartItems.length > 0 && (
          <div className="p-5 sm:p-6 bg-white border-t border-[#E8E1D5] space-y-4 shrink-0 shadow-lg">
            {/* Delivery Mode Toggle */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#1B5E20] uppercase tracking-wide">
                Forma de Recebimento
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliveryType('RETIRADA_LOJA')}
                  className={`min-h-[52px] p-2.5 rounded-xl border flex items-center gap-2 transition-all active:scale-98 touch-manipulation cursor-pointer ${
                    deliveryType === 'RETIRADA_LOJA'
                      ? 'border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20] font-bold shadow-xs'
                      : 'border-[#DDD3C2] text-neutral-600 hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Store className="w-4 h-4 text-[#1B5E20] shrink-0" />
                  <div className="text-left">
                    <span className="block leading-none">Retirar na Loja</span>
                    <span className="text-[10px] text-[#2E7D32] font-bold">Grátis</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('ENTREGA_DELIVERY')}
                  className={`min-h-[52px] p-2.5 rounded-xl border flex items-center gap-2 transition-all active:scale-98 touch-manipulation cursor-pointer ${
                    deliveryType === 'ENTREGA_DELIVERY'
                      ? 'border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20] font-bold shadow-xs'
                      : 'border-[#DDD3C2] text-neutral-600 hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Truck className="w-4 h-4 text-[#1B5E20] shrink-0" />
                  <div className="text-left">
                    <span className="block leading-none">Tele-Entrega</span>
                    <span className="text-[10px] text-neutral-600 font-semibold">R$ 15,00</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="pt-2">
              {coupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E8F8EE] border border-[#25D366]/40 text-xs text-[#1E7E34]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Tag className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span className="truncate">
                      Cupom <strong>{coupon.code}</strong> ({coupon.discountType === 'PERCENTUAL' ? `${coupon.value}% OFF` : `R$ ${coupon.value} OFF`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="min-h-[32px] px-2 text-xs font-bold text-red-600 hover:underline shrink-0 ml-2 active:scale-90 transition-all touch-manipulation cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Cupom (ex: BEMVINDO10)"
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl gold-border-focus uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    className="min-h-[42px] px-4 py-2 bg-[#111111] hover:bg-[#2A2A2A] active:scale-95 disabled:opacity-50 text-[#EBD399] rounded-xl text-xs font-bold transition-all touch-manipulation cursor-pointer"
                  >
                    {isApplyingCoupon ? '...' : 'Aplicar'}
                  </button>
                </form>
              )}
              {couponError && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{couponError}</p>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="pt-2 border-t border-[#F2ECE1] space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900 tabular-nums">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#1B5E20] font-semibold">
                  <span>Desconto de Cupom</span>
                  <span className="tabular-nums">
                    -R$ {discount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Entrega / Retirada</span>
                <span className="font-semibold text-neutral-900 tabular-nums">
                  {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#F2ECE1]">
                <span className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Total a Pagar</span>
                <span className="tabular-nums text-2xl font-bold text-[#1B5E20]">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full min-h-[50px] py-3.5 px-4 bg-[#1B5E20] hover:bg-[#144A19] active:scale-[0.98] text-white font-bold uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1B5E20]/25 transition-all touch-manipulation cursor-pointer"
            >
              <span>Avançar para Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
