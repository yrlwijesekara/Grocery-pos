import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (employeeId: string, password: string) => Promise<boolean>;
  logout: () => void;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (employeeId: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login(employeeId, password);
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success(`Welcome back, ${user.firstName}!`);
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          return false;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          toast.success('Logged out successfully');
        }
      },

      clockIn: async () => {
        try {
          await authAPI.clockIn();
          const { user } = get();
          if (user) {
            set({
              user: {
                ...user,
                shift: {
                  ...user.shift,
                  clockedIn: true,
                  clockInTime: new Date().toISOString(),
                },
              },
            });
            toast.success('Clocked in successfully');
          }
        } catch (error: any) {
          const message = error.response?.data?.message || 'Clock in failed';
          toast.error(message);
        }
      },

      clockOut: async () => {
        try {
          await authAPI.clockOut();
          const { user } = get();
          if (user) {
            set({
              user: {
                ...user,
                shift: {
                  ...user.shift,
                  clockedIn: false,
                  clockOutTime: new Date().toISOString(),
                },
              },
            });
            toast.success('Clocked out successfully');
          }
        } catch (error: any) {
          const message = error.response?.data?.message || 'Clock out failed';
          toast.error(message);
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await authAPI.me();
          set({
            user: response.data.user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);