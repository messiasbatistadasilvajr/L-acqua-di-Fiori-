import React from 'react';
import { Sparkles, MessageSquare, ArrowRight, ShieldCheck, Truck, Clock, Camera } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';

interface HeroSectionProps {
  onExploreCatalog: () => void;
  onOpenAIConsultant: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreCatalog,
  onOpenAIConsultant,
}) => {
  const { selectedBranch } = useBranch();

  return (
    <section className="relative overflow-hidden bg-[#111111] text-white">
      {/* Background Graphic & Texture */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
        <img
          src="/src/assets/images/hero_lacqua_perfumes_1793757508476.jpg"
          alt="Coleção de Perfumes L'acqua di Fiori"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F1F1F]/90 border border-[#C5A059]/40 text-[#EBD399] text-xs uppercase tracking-widest font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Ecossistema Oficial de Alta Perfumaria</span>
          </div>

          <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] text-balance">
            A nobreza das essências em sintonia com o seu estilo.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-300 font-normal leading-relaxed">
            Descubra os clássicos atemporais como <strong className="text-white font-medium">Ladro</strong>, <strong className="text-white font-medium">Vezzo</strong> e <strong className="text-white font-medium">Ototemo</strong>. 
            Consulte a disponibilidade em tempo real na Loja Centro & Tele-Entregas e finalize sua compra com atendimento personalizado pelo WhatsApp.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onExploreCatalog}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 text-xs uppercase tracking-widest font-bold text-black bg-[#C5A059] hover:bg-[#EBD399] active:scale-[0.98] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/20 cursor-pointer touch-manipulation"
            >
              <span>Explorar Catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('galeria');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto min-h-[48px] px-5 py-3.5 text-xs uppercase tracking-widest font-semibold text-neutral-200 hover:text-white active:scale-[0.98] bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
            >
              <Camera className="w-4 h-4 text-[#C5A059]" />
              <span>Fotos da Loja</span>
            </button>

            <button
              type="button"
              onClick={onOpenAIConsultant}
              className="w-full sm:w-auto min-h-[48px] px-5 py-3.5 text-xs uppercase tracking-widest font-semibold text-[#EBD399] hover:text-white active:scale-[0.98] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#C5A059]/40 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
            >
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>Consultora IA</span>
            </button>
          </div>

          {/* Quick Active Branch Indicator */}
          <div className="mt-10 pt-6 border-t border-neutral-800/80 flex flex-wrap items-center gap-6 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
              <span className="text-neutral-300">Unidade ativa:</span>
              <strong className="text-white font-medium">{selectedBranch.name.replace("L'acqua di Fiori — ", '')}</strong>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{selectedBranch.openingHours}</span>
            </div>

            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Pronta entrega & retirada local</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
