// src/context/AppContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthState, useUIState, useGeneration } from '../hooks/useAppHooks';

interface User {
  id: string;
  username: string;
  email: string;
  photoUrl?: string;
  subscriptionType?: 'free' | 'starter' | 'pro' | 'premium';
  subscriptionEndDate?: string;
  generationsToday?: number;
  generationsLimit?: number;
  generationsRemaining?: number;
  videoCredits?: number;
}

interface GeneratedContent {
  id: string | any;
  type: 'image' | 'video';
  description: string;
  url: string;
  timestamp?: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuth: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  activePage: string;
  setActivePage: (page: string) => void;
  generatedContent: GeneratedContent[];
  setGeneratedContent: React.Dispatch<React.SetStateAction<GeneratedContent[]>>;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  canGenerate: () => Promise<boolean>;
  generateContent: (type: 'image' | 'video', description: string) => Promise<any>;
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
  const generation = useGeneration(
    authState.user,
    uiState.setIsGenerating,
    uiState.setGeneratedContent,
    authState.setUser
  );

  const value: AppContextType = {
    ...authState,
    ...uiState,
    ...generation
  };

  // Ref to store previous subscription type for comparison
  const prevSubscriptionTypeRef = React.useRef<string | undefined>(authState.user?.subscriptionType);

  // Update ref when user changes (but don't trigger effect)
  React.useEffect(() => {
    if (authState.user?.subscriptionType) {
      prevSubscriptionTypeRef.current = authState.user.subscriptionType;
    }
  }, [authState.user?.subscriptionType]);

  // Sync user data on window focus & Show Toast on Upgrade
  React.useEffect(() => {
    const handleFocus = async () => {
      if (authState.isAuthenticated && authState.user) {
        try {
          const { userAPI } = await import('../api/api');
          const { default: toast } = await import('react-hot-toast');
          const { default: confetti } = await import('canvas-confetti');

          const response = await userAPI.getCurrentProfile();
          if (response.success && response.user) {
            const newUser = response.user;
            const oldType = prevSubscriptionTypeRef.current;
            const newType = newUser.subscriptionType;

            // Update user state
            authState.setUser(newUser);

            // Check for upgrade
            if (oldType && newType && oldType !== newType) {
              // Simple check: if new type is 'better' than old, or just different not 'free'
              const planRank = { 'free': 0, 'starter': 1, 'pro': 2, 'premium': 3 };
              const oldRank = planRank[oldType as keyof typeof planRank] || 0;
              const newRank = planRank[newType as keyof typeof planRank] || 0;

              if (newRank > oldRank) {
                toast.success(`🎉 Upgrade Successful! You are now on ${newType.toUpperCase()} plan.`, {
                  duration: 5000,
                  position: 'top-center',
                  icon: '🚀'
                });

                // Fire Confetti!
                confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#FFD700', '#FF00FF', '#00FFFF'] // Gold, Magenta, Cyan
                });
              }
            }
          }
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [authState.isAuthenticated, authState.user, authState.setUser]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
