'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshToken = async () => {
    try {
      const response = await apiClient.post<{ accessToken: string }>(
        '/auth/refresh',
        {}
      );
      localStorage.setItem('accessToken', response.accessToken);
      await fetchCurrentUser();
    } catch (error) {
      localStorage.removeItem('accessToken');
      setUser(null);
      throw error;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        return;
      }

      const response = await apiClient.get<{ user: User }>('/auth/me');
      setUser(response.user);
    } catch (error) {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{
      accessToken: string;
      user: User;
    }>('/auth/login', { email, password });

    localStorage.setItem('accessToken', response.accessToken);
    setUser(response.user);
    router.push('/');
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      router.push('/login');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        await fetchCurrentUser();
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const interval = setInterval(
      async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            await refreshToken();
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }
      },
      50 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
