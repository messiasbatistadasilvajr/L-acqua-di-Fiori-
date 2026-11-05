import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  login: (roleOrEmail: Role | string, emailOrPass?: string, branchId?: string) => Promise<void>;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ldf_user');
      const token = localStorage.getItem('ldf_token');
      return saved && token ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validação assíncrona da sessão ativa contra o backend
  useEffect(() => {
    const token = localStorage.getItem('ldf_token');
    if (token) {
      api.getCurrentUser()
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('ldf_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Token expirado ou inválido
          localStorage.removeItem('ldf_token');
          localStorage.removeItem('ldf_user');
          setUser(null);
        });
    }
  }, []);

  const loginWithCredentials = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('ldf_token', res.token);
      localStorage.setItem('ldf_user', JSON.stringify(res.user));
      setUser(res.user);
      setShowLoginModal(false);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Suporte flexível para login com credenciais oficiais
  const login = async (roleOrEmail: Role | string, emailOrPass?: string) => {
    setError(null);
    let targetEmail = 'admin@lacquadifiori.com.br';
    let targetPass = 'Lacqua@2026!';

    if (roleOrEmail === 'ADMIN_GERAL') {
      targetEmail = emailOrPass || 'admin@lacquadifiori.com.br';
      targetPass = 'Lacqua@2026!';
    } else if (roleOrEmail === 'GERENTE_FILIAL') {
      targetEmail = emailOrPass || 'gerente.centro@lacquadifiori.com.br';
      targetPass = 'Centro@2026!';
    } else if (roleOrEmail === 'ATENDENTE') {
      targetEmail = emailOrPass || 'atendente@lacquadifiori.com.br';
      targetPass = 'Atende@2026!';
    } else if (typeof roleOrEmail === 'string' && roleOrEmail.includes('@')) {
      targetEmail = roleOrEmail;
      targetPass = emailOrPass || 'Lacqua@2026!';
    }

    return loginWithCredentials(targetEmail, targetPass);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ldf_user');
    localStorage.removeItem('ldf_token');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: !!user,
        isLoggedIn: !!user,
        loginWithCredentials,
        login,
        logout,
        showLoginModal,
        setShowLoginModal,
        isLoading,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
