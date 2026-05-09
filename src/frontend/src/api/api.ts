// API Configuration and Service Functions

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const isAuthEndpoint = endpoint.startsWith('/auth/');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout (for video generation)

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(!isAuthEndpoint && token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });

    // Read body once, then try to parse JSON
    const raw = await response.text();
    const hasBody = raw != null && raw !== '';

    let data: any = null;
    if (hasBody) {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        // Non-JSON or invalid JSON
        if (response.ok) {
          throw new Error('Invalid JSON response from server');
        }
        throw new Error('Request failed with non-JSON error response');
      }
    }

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      if (!isAuthEndpoint && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        // Clear token and redirect to login
        try { localStorage.removeItem('token'); } catch { }
        window.location.href = '/login';
      }
      throw new Error(data?.message || 'Unauthorized access');
    }

    if (!response.ok) {
      const message = (data && (data.message || data.error)) || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

// Authentication APIs
export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  login: async (email: string, password: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  googleLogin: async (credential: string) => {
    return apiCall('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },
};

// User APIs
export const userAPI = {
  getCurrentProfile: async () => {
    return apiCall('/users/profile');
  },

  getProfile: async (userId: string | any) => {
    return apiCall(`/users/${userId}`);
  },

  updateProfile: async (userId: string | any, username: string, email: string) => {
    return apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ username, email }),
    });
  },
};

// Content APIs
export const contentAPI = {
  getUserContent: async (userId: string | any) => {
    return apiCall(`/content/user/${userId}`);
  },

  generateContent: async (userId: string | any, type: string, description: string) => {
    return apiCall('/content/generate', {
      method: 'POST',
      body: JSON.stringify({ userId, type, description }),
    });
  },

  saveContent: async (userId: string | any, type: string, description: string, url: string) => {
    return apiCall('/content/save', {
      method: 'POST',
      body: JSON.stringify({ userId, type, description, url }),
    });
  },

  deleteContent: async (contentId: number) => {
    return apiCall(`/content/${contentId}`, {
      method: 'DELETE',
    });
  },
};

// Feedback APIs
export const feedbackAPI = {
  getAllFeedback: async () => {
    return apiCall('/feedback');
  },

  submitFeedback: async (
    userId: string | any | null,
    message: string
  ) => {
    return apiCall('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    });
  },
};

// Subscription APIs
export const subscriptionAPI = {
  getSubscription: async (userId: string | any) => {
    return apiCall(`/subscription/${userId}`);
  },


  updateSubscription: async (userId: string | any, planType: string, status: string) => {
    return apiCall('/subscription/update', {
      method: 'POST',
      body: JSON.stringify({ userId, planType, status }),
    });
  },

  activateSubscription: async (userId: string | any, paymentMethod: string) => {
    return apiCall('/subscription/activate', {
      method: 'POST',
      body: JSON.stringify({ userId, paymentMethod }),
    });
  },

  cancelSubscription: async (userId: string | any) => {
    return apiCall('/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  createCheckout: async (userId: string | any, productId: string) => {
    return apiCall('/subscription/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ userId, productId }),
    });
  },

  verifySession: async (sessionId: string) => {
    return apiCall('/subscription/verify-session', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  createPortalSession: async (userId: string | any) => {
    return apiCall('/subscription/create-portal-session', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  content: contentAPI,
  feedback: feedbackAPI,
  subscription: subscriptionAPI,
};

// Generation tracking APIs
export const generationAPI = {
  canGenerate: async (userId: string | any) => {
    return apiCall(`/generations/can-generate/${userId}`);
  },

  incrementGeneration: async (userId: string | any, type: string) => {
    return apiCall('/generations/increment', {
      method: 'POST',
      body: JSON.stringify({ userId, type }),
    });
  },

  getCount: async (userId: string | any) => {
    return apiCall(`/generations/count/${userId}`);
  },
};
