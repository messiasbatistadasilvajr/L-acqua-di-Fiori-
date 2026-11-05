import React from 'react';
import { useBranch } from '../../context/BranchContext';
import { MessageCircle, Shield, Award, Sparkles, MapPin, Phone, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { branches } = useBranch();

  return (
    <footer className="bg-[#111111] text-[#E8E1D5] border-t border-[#C5A059]/25 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-neutral-800 text-center md:text-left">
          <div className="flex items-start gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#C5A059]/40 flex items-center justify-center shrink-0 text-[#C5A059]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm tracking-wide">Tradição & Autenticidade</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Fragrâncias consagradas desde 1980 com formulações autorais e matérias-primas nobres.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#C5A059]/40 flex items-center justify-center shrink-0 text-[#25D366]">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm tracking-wide">Venda Consultiva no WhatsApp</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Converse diretamente com nossa equipe no WhatsApp para tirar dúvidas e fechar seu pedido.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#C5A059]/40 flex items-center justify-center shrink-0 text-[#C5A059]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm tracking-wide">Estoque Real & Pronta Entrega</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Garantia de disponibilidade imediata para tele-entrega express ou retirada na loja.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Branch Footprint & Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12 border-b border-neutral-800">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#C5A059] flex items-center justify-center text-black font-serif-luxury font-bold text-sm">
                L
              </div>
              <span className="font-serif-luxury text-lg font-bold tracking-widest text-white">
                L'ACQUA DI FIORI
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Criamos essências que despertam sentimentos e eternizam memórias. O luxo e a arte da perfumaria ao seu alcance com conveniência digital.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#C5A059]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conformidade com a LGPD</span>
            </div>
          </div>

          {/* Branches Information */}
          <div className="md:col-span-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#C5A059] mb-4">
              Nossas Unidades & WhatsApp Oficial
            </h5>
            <div className="space-y-3.5 text-neutral-300 bg-[#161616] p-5 sm:p-6 rounded-2xl border border-neutral-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-serif-luxury font-bold text-[#4ADE80] block text-base sm:text-lg">
                  Loja Centro & Tele-Entregas
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D5C3A]/30 border border-[#25D366]/40 text-[#4ADE80] text-[11px] font-semibold w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                  Unidade Oficial Ativa
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-neutral-300 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <span>Rua Senador Pompeu, 1020 - Centro / Fortaleza - CE</span>
              </div>
              <div className="flex items-center gap-2.5 text-neutral-300 text-xs sm:text-sm">
                <Phone className="w-4 h-4 text-[#25D366] shrink-0" />
                <a
                  href="tel:8532311507"
                  className="font-bold text-[#4ADE80] hover:underline"
                >
                  (85) 3231-1507
                </a>
                <span className="text-neutral-500 text-xs">· Tele-Entregas & Pedidos</span>
              </div>
              <div className="flex items-center gap-2.5 text-neutral-300 text-xs sm:text-sm">
                <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Horário: <strong>Seg a Sáb: 08:00 às 17:00</strong></span>
              </div>
              <div className="pt-2">
                <a
                  href="https://wa.me/5585996605034?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20a%20Loja%20Centro%20%26%20Tele-Entregas%20da%20L'acqua%20di%20Fiori!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#1B5E20] hover:bg-[#0D5C3A] text-white font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#4ADE80]" />
                  <span>WhatsApp Loja: (85) 99660-5034</span>
                </a>
              </div>
            </div>
          </div>

          {/* Customer Service & Legal */}
          <div className="space-y-3 text-xs text-neutral-400">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#C5A059] mb-4">
              Políticas & Segurança
            </h5>
            <ul className="space-y-2">
              <li><a href="#termos" className="hover:text-white transition-colors py-1 inline-block">Termos de Atendimento e Pedidos</a></li>
              <li><a href="#privacidade" className="hover:text-white transition-colors py-1 inline-block">Política de Privacidade (LGPD)</a></li>
              <li><a href="#trocas" className="hover:text-white transition-colors py-1 inline-block">Política de Trocas e Devoluções</a></li>
              <li><a href="#whatsapp-diretrizes" className="hover:text-white transition-colors py-1 inline-block">Diretrizes de Comércio Conversacional</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} L'acqua di Fiori. Todos os direitos reservados. CNPJ: 19.824.120/0001-38.</p>
          <p className="flex items-center gap-2">
            <span>Desenvolvido com tecnologia de ponta para Comércio Conversacional</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
