import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

export interface UserPermission {
  id: number;
  code: string;
  name: string;
  description?: string;
  badge_color?: string;
  is_system?: number | boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  staffId?: number | null;
  staffName?: string | null;
  autoLockMinutes?: number;
  mainScreen?: string | null;
  permissions?: UserPermission[];
  permissionCodes?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLocked: boolean;
  token: string | null;
  user: string | null; // Display name
  currentUser: AuthUser | null;
  loading: boolean;
  secondsUntilLock: number;
  showInactivityWarning: boolean;
  hasPermission: (code: string) => boolean;
  login: (usernameOrPassword: string, password?: string) => Promise<{ success: boolean; error?: string; user?: AuthUser; mainScreen?: string }>;
  unlock: (password: string) => Promise<{ success: boolean; error?: string }>;
  lock: () => void;
  logout: () => void;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLocked: false,
  token: null,
  user: null,
  currentUser: null,
  loading: true,
  secondsUntilLock: 900,
  showInactivityWarning: false,
  hasPermission: () => false,
  login: async () => ({ success: false }),
  unlock: async () => ({ success: false }),
  lock: () => {},
  logout: () => {},
  extendSession: () => {}
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
  const [user, setUser] = useState<string | null>(() => localStorage.getItem('ortho_auth_user') || 'Главный Администратор');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('ortho_auth_user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => localStorage.getItem('ortho_is_locked') === 'true');
  const [loading, setLoading] = useState<boolean>(true);

  // Inactivity tracking state
  const [secondsUntilLock, setSecondsUntilLock] = useState<number>(900);
  const [showInactivityWarning, setShowInactivityWarning] = useState<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);

  // Setup interceptor on load
  useEffect(() => {
    setupFetchInterceptor();
  }, []);

  // Lock function
  const lock = useCallback(() => {
    setIsLocked(true);
    setShowInactivityWarning(false);
    localStorage.setItem('ortho_is_locked', 'true');
  }, []);

  // Extend session (reset inactivity timer)
  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowInactivityWarning(false);
    const timeoutMin = currentUser?.autoLockMinutes || 15;
    setSecondsUntilLock(timeoutMin * 60);
  }, [currentUser]);

  // Activity listeners for automatic lock screen
  useEffect(() => {
    if (!isAuthenticated || isLocked) return;

    const timeoutMin = currentUser?.autoLockMinutes || 15;
    if (timeoutMin <= 0) return; // Inactivity lock disabled if <= 0

    const timeoutSeconds = timeoutMin * 60;
    lastActivityRef.current = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle event handling to once every 1000ms
      if (now - lastThrottleRef.current > 1000) {
        lastThrottleRef.current = now;
        lastActivityRef.current = now;
        setShowInactivityWarning(false);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Global keyboard shortcut Ctrl+L / Cmd+L for quick lock
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Inactivity checker interval (runs every 1 second)
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, timeoutSeconds - elapsedSeconds);
      setSecondsUntilLock(remaining);

      // Show warning in last 60 seconds
      if (remaining > 0 && remaining <= 60) {
        setShowInactivityWarning(true);
      } else if (remaining <= 0) {
        lock();
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, [isAuthenticated, isLocked, currentUser, lock]);

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
            const displayName = data.user || data.username || 'Главный Администратор';
            setUser(displayName);
            const userObj: AuthUser = {
              id: data.userId || 1,
              username: data.username || 'admin',
              fullName: displayName,
              role: data.role || 'admin',
              staffId: data.staffId,
              autoLockMinutes: data.autoLockMinutes || 15,
              mainScreen: data.mainScreen || '/',
              permissions: data.permissions || [],
              permissionCodes: data.permissionCodes || []
            };
            setCurrentUser(userObj);
            localStorage.setItem('ortho_auth_user', displayName);
            localStorage.setItem('ortho_auth_user_data', JSON.stringify(userObj));
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('ortho_auth_token');
            localStorage.removeItem('ortho_auth_user');
            localStorage.removeItem('ortho_auth_user_data');
            localStorage.removeItem('ortho_is_locked');
            setToken(null);
            setIsAuthenticated(false);
          }
        } else {
          localStorage.removeItem('ortho_auth_token');
          localStorage.removeItem('ortho_auth_user');
          localStorage.removeItem('ortho_auth_user_data');
          localStorage.removeItem('ortho_is_locked');
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

  // Login method accepting (username, password) or legacy (password)
  const login = useCallback(async (usernameOrPassword: string, maybePassword?: string) => {
    const isSingleArg = maybePassword === undefined;
    const username = isSingleArg ? 'admin' : usernameOrPassword;
    const password = isSingleArg ? usernameOrPassword : maybePassword;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
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
        const displayName = data.user || username;
        localStorage.setItem('ortho_auth_user', displayName);
        localStorage.setItem('ortho_last_login_username', data.username || username);
        localStorage.removeItem('ortho_is_locked');

        const userObj: AuthUser = {
          id: data.userId || 1,
          username: data.username || username,
          fullName: displayName,
          role: data.role || 'admin',
          staffId: data.staffId,
          staffName: data.staffName,
          autoLockMinutes: data.autoLockMinutes || 15,
          mainScreen: data.mainScreen || '/',
          permissions: data.permissions || [],
          permissionCodes: data.permissionCodes || []
        };

        localStorage.setItem('ortho_auth_user_data', JSON.stringify(userObj));

        setToken(data.token);
        setUser(displayName);
        setCurrentUser(userObj);
        setIsAuthenticated(true);
        setIsLocked(false);
        extendSession();
        return { success: true, user: userObj, mainScreen: userObj.mainScreen || '/' };
      } else {
        return { success: false, error: data.error || 'Неверный логин или пароль' };
      }
    } catch (err: any) {
      return { success: false, error: 'Не удалось связаться с сервером. Убедитесь, что сервер запущен.' };
    }
  }, [extendSession]);

  // Unlock method for Lock Screen
  const unlock = useCallback(async (password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          password,
          username: currentUser?.username,
          userId: currentUser?.id
        })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        return { success: false, error: 'Ошибка ответа сервера' };
      }

      if (res.ok && data.success) {
        setIsLocked(false);
        localStorage.removeItem('ortho_is_locked');
        extendSession();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Неверный пароль разблокировки' };
      }
    } catch (err: any) {
      return { success: false, error: 'Ошибка связи с сервером: ' + err.message };
    }
  }, [token, currentUser, extendSession]);

  // Logout method
  const logout = useCallback(() => {
    try {
      const storedToken = localStorage.getItem('ortho_auth_token');
      if (storedToken) {
        fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${storedToken}` }
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('ortho_auth_token');
      localStorage.removeItem('ortho_auth_user');
      localStorage.removeItem('ortho_auth_user_data');
      localStorage.removeItem('ortho_is_locked');
      setToken(null);
      setUser(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLocked(false);
    }
  }, []);

  // Check permission helper
  const hasPermission = useCallback((code: string) => {
    if (!currentUser) return false;
    // Sysadmin or admin role has all permissions
    if (currentUser.role === 'admin' || currentUser.permissionCodes?.includes('sysadmin')) return true;
    return !!currentUser.permissionCodes?.includes(code);
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLocked,
        token,
        user,
        currentUser,
        loading,
        secondsUntilLock,
        showInactivityWarning,
        hasPermission,
        login,
        unlock,
        lock,
        logout,
        extendSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
