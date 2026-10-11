import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('datavault_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('datavault_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await authAPI.getProfile();
          if (res.data && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('datavault_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid token');
          localStorage.removeItem('datavault_token');
          localStorage.removeItem('datavault_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const data = res.data;
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('datavault_token', data.token);

      const userData = {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        organizationName: data.organizationName,
        emergencyLockActive: data.emergencyLockActive,
        accountStatus: data.accountStatus,
      };
      setUser(userData);
      localStorage.setItem('datavault_user', JSON.stringify(userData));
    }
    return data;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    return res.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (e) {
      console.warn('Logout error ignored:', e);
    } finally {
      localStorage.removeItem('datavault_token');
      localStorage.removeItem('datavault_user');
      setUser(null);
      setToken(null);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authAPI.getProfile();
      if (res.data && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('datavault_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const updateLockState = (isActive) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, emergencyLockActive: isActive };
      localStorage.setItem('datavault_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateLockState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
