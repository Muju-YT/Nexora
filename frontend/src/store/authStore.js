import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
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
      set({ error: 'Invalid credentials or login failed.', loading: false });
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
    if (!token) return;
    set({ loading: true });
    try {
      const res = await api.get('/auth/me/');
      // Add a premium 3.5s delay so the user sees the login page first before smooth navigation
      await new Promise(resolve => setTimeout(resolve, 3500));
      set({ user: res.data, isAuthenticated: true, loading: false });
      get().fetchUnreadCounts();
    } catch (err) {
      // Token invalid or expired — clear and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, loading: false });
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
