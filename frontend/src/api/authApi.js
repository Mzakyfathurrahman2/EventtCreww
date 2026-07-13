import axios from 'axios';

import toast from 'react-hot-toast';

// Tentukan API_URL secara dinamis berdasarkan environment variable atau hostname
const getApiUrl = () => {
  // Prioritas 1: gunakan env variable yang sudah dikonfigurasi (di Vercel maupun .env lokal)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '/api') {
    return import.meta.env.VITE_API_URL;
  }
  // Prioritas 2: Jika di Vercel (tidak ada port), kita TIDAK bisa pakai /api karena tidak ada proxy
  // Tapi jika ada VITE_API_URL = '/api' berarti di localhost pakai Vite proxy
  if (typeof window !== 'undefined') {
    const port = window.location.port;
    // Di localhost development (port 5173/5174), pakai proxy Vite
    if (port === '5173' || port === '5174') {
      return '/api';
    }
    // Di production (Vercel) tanpa port, WAJIB pakai URL Render langsung
    // Hardcode sebagai fallback terakhir
    return 'https://eventtcreww.onrender.com/api';
  }
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor untuk global error handling (Toast)
apiClient.interceptors.response.use(
  (response) => {
    // Tampilkan toast sukses untuk request POST, PATCH, PUT, DELETE jika ada field 'message'
    const method = response.config.method?.toLowerCase();
    if (['post', 'patch', 'put', 'delete'].includes(method)) {
      if (response.data && response.data.message) {
        toast.success(response.data.message);
      }
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || 'Terjadi kesalahan jaringan atau server';
    
    // Jangan tampilkan toast untuk error 404 (Not Found) jika kita ingin handle secara custom di komponen
    if (error.response?.status === 401) {
      toast.error('Sesi Anda telah berakhir, silakan login kembali.');
    } else if (error.response?.status !== 404) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  getMe: () => apiClient.get('/auth/me'),
};

export default apiClient;
