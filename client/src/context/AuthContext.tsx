import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserProfileResponseDto,
  LoginRequestDto,
  UserRegisterRequestDto,
  UserRegisterResponseDto,
} from '../types';
import { authService } from '../services/authService';
import { getToken, setToken, removeToken } from '../services/api';

interface AuthContextType {
  user: UserProfileResponseDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequestDto) => Promise<void>;
  register: (data: UserRegisterRequestDto) => Promise<UserRegisterResponseDto>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileResponseDto | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and validate existing token on app start or refresh
  const verifySession = useCallback(async () => {
    const savedToken = getToken();
    if (!savedToken) {
      setUser(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
      setTokenState(savedToken);
    } catch {
      // Token is expired or invalid
      removeToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();

    // Listen for global 401 unauthorized events emitted from apiFetch
    const handleUnauthorized = () => {
      removeToken();
      setUser(null);
      setTokenState(null);
    };

    window.addEventListener('geovision:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('geovision:unauthorized', handleUnauthorized);
    };
  }, [verifySession]);

  const login = async (credentials: LoginRequestDto) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      setToken(res.token);
      setTokenState(res.token);

      // Immediately fetch current user profile with the new token
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: UserRegisterRequestDto) => {
    return await authService.register(data);
  };

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setTokenState(null);
  }, []);

  const refreshUser = async () => {
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } catch {
      logout();
    }
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
