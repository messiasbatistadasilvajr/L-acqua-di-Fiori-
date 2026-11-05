import React, { useState } from 'react';
import { X, Sparkles, MessageCircle } from 'lucide-react';

export const TopBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-[#111111] border-b border-[#C5A059]/25 text-[#EBD399] px-3 sm:px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center gap-2 text-center flex-wrap sm:flex-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0 hidden sm:inline" />
          <span className="font-medium tracking-wide text-neutral-200">
            Promoções da Vitrine: Perfumes a partir de <strong className="text-[#4ADE80] font-bold">R$ 79,90</strong> · Presentes a partir de <strong className="text-[#4ADE80] font-bold">R$ 19,90</strong> · Body Splash a partir de <strong className="text-[#4ADE80] font-bold">R$ 39,90</strong>
          </span>
          <span className="text-neutral-500 hidden md:inline">·</span>
          <a
            href="https://wa.me/5585996605034?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20um%20pedido%20pelo%20Tele-Entregas%20da%20L'acqua%20di%20Fiori!"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] hover:text-[#4ADE80] font-bold hidden md:inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Tele-Entregas: (85) 3231-1507 / WhatsApp</span>
          </a>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-neutral-400 hover:text-white min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md hover:bg-white/10 transition-colors shrink-0 active:scale-95 cursor-pointer"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
