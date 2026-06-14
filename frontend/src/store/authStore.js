import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: !!localStorage.getItem('access_token'),
  error: null,
  otpPending: false,
  otpPreview: null,
  theme: localStorage.getItem('theme') || 'dark',
  unreadNotificationsCount: 0,
  unreadMessagesCount: 0,

  setUser: (user) => set({ user }),
  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: count }),
  setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),

  fetchUnreadCounts: async () => {
    if (!get().isAuthenticated) return;
    try {
      const [notifRes, chatRes] = await Promise.all([
        api.get('/notifications/unread_count/'),
        api.get('/chats/rooms/unread_count/')
      ]);
      set({
        unreadNotificationsCount: notifRes.data.unread_count || 0,
        unreadMessagesCount: chatRes.data.unread_count || 0
      });
    } catch (err) {
      console.error("Failed to fetch unread counts", err);
    }
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    set({ theme });
  },

  register: async (username, email, password, firstName = '', lastName = '') => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register/', {
        username, email, password, first_name: firstName, last_name: lastName
      });

      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);

      set({
        user: res.data.user,
        isAuthenticated: true,
        otpPending: true,
        otpPreview: res.data.otp_preview,
        loading: false
      });
      return { success: true, otp: res.data.otp_preview };
    } catch (err) {
      const errData = err.response?.data;
      let errorMsg = 'Registration failed.';
      if (errData && typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        if (firstKey) {
          const val = errData[firstKey];
          errorMsg = `${firstKey}: ${Array.isArray(val) ? val[0] : val}`;
        }
      }
      set({ error: errorMsg, loading: false });
      return { success: false };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Step 1: Get JWT tokens
      const res = await api.post('/auth/login/', { email, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      // Step 2: Fetch the real authenticated user profile
      const meRes = await api.get('/auth/me/');

      set({
        user: meRes.data,
        isAuthenticated: true,
        loading: false
      });
      get().fetchUnreadCounts();
      return { success: true };
    } catch (err) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      let errorMessage = 'Invalid credentials or login failed.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Server is starting up (cold start). This may take up to a minute on first load. Please wait and try again.';
      } else if (!err.response) {
        errorMessage = 'Network error: Cannot reach the server. Please check your connection or try again later.';
      } else if (err.response.status === 401 || err.response.status === 400) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.response.status >= 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }
      set({ error: errorMessage, loading: false });
      return { success: false };
    }
  },

  verifyOtp: async (otp) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/verify-otp/', { otp });
      // After verification, re-fetch the user so is_email_verified shows true
      const meRes = await api.get('/auth/me/');
      set({ user: meRes.data, otpPending: false, otpPreview: null, loading: false });
      get().fetchUnreadCounts();
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Verification failed.', loading: false });
      return { success: false };
    }
  },

  resendOtp: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/resend-otp/');
      set({ otpPreview: res.data.otp_preview, loading: false });
      return { success: true, otp: res.data.otp_preview };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Could not resend OTP.', loading: false });
      return { success: false };
    }
  },

  // Load the real session from the backend on every app mount
  loadSession: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, loading: false });
      return;
    }
    set({ loading: true });
    try {
      const res = await api.get('/auth/me/');
      set({ user: res.data, isAuthenticated: true, loading: false });
      get().fetchUnreadCounts();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false, loading: false });
      } else {
        // Keep tokens for retry if it was a network timeout or temporary server issue
        set({ isAuthenticated: false, loading: false });
      }
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, otpPending: false, otpPreview: null });
    window.location.href = '/login';
  },
}));

export default useAuthStore;
