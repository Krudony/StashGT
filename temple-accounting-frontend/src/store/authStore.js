import { create } from 'zustand';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create((set, get) => {
  // Try to restore user from localStorage
  const restoreUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Try to get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          return JSON.parse(storedUser);
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.removeItem('token');
      }
    }
    return null;
  };

  return {
    user: restoreUser(),
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
    validationErrors: {},

    register: async (username, email, password, temple_name) => {
      set({ isLoading: true, error: null, validationErrors: {} });
      try {
        const response = await api.post('/auth/register', {
          username,
          email,
          password,
          temple_name,
        });
        set({ validationErrors: {} });
        return response.data;
      } catch (error) {
        const errorData = error.response?.data;
        if (errorData?.details) {
          // Validation errors from backend
          set({
            validationErrors: errorData.details,
            error: errorData.error || 'Registration failed'
          });
        } else {
          set({ error: errorData?.error || 'Registration failed' });
        }
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
        localStorage.setItem('user', JSON.stringify(user));
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
      localStorage.removeItem('user');
      set({ user: null, token: null });
    },

    clearError: () => set({ error: null }),
  };
});
