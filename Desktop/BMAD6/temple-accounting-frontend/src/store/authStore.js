import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  register: async (username, email, password, temple_name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        temple_name,
      });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Registration failed' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ user, token });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Login failed' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
