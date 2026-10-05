import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('vibely_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vibely_token') || null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error('Failed to load unread notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    window.addEventListener('focus', fetchUnreadCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchUnreadCount);
    };
  }, [token, fetchUnreadCount]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vibely_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('vibely_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const setSession = (userData) => {
    setUser(userData);
    setToken(userData.token);
    localStorage.setItem('vibely_token', userData.token);
    localStorage.setItem('vibely_user', JSON.stringify(userData));
  };

  const login = async (loginId, password) => {
    const res = await api.post('/auth/login', { loginId, password });
    if (res.data.success) {
      setSession(res.data.data);
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      setSession(res.data.data);
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUnreadCount(0);
    localStorage.removeItem('vibely_token');
    localStorage.removeItem('vibely_user');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('vibely_user', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    window.addEventListener('vibely:unauthorized', logout);
    return () => window.removeEventListener('vibely:unauthorized', logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        unreadCount,
        refreshUnreadCount: fetchUnreadCount,
        login,
        register,
        setSession,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
