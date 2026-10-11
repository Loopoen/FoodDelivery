import * as SecureStore from 'expo-secure-store';

export type UserRole = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DRIVER';

export async function loginWithGoogleIdToken(idToken: string, role: UserRole = 'CUSTOMER') {
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, role }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? 'Đăng nhập thất bại');

  await SecureStore.setItemAsync('token', data.token);
  return data.user;
}