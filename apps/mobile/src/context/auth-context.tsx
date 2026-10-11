import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { JwtPayload } from '@FoodDelivery/types';
import { api } from '@/lib/axios';
import { saveToken, getToken, deleteToken } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

export type UserRole = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DRIVER';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  user: JwtPayload | null; // GET /auth/me trả về JwtPayload
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const res = await api.get<JwtPayload>('/auth/me');
    setUser(res.data);
  }, []);

  // Khôi phục phiên khi mở app
  useEffect(() => {
    (async () => {
      try {
        if (await getToken()) await loadUser();
      } catch (e) {
        // Chỉ xóa token khi server báo token sai/hết hạn, không xóa khi chỉ mất mạng
        if (axios.isAxiosError(e) && e.response?.status === 401) await deleteToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post('/auth/login', { email, password });
      await saveToken(res.data.token);
      await loadUser();
    },
    [loadUser],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const res = await api.post('/auth/register', data);
      await saveToken(res.data.token);
      await loadUser();
    },
    [loadUser],
  );

  // Google qua backend trung gian (chạy được trong Expo Go)
  const loginWithGoogle = useCallback(
    async (role: UserRole) => {
      const returnUrl = Linking.createURL('login');
      const startUrl =
        `${process.env.EXPO_PUBLIC_API_URL}/auth/google/start` +
        `?role=${role}&returnUrl=${encodeURIComponent(returnUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
      if (result.type !== 'success') return; // người dùng huỷ

      const token = Linking.parse(result.url).queryParams?.token;
      if (typeof token !== 'string') throw new Error('Không nhận được token từ Google');

      await saveToken(token);
      await loadUser();
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    await deleteToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, loginWithGoogle, logout }),
    [user, isLoading, login, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};