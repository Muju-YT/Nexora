import { create } from 'zustand';
import api from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/notifications/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const unreadCount = data.filter(n => !n.is_read).length;
      set({ notifications: data, unreadCount, loading: false });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      set({ loading: false });
    }
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch {}
  },

  markRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`);
      set(state => {
        const notifications = state.notifications.map(n =>
          n.id === id ? { ...n, is_read: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.is_read).length
        };
      });
    } catch {}
  },

  // Call when user visits /notifications page — clears the badge silently
  clearBadge: () => set({ unreadCount: 0 }),
}));

export default useNotificationStore;
