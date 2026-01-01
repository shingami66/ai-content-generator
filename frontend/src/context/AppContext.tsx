// src/context/AppContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthState, useUIState, useGeneration } from '../hooks/useAppHooks';

interface AppContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuth: boolean) => void;
  user: any | null;
  setUser: (user: any | null) => void;
  activePage: string;
  setActivePage: (page: string) => void;
  generatedContent: any[];
  setGeneratedContent: React.Dispatch<React.SetStateAction<any[]>>;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  canGenerate: () => Promise<boolean>;
  incrementGeneration: (type: string) => Promise<void>;
  refreshGenerationCount: () => Promise<{ count: number; limit: number; remaining: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authState = useAuthState();
  const uiState = useUIState();
  const generation = useGeneration(authState.user, uiState.setIsGenerating);

  const value: AppContextType = {
    ...authState,
    ...uiState,
    ...generation
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
