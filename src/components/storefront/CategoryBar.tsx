import React from 'react';
import { Category } from '../../types';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGender: string;
  onSelectGender: (gender: string) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedGender,
  onSelectGender,
}) => {
  return (
    <div className="bg-[#FAF8F5] border-b border-[#E8E1D5] py-5 sticky top-20 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Top Filter Row: Search & Gender Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nome, notas olfativas ou família..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#DDD3C2] rounded-lg text-xs placeholder:text-neutral-400 text-neutral-800 gold-border-focus transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md active:scale-90 transition-all cursor-pointer"
                title="Limpar busca"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Gender Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#EFE9DC] rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            {['Todos', 'Feminino', 'Masculino', 'Unissex'].map((gender) => {
              const active = selectedGender === gender;
              return (
                <button
                  type="button"
                  key={gender}
                  onClick={() => onSelectGender(gender)}
                  className={`flex-1 sm:flex-initial min-h-[38px] px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer ${
                    active
                      ? 'bg-[#111111] text-[#EBD399] shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/40'
                  }`}
                >
                  {gender}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories Bar (Clean segmented filter tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs py-0.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`min-h-[40px] px-4 py-2 rounded-xl font-medium whitespace-nowrap shrink-0 transition-all flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer ${
                  isSelected
                    ? 'bg-[#C5A059] text-black font-semibold shadow-xs'
                    : 'bg-white hover:bg-[#F2EDE2] text-neutral-700 border border-[#DDD3C2]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
