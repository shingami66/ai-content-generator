// Secure Authentication Service
import { authAPI } from './api';

class AuthService {
  // Store token in localStorage
  static setToken(token: string): void {
    try {
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  // Get token from localStorage
  static getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  // Remove token from localStorage
  static removeToken(): void {
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      // Invalid token
      this.removeToken();
      return false;
    }
  }

  // Login user
  static async login(email: string, password: string): Promise<any> {
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.token) {
        this.setToken(response.token);
        return response;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      this.removeToken();
      throw error;
    }
  }

  // Register user
  static async register(username: string, email: string, password: string): Promise<any> {
    try {
      const response = await authAPI.register(username, email, password);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  static logout(): void {
    this.removeToken();
  }
}

export default AuthService;