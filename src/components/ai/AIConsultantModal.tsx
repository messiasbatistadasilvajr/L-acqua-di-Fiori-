import React, { useState, useRef, useEffect } from 'react';
import { useBranch } from '../../context/BranchContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { Product } from '../../types';
import { X, Sparkles, Send, MessageCircle, ShoppingBag, Bot, User, ArrowRight, Compass, ExternalLink } from 'lucide-react';

interface AIConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToCatalog?: (filter: { gender?: string; category?: string; search?: string }) => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  recommendedProducts?: Product[];
  navigationTarget?: { label: string; filter: { gender?: string; category?: string; search?: string } } | null;
  whatsappPreFill?: string;
}

export const AIConsultantModal: React.FC<AIConsultantModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onNavigateToCatalog,
}) => {
  const { selectedBranch } = useBranch();
  const { addToCart } = useCart();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Olá! Sou a **Consultora Olfativa Virtual da L'acqua di Fiori** (Loja Centro & Tele-Entregas em Fortaleza). 

Estou aqui para guiar você pela nossa alta perfumaria, desvendar a evolução olfativa de cada clássico (como *Ladro*, *Vezzo*, *Ototemo Deep*, *Cupidon* e a linha *Paris Elysees*) e encontrar a fragrância perfeita para a sua personalidade ou para presentear com sofisticação.

✨ **Como posso encantar você hoje?** Pode me perguntar sobre perfumes masculinos, opções femininas marcantes, fragrâncias frescas para o dia a dia ou kits de presente!`,
      navigationTarget: {
        label: 'Explorar Catálogo Completo da Vitrine',
        filter: {},
      },
      whatsappPreFill: "Olá! Estava navegando na Consultoria Olfativa Virtual da L'acqua di Fiori e gostaria de atendimento das consultoras da Loja Centro!",
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res: any = await api.consultFragranceAI(text.trim(), history);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: res.reply || 'Estou à disposição para apresentar nossas criações olfativas.',
        recommendedProducts: res.recommendedProducts || [],
        navigationTarget: res.navigationTarget || null,
        whatsappPreFill: res.whatsappPreFill || `Olá! Conversei com a Consultora Virtual sobre "${text.trim()}" e gostaria de atendimento humano na Loja Centro.`,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'model',
          content: 'Nossas consultoras estão prontas diretamente pelo WhatsApp da Loja Centro para um atendimento exclusivo e personalizado!',
          whatsappPreFill: `Olá! Gostaria de consultar informações sobre "${text.trim()}" com a equipe da Loja Centro.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppTransfer = () => {
    const lastUserQuery = messages.filter((m) => m.role === 'user').pop()?.content || 'atendimento sobre perfumes';
    const msg = `Olá! Estava utilizando a Consultora Olfativa Virtual no catálogo e gostaria de continuar o atendimento com um consultor humano da *${selectedBranch.name}*. Minha dúvida era sobre: "${lastUserQuery}".`;
    window.open(`https://wa.me/${selectedBranch.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#C5A059]/50 overflow-hidden flex flex-col h-[650px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#111111] text-white flex items-center justify-between border-b border-[#C5A059]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E1E1E] border border-[#C5A059] flex items-center justify-center text-[#EBD399]">
              <Sparkles className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-luxury text-lg font-bold text-white leading-none">
                  Consultora Olfativa Virtual
                </h3>
                <span className="text-[10px] bg-[#C5A059]/20 text-[#EBD399] px-2 py-0.5 rounded-full font-medium">
                  IA Oficial
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Recomendações autorais fundamentadas no catálogo da L'acqua di Fiori
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppTransfer}
              className="flex items-center gap-1.5 min-h-[36px] px-2.5 sm:px-3 py-1.5 bg-[#E8F8EE] hover:bg-[#D4F2DE] active:scale-95 text-[#1B5E20] border border-[#25D366]/40 rounded-xl text-xs font-bold transition-all touch-manipulation cursor-pointer shadow-xs"
              title="Transferir para atendente humano no WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
              <span className="hidden sm:inline">Chamar Atendente</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center active:scale-95 transition-all touch-manipulation cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#1B5E20] flex items-center justify-center shrink-0 text-[#25D366] mt-1 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-[#111111] text-[#FAF8F5] rounded-tr-none'
                      : 'bg-white border border-[#E8E1D5] text-neutral-800 shadow-xs rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line prose-xs">
                    {m.content}
                  </div>

                  {/* CTAs / Ações de Direcionamento Interativas */}
                  {(m.navigationTarget || m.whatsappPreFill) && (
                    <div className="pt-2.5 border-t border-[#F1ECE1] flex flex-col sm:flex-row flex-wrap gap-2">
                      {m.navigationTarget && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToCatalog && m.navigationTarget) {
                              onNavigateToCatalog(m.navigationTarget.filter);
                            }
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 min-h-[38px] bg-[#111111] hover:bg-[#1B5E20] text-[#EBD399] hover:text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer touch-manipulation"
                        >
                          <Compass className="w-3.5 h-3.5 text-[#4ADE80]" />
                          <span>{m.navigationTarget.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {m.whatsappPreFill && (
                        <a
                          href={`https://wa.me/${selectedBranch.whatsapp}?text=${encodeURIComponent(m.whatsappPreFill)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 min-h-[38px] bg-[#1B5E20] hover:bg-[#0D5C3A] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer touch-manipulation"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                          <span>Tirar Dúvidas no WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Recommended products cards */}
                  {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                    <div className="pt-2.5 border-t border-[#F1ECE1] space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E20] block">
                        Fragrâncias Selecionadas com Alta Fixação:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.recommendedProducts.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DDD3C2] flex items-center justify-between gap-2 shadow-xs hover:border-[#1B5E20]/50 transition-colors"
                          >
                            <div
                              onClick={() => {
                                onSelectProduct(p);
                                onClose();
                              }}
                              className="cursor-pointer hover:underline min-w-0"
                            >
                              <strong className="block text-neutral-900 truncate">{p.name}</strong>
                              <span className="text-[10px] text-[#1B5E20] font-bold block truncate">
                                {p.olfactoryFamily} · R$ {(p.promotionalPrice || p.originalPrice).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => addToCart(p, 1)}
                              className="min-h-[34px] px-3 py-1.5 bg-[#1B5E20] hover:bg-[#144A19] active:scale-90 text-white rounded-lg text-[11px] font-bold shrink-0 transition-all touch-manipulation cursor-pointer shadow-xs"
                            >
                              + Sacola
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center shrink-0 text-white mt-1 font-bold text-xs shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#1B5E20] flex items-center justify-center shrink-0 text-[#25D366]">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-[#E8E1D5] rounded-2xl rounded-tl-none p-3.5 text-xs text-neutral-500 flex items-center gap-2">
                <span className="animate-pulse">Consultando as notas olfativas do catálogo e preparando a melhor recomendação...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-[#F2EDE2] border-t border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          {[
            'Quero que me mostre uns perfumes masculinos',
            'Top perfumes masculinos mais marcantes',
            'Perfumes femininos envolventes e marcantes',
            'Fragrâncias frescas para o calor de Fortaleza',
            'Kits e presentes para datas especiais',
            'O que torna o clássico Ladro tão especial?',
          ].map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="min-h-[36px] px-3.5 py-1.5 bg-white hover:bg-[#EBE4D5] active:scale-95 text-neutral-800 border border-[#DDD3C2] rounded-full whitespace-nowrap text-[11px] font-medium transition-all shrink-0 touch-manipulation cursor-pointer shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3.5 sm:p-4 bg-white border-t border-[#E8E1D5] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre notas, ocasiões, presentes ou perfumes..."
            className="flex-1 min-h-[44px] px-4 py-2.5 bg-[#FAF8F5] border border-[#DDD3C2] rounded-xl text-xs gold-border-focus"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-[#1B5E20] hover:bg-[#144A19] active:scale-90 disabled:opacity-40 text-white rounded-xl transition-all shadow-md touch-manipulation cursor-pointer"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
