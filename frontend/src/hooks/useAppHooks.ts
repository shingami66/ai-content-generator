import { useState, useCallback } from 'react';
import { generationAPI } from '../api/api';
import * as fal from '@fal-ai/client';

// Define types for clarity
interface ContentItem {
  id: number;
  type: 'image' | 'video';
  description: string;
  url: string;
  timestamp: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  subscriptionType?: 'free' | 'premium';
  generationsToday?: number;
  generationsLimit?: number;
}

// Custom hook for authentication state
export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
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
export const useGeneration = (user: User | null, setIsGenerating?: (value: boolean) => void) => {
  const [error, setError] = useState<string | null>(null);

  // Initialize fal.ai client
  const initFalClient = useCallback((apiKey: string) => {
    try {
      (fal as any).config({
        credentials: apiKey,
      });
      return true;
    } catch (err) {
      console.error('Failed to initialize fal.ai client:', err);
      setError('Failed to initialize AI service');
      return false;
    }
  }, []);

  // Check if user can generate content (from backend)
  const canGenerate = useCallback(async (): Promise<boolean> => {
    if (!user || !user.id) return false;
    
    try {
      const response = await generationAPI.canGenerate(user.id);
      
      if (response.success) {
        return response.canGenerate;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking generation limit:', error);
      return false;
    }
  }, [user]);

  // Increment generation count (backend tracks via content table)
  const incrementGeneration = useCallback(async (type: string): Promise<void> => {
    if (!user || !user.id) return;
    
    try {
      await generationAPI.incrementGeneration(user.id, type);
    } catch (error) {
      console.error('Error incrementing generation:', error);
    }
  }, [user]);

  // Refresh generation count from backend and return full info
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

  // Generate image using fal.ai
  const generateImage = useCallback(async (prompt: string, model = 'fal-ai/fast-sdxl') => {
    if (!user) {
      setError('Please login first');
      return null;
    }

    setIsGenerating?.(true);
    setError(null);

    try {
      // Check if user can generate
      const canGen = await canGenerate();
      if (!canGen) {
        setError('You have reached the maximum limit allowed');
        return null;
      }

      // Generate image
      const result = await (fal as any).run(model, {
        input: {
          prompt: prompt,
          image_size: "square_hd",
          num_images: 1
        }
      });

      // Log the generation
      await incrementGeneration('image');
      
      return {
        url: result.images[0].url,
        width: result.images[0].width,
        height: result.images[0].height
      };
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image. Please try again.');
      return null;
    } finally {
      setIsGenerating?.(false);
    }
  }, [user, canGenerate]);

  return {
    canGenerate,
    incrementGeneration,
    refreshGenerationCount,
    generateImage,
    error,
    initFalClient
  };
};