// src/pages/AuthenticationPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAppContext } from '../context/AppContext';
import AuthService from '../api/authService';



const AuthenticationPage: React.FC = () => {
  const { setIsAuthenticated, setUser, setActivePage } = useAppContext();
  const navigate = useNavigate();
  // Determine the default mode based on the current path
  const initialMode = window.location.pathname === '/register' ? 'register' : 'login';
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
  const [error, setError] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setActivePage(authMode);
    // Update the path in the browser when switching between tabs
    navigate(`/${authMode}`, { replace: true });
  }, [authMode, setActivePage, navigate]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      setError('');
      try {
        const response = await AuthService.googleLogin(credentialResponse.credential);
        if (response.success) {
          setIsAuthenticated(true);
          setUser(response.user);
          navigate('/dashboard');
        }
      } catch (error: any) {
        setError(error.message || 'Google Login failed. Please try again.');
      }
    }
  };

  const handleGoogleError = () => {
    setError('Google Login failed. Please try again.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const response = await AuthService.login(loginData.email, loginData.password);
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user);
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (!registerData.username || !registerData.email || !registerData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const response = await AuthService.register(
        registerData.username,
        registerData.email,
        registerData.password
      );
      if (response.success) {
        // Prompt user to login
        alert('Registration successful! Please sign in with your new account.');
        setAuthMode('login');
        setLoginData(prev => ({ ...prev, email: registerData.email }));
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    }
  };

  const isLoginMode = authMode === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form className="bg-[#1e1e28]/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300" onSubmit={isLoginMode ? handleLogin : handleRegister}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-gray-400">{isLoginMode ? 'Sign in to your account' : 'Join us to start your journey!'}</p>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        {!isLoginMode && (
          <div className="mb-4">
            <input
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              type="text"
              placeholder="Username"
              value={registerData.username}
              onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
              required
            />
          </div>
        )}

        <div className="mb-4">
          <input
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            type="email"
            placeholder="Email address"
            value={isLoginMode ? loginData.email : registerData.email}
            onChange={(e) => isLoginMode ? setLoginData({ ...loginData, email: e.target.value }) : setRegisterData({ ...registerData, email: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <input
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            type="password"
            placeholder="Password"
            value={isLoginMode ? loginData.password : registerData.password}
            onChange={(e) => isLoginMode ? setLoginData({ ...loginData, password: e.target.value }) : setRegisterData({ ...registerData, password: e.target.value })}
            required
          />
        </div>

        {!isLoginMode && (
          <div className="mb-4">
            <input
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              type="password"
              placeholder="Confirm Password"
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
              required
            />
          </div>
        )}

        <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-bold text-white shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all mt-2 cursor-pointer">
          {isLoginMode ? 'Sign In' : 'Create Account'}
        </button>

        <div className="auth-separator" style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: 'white', padding: '0 10px', color: '#888', zIndex: 1, position: 'relative' }}>OR</span>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderBottom: '1px solid #eee' }}></div>
        </div>

        <div className="google-login-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            shape="rectangular"
            theme="outline"
            size="large"
          />
        </div>

        <p className="text-center mt-6 text-gray-400">
          {isLoginMode ? (
            <>
              Don't have an account?{' '}
              <span className="cursor-pointer text-primary hover:text-secondary transition-colors font-medium" onClick={() => setAuthMode('register')}>
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span className="cursor-pointer text-primary hover:text-secondary transition-colors font-medium" onClick={() => setAuthMode('login')}>
                Sign in
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default AuthenticationPage;