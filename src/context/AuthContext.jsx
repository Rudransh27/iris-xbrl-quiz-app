// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import api from '../admin/services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.validateToken();
          if (res.valid) {
            setUser({ ...res.user, xp: res.user.xp ?? 0 });
            localStorage.setItem('user', JSON.stringify(res.user));
          } else logout();
        } catch (err) { logout(); }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const refreshUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await api.validateToken();
    if (res.valid) {
      const userData = {
        ...res.user,
        isAdmin: res.user.role === 'admin',
        xp: res.user.xp ?? 0,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  } catch (err) {
    console.error("Failed to refresh user:", err.message);
  }
};


  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      localStorage.setItem('token', res.token);

      const validateRes = await api.validateToken();
      if (!validateRes.valid) throw new Error('Invalid token after login');

      const userData = { ...validateRes.user, xp: validateRes.user.xp ?? 0 };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await api.register(username, email, password);
      localStorage.setItem('token', res.token);
      const userData = { ...res.user, xp: res.user.xp ?? 100 };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUserXP = (xpToAdd) => {
    if (user) {
      const updatedUser = { ...user, xp: xpToAdd };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserXP, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
