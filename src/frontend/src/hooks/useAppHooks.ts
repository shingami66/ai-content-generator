import { useState, useCallback } from 'react';
import { generationAPI, contentAPI } from '../api/api';

// Define types for clarity
interface ContentItem {
  id: string | any;
  type: 'image' | 'video';
  description: string;
  url: string;
  timestamp?: string;
}

interface User {
  id: string | any;
  username: string;
  email: string;
  subscriptionType?: 'free' | 'starter' | 'pro' | 'premium';
  generationsToday?: number;
  generationsLimit?: number;
}

// Custom hook for authentication state
export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token');
  });
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = useCallback((userData: User, token?: string) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) localStorage.setItem('token', token);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  return {
    isAuthenticated,
    user,
    login,
    logout,
    setIsAuthenticated,
    setUser
  };
};

// Custom hook for UI state
export const useUIState = () => {
  const [activePage, setActivePage] = useState('landing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);

  return {
    activePage,
    setActivePage,
    isGenerating,
    setIsGenerating,
    generatedContent,
    setGeneratedContent
  };
};

// Custom hook for generation functionality
export const useGeneration = (
  user: User | null,
  setIsGenerating?: (value: boolean) => void,
  setGeneratedContent?: React.Dispatch<React.SetStateAction<ContentItem[]>>,
  setUser?: (user: User | null) => void
) => {
  const [error, setError] = useState<string | null>(null);

  // Initialize fal.ai client (Deprecated/Unused if using backend API)
  const initFalClient = useCallback(() => {
    return true;
  }, []);

  // Check if user can generate content (from backend)
  const canGenerate = useCallback(async (): Promise<boolean> => {
    if (!user || !user.id) return false;
    try {
      const response = await generationAPI.canGenerate(user.id);
      return response.success ? response.canGenerate : false;
    } catch (error) {
      console.error('Error checking generation limit:', error);
      return false;
    }
  }, [user]);

  // Increment generation count 
  const incrementGeneration = useCallback(async (type: string): Promise<void> => {
    if (!user || !user.id) return;
    try {
      await generationAPI.incrementGeneration(user.id, type);
    } catch (error) {
      console.error('Error incrementing generation:', error);
    }
  }, [user]);

  // Refresh generation count 
  const refreshGenerationCount = useCallback(async (): Promise<{ count: number; limit: number; remaining: number }> => {
    if (!user || !user.id) return { count: 0, limit: 5, remaining: 5 };
    try {
      const response = await generationAPI.getCount(user.id);
      if (response.success) {
        return {
          count: response.count || 0,
          limit: response.limit || 5,
          remaining: response.remaining || 0
        };
      }
      return { count: 0, limit: 5, remaining: 5 };
    } catch (error) {
      console.error('Error refreshing count:', error);
      return { count: 0, limit: 5, remaining: 5 };
    }
  }, [user]);

  // Unified Generate Content Function
  const generateContent = useCallback(async (type: 'image' | 'video', description: string) => {
    if (!user || !user.id) {
      throw new Error('Please login first');
    }

    if (setIsGenerating) setIsGenerating(true);
    setError(null);

    try {
      // 1. Check limit
      const allowed = await canGenerate();
      if (!allowed) {
        throw new Error('Daily limit reached! Please upgrade to continue.');
      }

      // 2. Call API
      // Note: We use the backend API which handles the fal.ai call securely
      // @ts-ignore
      const response = await contentAPI.generateContent(user.id, type, description);


      // 3. Update Global State
      const newContent: ContentItem = {
        id: response.contentId || Date.now(),
        type,
        description,
        url: response.url,
        timestamp: new Date().toISOString()
      };

      if (setGeneratedContent) {
        setGeneratedContent(prev => [newContent, ...prev]);
      }

      // 4. Update Credits
      await incrementGeneration(type);
      const countInfo = await refreshGenerationCount();

      if (setUser) {
        setUser({
          ...user,
          generationsToday: countInfo.count,
          generationsLimit: countInfo.limit
        });
      }

      return newContent;
    } catch (err: any) {
      console.error('Generation Failed:', err);
      setError(err.message || 'Generation failed');
      throw err;
    } finally {
      if (setIsGenerating) setIsGenerating(false);
    }
  }, [user, canGenerate, incrementGeneration, refreshGenerationCount, setIsGenerating, setGeneratedContent, setUser]);

  return {
    canGenerate,
    incrementGeneration,
    refreshGenerationCount,
    generateContent,
    error,
    initFalClient
  };
};