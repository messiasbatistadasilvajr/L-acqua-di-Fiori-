import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C5A059] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#C5A059]/40 rounded-full transition-colors whitespace-nowrap shrink-0 shadow-sm"
        title="Instalar App da Loja"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C5A059] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#C5A059]/40 rounded-full transition-colors whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-[#1A1A1A] border border-[#C5A059]/30 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#EBD399]">Instalar no iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                1. Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.<br />
                2. Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.<br />
                3. Tenha a L'acqua di Fiori como um aplicativo rápido direto no seu celular.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 text-xs font-semibold rounded-lg bg-[#C5A059] text-black hover:bg-[#EBD399] transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
