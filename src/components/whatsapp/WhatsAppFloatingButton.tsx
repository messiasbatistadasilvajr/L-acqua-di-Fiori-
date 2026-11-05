import React, { useState } from 'react';
import { useBranch } from '../../context/BranchContext';
import { MessageCircle, Sparkles, X } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  onOpenAIConsultant: () => void;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  onOpenAIConsultant,
}) => {
  const { selectedBranch } = useBranch();
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  const handleOpenDirectWhatsApp = () => {
    const msg = `Olá equipe da *${selectedBranch.name}*! Estou navegando no catálogo digital da L'acqua di Fiori e gostaria de tirar uma dúvida sobre produtos.`;
    window.open(`https://wa.me/${selectedBranch.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    setIsOpenMenu(false);
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2.5">
      {/* Quick Action Popover */}
      {isOpenMenu && (
        <div className="bg-[#111111] text-white p-4 rounded-2xl shadow-2xl border border-[#C5A059]/40 w-72 max-w-[calc(100vw-2rem)] mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-[11px] font-bold text-[#25D366] uppercase tracking-wider">
              Atendimento L'acqua di Fiori
            </span>
            <button
              type="button"
              onClick={() => setIsOpenMenu(false)}
              className="text-neutral-400 hover:text-white p-1 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg active:scale-90 transition-all cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 text-xs text-neutral-300 space-y-0.5">
            <strong className="text-white block font-serif-luxury">{selectedBranch.name}</strong>
            <span className="text-neutral-400 block text-[11px]">{selectedBranch.address}</span>
            <span className="text-[#25D366] block text-[11px] font-bold">{selectedBranch.phone}</span>
          </div>

          <div className="mt-3.5 space-y-2">
            <button
              type="button"
              onClick={handleOpenDirectWhatsApp}
              className="w-full min-h-[46px] py-2.5 px-3 bg-[#1B5E20] hover:bg-[#144A19] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md touch-manipulation cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
              <span>Conversar pelo WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpenMenu(false);
                onOpenAIConsultant();
              }}
              className="w-full min-h-[46px] py-2.5 px-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] active:scale-95 text-[#EBD399] border border-[#25D366]/40 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all touch-manipulation cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#25D366] shrink-0" />
              <span>Consultora Olfativa IA</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpenMenu(!isOpenMenu)}
        className="group relative flex items-center gap-2.5 min-h-[50px] px-4 py-3 bg-[#1B5E20] hover:bg-[#144A19] active:scale-95 text-white rounded-full shadow-2xl border border-[#25D366]/40 transition-all duration-300 touch-manipulation cursor-pointer"
        aria-label="Atendimento pelo WhatsApp"
      >
        <MessageCircle className="w-6 h-6 shrink-0 text-[#25D366]" />
        <span className="text-xs font-bold tracking-wide hidden sm:inline">
          Fale Conosco
        </span>
        <span className="hidden lg:inline text-[10px] bg-black/30 text-[#EBD399] px-2 py-0.5 rounded-full font-bold">
          {selectedBranch.name.replace("L'acqua di Fiori — ", '')}
        </span>
      </button>
    </div>
  );
};
