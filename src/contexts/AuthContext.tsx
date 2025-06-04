// src/contexts/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Configuración de seguridad
const ADMIN_PASSWORD = "admin123"; // Cambiar por tu password
const SESSION_KEY = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas en millisegundos

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión existente al cargar
  useEffect(() => {
    const checkSession = () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const { timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          
          // Verificar si la sesión no ha expirado
          if (now - timestamp < SESSION_DURATION) {
            setIsAuthenticated(true);
          } else {
            // Sesión expirada, limpiar
            sessionStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        sessionStorage.removeItem(SESSION_KEY);
      }
      
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      const sessionData = {
        timestamp: Date.now(),
        authenticated: true
      };
      
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};