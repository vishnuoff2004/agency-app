import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import * as secureStore from '../utils/secureStore';
import { decodeJwt } from '../utils/jwt';
import { router } from 'expo-router';
import { Linking } from 'react-native';

export interface User {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserLocal: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const roleRoutes: Record<string, string> = {
  admin: '/admin/dashboard',
  agency_admin: '/agency/dashboard',
  driver: '/driver/dashboard',
  traveler: '/search',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await secureStore.getToken();
        const storedUser = await secureStore.getUser();
        if (storedToken) {
          const payload = decodeJwt(storedToken);
          if (payload) {
            const exp = payload.exp * 1000;
            if (Date.now() < exp) {
              setToken(storedToken);
              setUser(storedUser || { id: payload.id, role: payload.role });
            } else {
              await secureStore.deleteToken();
              await secureStore.deleteUser();
            }
          }
        }
      } catch (err) {
        console.error('AuthContext: Failed to load storage data', err);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const data = await authService.login(email, password);
      
      const userObj = data.user;
      const jwtToken = data.token;

      if (jwtToken) {
        await secureStore.setToken(jwtToken);
        setToken(jwtToken);
      }
      if (userObj) {
        await secureStore.setUser(userObj);
        setUser(userObj);
      }

      const role = userObj?.role || 'traveler';
      if (role === 'traveler') {
        router.replace('/(tabs)/search');
      } else {
        const webBaseUrl = process.env.EXPO_PUBLIC_WEB_URL || 'http://192.168.1.4:3000';
        const targetPath = roleRoutes[role] || '/search';
        const url = `${webBaseUrl}${targetPath}`;
        
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            console.warn(`Cannot open URL: ${url}`);
          }
        });
      }
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (data: any) => {
    try {
      setError(null);
      const res = await authService.register(data);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw err;
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    try {
      setError(null);
      const data = await authService.verifyOtp(email, otp);
      
      const userObj = data.user;
      const jwtToken = data.token;

      if (jwtToken) {
        await secureStore.setToken(jwtToken);
        setToken(jwtToken);
      }
      if (userObj) {
        await secureStore.setUser(userObj);
        setUser(userObj);
      }

      const role = userObj?.role || 'traveler';
      if (role === 'traveler') {
        router.replace('/(tabs)/search');
      } else {
        const webBaseUrl = process.env.EXPO_PUBLIC_WEB_URL || 'http://192.168.1.4:3000';
        const targetPath = roleRoutes[role] || '/search';
        const url = `${webBaseUrl}${targetPath}`;
        Linking.canOpenURL(url).then((supported) => {
          if (supported) Linking.openURL(url);
        });
      }
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await secureStore.deleteToken();
    await secureStore.deleteUser();
    setToken(null);
    setUser(null);
    router.replace('/login');
  }, []);

  const updateUserLocal = useCallback((updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      secureStore.setUser(newUser);
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        verifyOtp,
        logout,
        updateUserLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
