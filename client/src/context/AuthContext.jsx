import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiGetMe, apiVerifyEmailOtp } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nexora_token') || null);
  const [loading, setLoading] = useState(true);
  const [currentLocality, setCurrentLocality] = useState('Bandra, Mumbai');

  useEffect(() => {
    const loadSession = async () => {
      const savedToken = localStorage.getItem('nexora_token');
      if (savedToken) {
        try {
          const res = await apiGetMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            localStorage.removeItem('nexora_token');
            setUser(null);
          }
        } catch {
          localStorage.removeItem('nexora_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    if (res.success && res.token && !res.twoFactorRequired) {
      localStorage.setItem('nexora_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const complete2FALogin = (res) => {
    if (res.success && res.token) {
      localStorage.setItem('nexora_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const loginWithEmailOtp = async (email, otp) => {
    const res = await apiVerifyEmailOtp(email, otp);
    if (res.success && res.token) {
      localStorage.setItem('nexora_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await apiRegister(userData);
    if (res.success && res.token) {
      localStorage.setItem('nexora_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('nexora_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await apiGetMe();
      if (res.success) setUser(res.user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        complete2FALogin,
        loginWithEmailOtp,
        register,
        logout,
        refreshUser,
        currentLocality,
        setCurrentLocality,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isProvider: user?.role === 'provider',
        isCustomer: user?.role === 'customer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
