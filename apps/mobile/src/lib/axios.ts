import axios from 'axios';
import { getToken } from './auth';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Tự gắn "Authorization: Bearer <token>" cho mọi request (JwtAuthGuard ở backend cần cái này)
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Lấy thông báo lỗi dễ đọc từ backend (class-validator trả message dạng mảng)
export function getErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại') {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ API.';
    const msg = error.response.data?.message;
    if (Array.isArray(msg)) return msg.join('\n');
    if (typeof msg === 'string') return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}