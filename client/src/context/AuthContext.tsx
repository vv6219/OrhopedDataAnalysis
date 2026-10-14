import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: string | null;
  loading: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {}
});

// Setup fetch interceptor once so all outgoing requests automatically carry auth token
let isInterceptorSetup = false;
function setupFetchInterceptor() {
  if (isInterceptorSetup || typeof window === 'undefined') return;
  isInterceptorSetup = true;

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = localStorage.getItem('ortho_auth_token');
    if (token) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      init.headers = headers;
    }
    return originalFetch(input, init);
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ortho_auth_token'));
  const [user, setUser] = useState<string | null>(() => localStorage.getItem('ortho_auth_user') || 'Администратор');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Setup interceptor on load
  useEffect(() => {
    setupFetchInterceptor();
  }, []);

  // Verify stored token on app load
  useEffect(() => {
    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem('ortho_auth_token');
      if (!storedToken) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setToken(storedToken);
            setUser(data.user || 'Администратор');
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('ortho_auth_token');
            localStorage.removeItem('ortho_auth_user');
            setToken(null);
            setIsAuthenticated(false);
          }
        } else {
          localStorage.removeItem('ortho_auth_token');
          localStorage.removeItem('ortho_auth_user');
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        // Network error - if offline, trust valid token format
        if (storedToken && storedToken.includes('.')) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyStoredToken();
  }, []);

  const login = useCallback(async (password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, username: 'Администратор' })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        return {
          success: false,
          error: `Сервер API недоступен (HTTP ${res.status}). Проверьте, запущен ли бэкенд на порту 5000.`
        };
      }

      if (res.ok && data.success && data.token) {
        localStorage.setItem('ortho_auth_token', data.token);
        localStorage.setItem('ortho_auth_user', data.user || 'Администратор');
        setToken(data.token);
        setUser(data.user || 'Администратор');
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Неверный пароль' };
      }
    } catch (err: any) {
      return { success: false, error: 'Не удалось связаться с сервером. Убедитесь, что сервер запущен.' };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    } finally {
      localStorage.removeItem('ortho_auth_token');
      localStorage.removeItem('ortho_auth_user');
      setToken(null);
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
