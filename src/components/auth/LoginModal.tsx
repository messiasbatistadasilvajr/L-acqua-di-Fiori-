import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { Role } from '../../types';
import { X, Lock, ArrowRight, Loader2, AlertCircle, KeyRound } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, loginWithCredentials, isLoading, error, clearError } = useAuth();
  const { branches } = useBranch();

  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN_GERAL');
  const [email, setEmail] = useState('admin@lacquadifiori.com.br');
  const [password, setPassword] = useState('Lacqua@2026!');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'branch-fortaleza');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    try {
      await loginWithCredentials(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Erro ao realizar login');
    }
  };

  const handleQuickLogin = async (role: Role, defaultEmail: string, defaultPass: string) => {
    setLocalError(null);
    clearError();
    setSelectedRole(role);
    setEmail(defaultEmail);
    setPassword(defaultPass);
    try {
      await loginWithCredentials(defaultEmail, defaultPass);
    } catch (err: any) {
      setLocalError(err.message || 'Erro ao realizar login rápido');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#C5A059]/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#111111] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#C5A059]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A2E20] border border-[#25D366] flex items-center justify-center text-[#25D366] shadow-xs">
              <Lock className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-xl font-bold text-white">
                Acesso Administrativo
              </h2>
              <p className="text-xs text-neutral-400">
                Painel Oficial L'acqua di Fiori
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLoginModal(false)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center active:scale-95 transition-all touch-manipulation cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Role Selector */}
        <div className="p-5 sm:p-6 space-y-4">
          {(error || localError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error || localError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#1B5E20] uppercase tracking-wide block">
              Acesso Rápido com Senhas Seguras:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('ADMIN_GERAL', 'admin@lacquadifiori.com.br', 'Lacqua@2026!')}
                className="min-h-[54px] p-2 bg-white hover:bg-[#E8F5E9] border border-[#DDD3C2] hover:border-[#A5D6A7] rounded-xl text-center active:scale-95 transition-all font-medium text-neutral-800 flex flex-col justify-center items-center touch-manipulation cursor-pointer shadow-xs disabled:opacity-50"
              >
                <strong className="block text-[11px] text-[#1B5E20]">Admin Geral</strong>
                <span className="text-[9px] text-neutral-500 font-mono">Lacqua@2026!</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('GERENTE_FILIAL', 'gerente.centro@lacquadifiori.com.br', 'Centro@2026!')}
                className="min-h-[54px] p-2 bg-white hover:bg-[#E8F5E9] border border-[#DDD3C2] hover:border-[#A5D6A7] rounded-xl text-center active:scale-95 transition-all font-medium text-neutral-800 flex flex-col justify-center items-center touch-manipulation cursor-pointer shadow-xs disabled:opacity-50"
              >
                <strong className="block text-[11px] text-[#1B5E20]">Gerente Centro</strong>
                <span className="text-[9px] text-neutral-500 font-mono">Centro@2026!</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('ATENDENTE', 'atendente@lacquadifiori.com.br', 'Atende@2026!')}
                className="min-h-[54px] p-2 bg-white hover:bg-[#E8F5E9] border border-[#DDD3C2] hover:border-[#A5D6A7] rounded-xl text-center active:scale-95 transition-all font-medium text-neutral-800 flex flex-col justify-center items-center touch-manipulation cursor-pointer shadow-xs disabled:opacity-50"
              >
                <strong className="block text-[11px] text-[#1B5E20]">Atendente</strong>
                <span className="text-[9px] text-neutral-500 font-mono">Atende@2026!</span>
              </button>
            </div>
          </div>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E1D5]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#FAF8F5] px-2 text-neutral-400 font-semibold text-[10px]">
                Ou entre com suas credenciais
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                E-mail Corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@lacquadifiori.com.br"
                className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-[#DDD3C2] rounded-xl text-xs gold-border-focus"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Senha de Acesso (Criptografada no Servidor)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-[#DDD3C2] rounded-xl text-xs gold-border-focus font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3.5 px-4 bg-[#1B5E20] hover:bg-[#144A19] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md touch-manipulation cursor-pointer mt-3 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#A5D6A7]" />
                  <span>Validando Credenciais...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-[#A5D6A7]" />
                  <span>Entrar com Sessão Segura</span>
                  <ArrowRight className="w-4 h-4 text-[#A5D6A7]" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
