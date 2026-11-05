import React from 'react';
import { useBranch } from '../../context/BranchContext';
import { Branch } from '../../types';
import { X, MapPin, Clock, Phone, MessageCircle, Check } from 'lucide-react';

interface BranchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BranchSelectorModal: React.FC<BranchSelectorModalProps> = ({ isOpen, onClose }) => {
  const { branches, selectedBranch, setSelectedBranch } = useBranch();

  if (!isOpen) return null;

  const handleSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div
        className="relative w-full max-w-xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#C5A059]/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#111111] text-white p-6 flex items-center justify-between border-b border-[#C5A059]/30">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-md font-bold mb-1.5 w-fit">
              <MapPin className="w-3.5 h-3.5 text-[#1B5E20]" />
              <span>Unidade Oficial & Tele-Entregas</span>
            </div>
            <h2 className="font-serif-luxury text-2xl font-bold text-white">
              Nossa Unidade & WhatsApp Oficial
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Estoque a pronta entrega, retirada local e tele-entregas express via WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center active:scale-95 transition-all touch-manipulation cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Cards */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {branches.map((branch) => {
            const isSelected = selectedBranch.id === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => handleSelect(branch)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-[#1B5E20] bg-[#F1F8F4] shadow-sm'
                    : 'border-[#E8E1D5] bg-white hover:border-[#1B5E20]/50 hover:bg-[#F9F7F2]'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-neutral-900 text-sm">
                      {branch.name}
                    </h3>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B5E20] bg-[#E8F5E9] border border-[#A5D6A7] px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-[#1B5E20]" />
                        Ativa
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1B5E20] shrink-0 mt-0.5" />
                    <span>{branch.address} - {branch.city}/{branch.state}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {branch.openingHours}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[#1B5E20]">
                      <Phone className="w-3 h-3 text-[#1B5E20]" />
                      {branch.phone}
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2.5 pt-3 sm:pt-0 border-t sm:border-0 border-[#E8E1D5] shrink-0">
                  <a
                    href={`https://wa.me/${branch.whatsapp}?text=Ol%C3%A1%2C%20estou%20no%20cat%C3%A1logo%20da%20loja%20${encodeURIComponent(branch.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#E8F8EE] text-[#1E7E34] hover:bg-[#D4F2DE] active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold touch-manipulation cursor-pointer"
                    title="Conversar com a loja"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span className="sm:hidden">WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleSelect(branch)}
                    className={`min-h-[42px] flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'bg-[#1B5E20] text-white shadow-xs'
                        : 'bg-[#111111] text-white hover:bg-[#2A2A2A]'
                    }`}
                  >
                    {isSelected ? 'Selecionada' : 'Escolher'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
