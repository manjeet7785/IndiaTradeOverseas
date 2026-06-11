import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = authApi.getToken();
    if (token) {
      try {
        const response = await authApi.getMe();
        if (response.success) {
          setUser(response.data.user);
        } else {
          authApi.logout();
        }
      } catch (error) {
        authApi.logout();
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    if (response.success) {
      setUser(response.data.user);
    }
    return response;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    if (response.success) {
      setUser(response.data.user);
    }
    return response;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};