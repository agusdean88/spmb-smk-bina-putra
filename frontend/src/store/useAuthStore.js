import { create } from 'zustand';
import axios from 'axios';

import { getApiURL } from '../utils/url';

const api = axios.create({
  baseURL: getApiURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('FRONTEND_AUTH_ERROR: Unauthorized access detected. Logging out...');
      // Access the store's logout function directly
      useAuthStore.getState().logout();
      
      // Optional: redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const getInitialUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    localStorage.removeItem('user');
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, ...user } = response.data;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Email atau password salah';
      
      if (!error.response) {
        message = 'Tidak dapat terhubung ke server. Pastikan backend berjalan di port 5000.';
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      }
      
      return { success: false, message };
    }
  },
  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      const { accessToken, user } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Terjadi kesalahan saat registrasi';
      
      if (!error.response) {
        message = 'Tidak dapat terhubung ke server. Pastikan backend berjalan di port 5000.';
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      }
      
      return { success: false, message };
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));

export default api;
