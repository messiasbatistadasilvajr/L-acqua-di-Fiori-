import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useBranch } from '../../context/BranchContext';
import { api } from '../../services/api';
import { Order, PaymentMethod } from '../../types';
import { X, CheckCircle2, MessageCircle, ArrowRight, ShieldCheck, MapPin, AlertCircle, Copy, Check } from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartItems,
    deliveryType,
    subtotal,
    discount,
    deliveryFee,
    total,
    coupon,
    clearCart,
  } = useCart();

  const { selectedBranch } = useBranch();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(true);

  // Submission & Post-order state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [formattedMessage, setFormattedMessage] = useState<string | null>(null);
  const [hasCopiedMessage, setHasCopiedMessage] = useState(false);

  if (!isCheckoutOpen) return null;

  const handlePhoneChange = (val: string) => {
    // Basic formatting for Brazilian phone
    const cleaned = val.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    if (cleaned.length > 7) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
    setCustomerPhone(formatted.slice(0, 15));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    const rawPhone = customerPhone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      setErrorMessage('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }
    if (deliveryType === 'ENTREGA_DELIVERY' && !deliveryAddress.trim()) {
      setErrorMessage('Por favor, informe o endereço completo para entrega.');
      return;
    }
    if (!lgpdConsent) {
      setErrorMessage('É necessário concordar com a comunicação do pedido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        branchId: selectedBranch.id,
        customerName: customerName.trim(),
        customerPhone: rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`,
        deliveryType,
        deliveryAddress: deliveryType === 'ENTREGA_DELIVERY' ? deliveryAddress.trim() : undefined,
        paymentMethod,
        couponCode: coupon?.code,
        notes: notes.trim() || undefined,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          unitPrice: item.product.promotionalPrice || item.product.originalPrice,
          quantity: item.quantity,
        })),
      };

      const res = await api.createOrder(orderPayload);

      if (res.success && res.order) {
        setConfirmedOrder(res.order);
        setWhatsappUrl(res.whatsappUrl);
        setFormattedMessage(res.formattedMessage);
        clearCart();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyMessage = () => {
    if (formattedMessage) {
      navigator.clipboard.writeText(formattedMessage);
      setHasCopiedMessage(true);
      setTimeout(() => setHasCopiedMessage(false), 3000);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(null);
    setWhatsappUrl(null);
    setFormattedMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#C5A059]/40 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#111111] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#C5A059]/30">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-md font-bold mb-1.5 w-fit">
              <ShieldCheck className="w-4 h-4 text-[#1B5E20]" />
              <span>Checkout Seguro & Conversacional</span>
            </div>
            <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white">
              {confirmedOrder ? 'Pedido Registrado com Sucesso!' : 'Finalização do Pedido'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center active:scale-95 transition-all touch-manipulation cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {confirmedOrder ? (
          /* Order Confirmation & WhatsApp Dispatch Screen */
          <div className="p-5 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-[#E8F8EE] border border-[#25D366]/40 text-[#25D366] flex items-center justify-center mx-auto mb-3 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1B5E20]">
                Pedido {confirmedOrder.orderNumber}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
                Seu pedido foi registrado e o estoque foi reservado com sucesso na <strong className="text-[#1B5E20]">{confirmedOrder.branchName}</strong>.
              </p>
            </div>

            {/* Structured Receipt Summary */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E1D5] space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-[#F2ECE1]">
                <span className="text-neutral-500">Loja Responsável:</span>
                <strong className="text-[#1B5E20]">{confirmedOrder.branchName}</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#F2ECE1]">
                <span className="text-neutral-500">Modalidade:</span>
                <span className="font-semibold text-neutral-900">
                  {confirmedOrder.deliveryType === 'RETIRADA_LOJA' ? 'Retirada na Loja' : 'Entrega Delivery'}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#F2ECE1]">
                <span className="text-neutral-500">Forma de Pagamento:</span>
                <span className="font-semibold text-neutral-900">{confirmedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-neutral-900">Total a Pagar:</span>
                <span className="text-xl sm:text-2xl font-bold text-[#1B5E20] tabular-nums">
                  R$ {confirmedOrder.total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Primary Action: Direct WhatsApp Dispatch */}
            <div className="space-y-3">
              <a
                href={whatsappUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[52px] py-4 px-6 bg-[#25D366] hover:bg-[#20BA5A] active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/30 transition-all text-decoration-none touch-manipulation cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Enviar Pedido pelo WhatsApp da Loja</span>
              </a>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-white border border-[#DDD3C2] hover:bg-[#F2EDE2] active:scale-95 text-neutral-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all touch-manipulation cursor-pointer"
                >
                  {hasCopiedMessage ? <Check className="w-4 h-4 text-[#1B5E20]" /> : <Copy className="w-4 h-4 text-neutral-500" />}
                  <span>{hasCopiedMessage ? 'Mensagem Copiada!' : 'Copiar Texto da Mensagem'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs text-neutral-600 hover:text-neutral-900 font-bold active:scale-95 transition-all text-center flex items-center justify-center touch-manipulation cursor-pointer"
                >
                  Voltar ao Catálogo
                </button>
              </div>

              <p className="text-[11px] text-center text-neutral-500 leading-relaxed pt-2">
                * Conforme nossas diretrizes, o pedido entrará em preparação assim que nossa equipe validar a confirmação de pagamento com você na conversa do WhatsApp.
              </p>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmitOrder} className="p-6 sm:p-8 space-y-6">
            {/* Active Branch Callout */}
            <div className="p-3.5 bg-[#F2EDE2] rounded-xl border border-[#E0D7C6] flex items-center justify-between text-xs text-neutral-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>
                  Unidade: <strong>{selectedBranch.name}</strong> ({selectedBranch.city}/{selectedBranch.state})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Estoque Disponível
              </span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Customer Inputs */}
            <div className="space-y-4">
              <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 border-b border-[#E8E1D5] pb-2">
                1. Seus Dados de Contato
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Mariana Silveira"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-lg text-xs gold-border-focus"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    WhatsApp para Atendimento *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-lg text-xs gold-border-focus"
                  />
                </div>
              </div>

              {/* Delivery Address if delivery selected */}
              {deliveryType === 'ENTREGA_DELIVERY' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Endereço Completo para Entrega *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Rua, número, complemento, bairro e cidade"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-lg text-xs gold-border-focus"
                  />
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 border-b border-[#E8E1D5] pb-2 flex items-center gap-2">
                <span className="text-[#1B5E20]">2.</span>
                <span>Forma de Pagamento Pretendida</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {[
                  { id: 'PIX', label: 'PIX', badge: 'Instantâneo' },
                  { id: 'CARTAO_CREDITO', label: 'Cartão Crédito', badge: 'Até 3x' },
                  { id: 'CARTAO_DEBITO', label: 'Cartão Débito', badge: 'Na entrega' },
                  { id: 'DINHEIRO', label: 'Dinheiro', badge: 'Troco' },
                ].map((pay) => {
                  const isSelected = paymentMethod === pay.id;
                  return (
                    <button
                      type="button"
                      key={pay.id}
                      onClick={() => setPaymentMethod(pay.id as PaymentMethod)}
                      className={`min-h-[58px] p-3 rounded-xl border text-left transition-all active:scale-98 touch-manipulation cursor-pointer flex flex-col justify-center ${
                        isSelected
                          ? 'border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20] font-bold shadow-xs'
                          : 'border-[#DDD3C2] bg-white text-neutral-600 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <span className="block font-bold leading-tight">{pay.label}</span>
                      <span className={`text-[10px] font-medium ${isSelected ? 'text-[#2E7D32]' : 'text-neutral-500'}`}>{pay.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Observações ou Embalagem para Presente (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Embalar o Ladro para presente com fita dourada..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs gold-border-focus resize-none"
              />
            </div>

            {/* LGPD Consent Checkbox */}
            <div className="flex items-start gap-2.5 pt-1 text-xs text-neutral-600">
              <input
                type="checkbox"
                id="lgpd"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 rounded text-[#1B5E20] focus:ring-[#1B5E20] cursor-pointer"
              />
              <label htmlFor="lgpd" className="leading-snug cursor-pointer select-none">
                Concordo com o envio das informações para a <strong className="text-[#1B5E20]">Loja Centro & Tele-Entregas</strong> da L'acqua di Fiori para processamento deste pedido e comunicação comercial via WhatsApp, conforme a LGPD.
              </label>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-[#E8E1D5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-neutral-500 block uppercase tracking-wide font-semibold">Total do Pedido</span>
                <span className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#1B5E20] tabular-nums">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[50px] px-8 py-3.5 bg-[#1B5E20] hover:bg-[#144A19] active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1B5E20]/25 touch-manipulation cursor-pointer"
              >
                <span>{isSubmitting ? 'Registrando Pedido...' : 'Confirmar Pedido & Abrir WhatsApp'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
