import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Coupon, DeliveryType } from '../types';
import { api } from '../services/api';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  coupon: Coupon | null;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  totalCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ldf_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('RETIRADA_LOJA');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ldf_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedVolume: product.volume }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setCouponError(null);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.promotionalPrice || item.product.originalPrice;
    return sum + price * item.quantity;
  }, 0);

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (res.valid && res.coupon) {
        setCoupon(res.coupon);
        return true;
      } else {
        setCouponError(res.error || 'Cupom inválido ou não atingiu o valor mínimo');
        return false;
      }
    } catch (err: any) {
      setCouponError(err.message || 'Erro ao validar cupom');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  let discount = 0;
  if (coupon) {
    if (coupon.discountType === 'PERCENTUAL') {
      discount = (subtotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }
  }

  const deliveryFee = deliveryType === 'ENTREGA_DELIVERY' ? 15.0 : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        coupon,
        couponError,
        applyCoupon,
        removeCoupon,
        deliveryType,
        setDeliveryType,
        subtotal,
        discount,
        deliveryFee,
        total,
        totalCount,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart deve ser usado dentro de CartProvider');
  return context;
};
