import React, { createContext, useContext, useState, useEffect } from 'react';
import { Branch } from '../types';
import { api } from '../services/api';
import { INITIAL_BRANCHES } from '../data/seedData';

interface BranchContextType {
  branches: Branch[];
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  isLoadingBranches: boolean;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [selectedBranch, setSelectedBranchState] = useState<Branch>(INITIAL_BRANCHES[0]);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);

  const refreshBranches = async () => {
    try {
      const data = await api.getBranches();
      if (data && data.length > 0) {
        setBranches(data);
        // Retém filial salva se existir
        const savedId = localStorage.getItem('ldf_branch_id');
        const found = data.find((b) => b.id === savedId);
        if (found) {
          setSelectedBranchState(found);
        } else {
          setSelectedBranchState(data[0]);
        }
      }
    } catch (err) {
      console.warn('Usando filiais padrão locais:', err);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  useEffect(() => {
    refreshBranches();
  }, []);

  const setSelectedBranch = (branch: Branch) => {
    setSelectedBranchState(branch);
    localStorage.setItem('ldf_branch_id', branch.id);
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        setSelectedBranch,
        isLoadingBranches,
        refreshBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) throw new Error('useBranch deve ser usado dentro de BranchProvider');
  return context;
};
