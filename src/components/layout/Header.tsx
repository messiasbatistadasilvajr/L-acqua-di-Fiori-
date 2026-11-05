import React from 'react';
import { useBranch } from '../../context/BranchContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { MapPin, ShoppingBag, Sparkles, User, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenBranchModal: () => void;
  onOpenAIConsultant: () => void;
  onScrollToSection: (sectionId: string) => void;
  onToggleAdminView: () => void;
  isAdminView: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBranchModal,
  onOpenAIConsultant,
  onScrollToSection,
  onToggleAdminView,
  isAdminView,
}) => {
  const { selectedBranch } = useBranch();
  const { totalCount, setIsCartOpen, subtotal } = useCart();
  const { user, setShowLoginModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E1D5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (isAdminView) onToggleAdminView();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group text-decoration-none"
            >
              <div className="w-9 h-9 rounded-full bg-[#111111] border border-[#C5A059]/40 flex items-center justify-center text-[#EBD399] shadow-xs group-hover:border-[#C5A059] transition-colors">
                <span className="font-serif-luxury text-lg font-bold">L</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif-luxury text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#111111] whitespace-nowrap leading-none">
                  L'ACQUA DI FIORI
                </span>
                <span className="text-[10px] tracking-[0.25em] text-[#8F7441] font-semibold uppercase mt-0.5">
                  Alta Perfumaria
                </span>
              </div>
            </a>
          </div>

          {/* Zone 2: Navigation Links (single line, clean text, no capsule pills) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs tracking-wider uppercase font-medium text-neutral-700">
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onScrollToSection('catalogo');
              }}
              className="hover:text-[#917032] transition-colors pb-0.5 border-b border-transparent hover:border-[#917032] whitespace-nowrap shrink-0"
            >
              Fragrâncias
            </button>
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onScrollToSection('destaques');
              }}
              className="hover:text-[#917032] transition-colors pb-0.5 border-b border-transparent hover:border-[#917032] whitespace-nowrap shrink-0"
            >
              Mais Vendidos
            </button>
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onScrollToSection('kits');
              }}
              className="hover:text-[#917032] transition-colors pb-0.5 border-b border-transparent hover:border-[#917032] whitespace-nowrap shrink-0"
            >
              Kits & Presentes
            </button>
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onScrollToSection('galeria');
              }}
              className="hover:text-[#917032] transition-colors pb-0.5 border-b border-transparent hover:border-[#917032] whitespace-nowrap shrink-0"
            >
              Galeria da Loja
            </button>
            <button
              onClick={onOpenBranchModal}
              className="hover:text-[#917032] transition-colors pb-0.5 border-b border-transparent hover:border-[#917032] whitespace-nowrap shrink-0"
            >
              Nossa Loja
            </button>
            <button
              onClick={onOpenAIConsultant}
              className="flex items-center gap-1.5 text-[#917032] hover:text-[#705623] font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Consultora IA</span>
            </button>
          </nav>

          {/* Zone 3: Functional Actions & Branch Controller */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            {/* Branch Selector Chip */}
            <button
              type="button"
              onClick={onOpenBranchModal}
              className="flex items-center gap-1.5 min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#F2EDE2] hover:bg-[#EAE3D4] active:scale-95 border border-[#DDD3C2] text-neutral-800 text-xs transition-all touch-manipulation cursor-pointer"
              title="Ver detalhes da unidade oficial"
              aria-label="Ver detalhes da loja oficial"
            >
              <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <div className="text-left hidden md:block">
                <span className="block text-[10px] text-neutral-500 uppercase leading-none font-medium">Unidade Oficial</span>
                <span className="font-semibold text-neutral-900 whitespace-nowrap leading-tight truncate max-w-[130px] block">
                  {selectedBranch.name.replace("L'acqua di Fiori — ", '')}
                </span>
              </div>
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center gap-1.5 sm:gap-2 min-h-[40px] px-3 sm:px-3.5 py-2 rounded-lg bg-[#111111] hover:bg-[#222222] active:scale-95 text-[#EBD399] text-xs font-semibold shadow-xs transition-all touch-manipulation cursor-pointer"
              aria-label="Abrir Sacola de Compras"
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span className="hidden sm:inline">Sacola</span>
              {totalCount > 0 && (
                <span className="min-w-[20px] h-5 px-1 rounded-full bg-[#C5A059] text-black font-bold text-[11px] flex items-center justify-center">
                  {totalCount}
                </span>
              )}
              {subtotal > 0 && (
                <span className="hidden lg:inline text-neutral-300 font-normal">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              )}
            </button>

            {/* Admin Switcher */}
            <button
              type="button"
              onClick={() => {
                if (user) {
                  onToggleAdminView();
                } else {
                  setShowLoginModal(true);
                }
              }}
              className={`min-h-[40px] min-w-[40px] p-2 rounded-lg border transition-all flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer ${
                isAdminView
                  ? 'bg-[#C5A059] text-black border-[#C5A059]'
                  : 'bg-white hover:bg-[#F2EDE2] text-neutral-700 border-[#DDD3C2]'
              }`}
              title={isAdminView ? 'Sair do Painel Admin' : 'Acesso Administrativo'}
              aria-label={isAdminView ? 'Sair do Painel Admin' : 'Acesso Administrativo'}
            >
              {isAdminView ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
