import React, { useState, useEffect } from 'react';
import {
  Heart, MessageCircle, UserPlus, Bell, Check,
  Trash2, ArrowLeft, Sparkles, Eye, Music2, Film, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlowCard from '../components/GlowCard';
import api from '../services/api';
import { getAvatarUrl } from '../utils/url';
import useAuthStore from '../store/authStore';

/* ─── icon + colour per notification type ──────────────────────────────── */
const TYPE_CONFIG = {
  like:           { icon: Heart,         color: 'text-red-500',        fill: 'fill-red-500/20',     label: 'Liked your post' },
  comment:        { icon: MessageCircle, color: 'text-[#0095F6]',      fill: '',                    label: 'Commented on your post' },
  follow:         { icon: UserPlus,      color: 'text-[#E1306C]',      fill: '',                    label: 'Started following you' },
  mention:        { icon: Sparkles,      color: 'text-amber-400',      fill: '',                    label: 'Mentioned you' },
  message:        { icon: MessageCircle, color: 'text-[#0095F6]',      fill: '',                    label: 'Sent you a message' },
  story_reaction: { icon: Heart,         color: 'text-[#E1306C]',      fill: 'fill-[#E1306C]/20',   label: 'Reacted to your story' },
  story_reply:    { icon: MessageCircle, color: 'text-purple-400',     fill: '',                    label: 'Replied to your story' },
  reel_like:      { icon: Film,          color: 'text-red-500',        fill: 'fill-red-500/20',     label: 'Liked your reel' },
  reel_comment:   { icon: Video,         color: 'text-[#0095F6]',      fill: '',                    label: 'Commented on your reel' },
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)      return `${diff}s ago`;
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* Detect whether a media URL is a video file */
const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.split('?')[0].toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.mkv');
};

const Notifications = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('all'); // all | unread | story

  /* ── Fetch from API ──────────────────────────────────────────────────── */
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setNotifications(data);
      
      // Auto mark notifications as read if any are unread
      if (data.some(n => !n.is_read)) {
        await api.post('/notifications/mark_all_read/');
        useAuthStore.getState().setUnreadNotificationsCount(0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleDelete = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await api.delete(`/notifications/${id}/`); } catch {}
  };

  const handleClearAll = async () => {
    const ids = notifications.map(n => n.id);
    setNotifications([]);
    for (const id of ids) {
      try { await api.delete(`/notifications/${id}/`); } catch {}
    }
  };

  const handleNotifClick = (n) => {
    handleMarkRead(n.id);
    if ((n.notification_type === 'story_reaction' || n.notification_type === 'story_reply') && n.target_id) {
      navigate(`/story/${n.target_id}`);
    } else if (n.notification_type === 'message' && n.target_id) {
      navigate(`/chat/${n.target_id}`);
    } else if ((n.notification_type === 'like' || n.notification_type === 'comment') && n.target_id) {
      navigate(`/?post=${n.target_id}`);
    } else if ((n.notification_type === 'reel_like' || n.notification_type === 'reel_comment') && n.target_id) {
      navigate(`/reels?reel=${n.target_id}`);
    } else if (n.notification_type === 'follow') {
      navigate(`/profile/${n.sender_username || n.sender}`);
    } else {
      navigate(`/profile/${n.sender_username || n.sender}`);
    }
  };

  /* ── Filtering ───────────────────────────────────────────────────────── */
  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'story')  return n.notification_type === 'story_reaction' || n.notification_type === 'story_reply';
    if (filter === 'reels')  return n.notification_type === 'reel_like' || n.notification_type === 'reel_comment';
    if (filter === 'follow') return n.notification_type === 'follow';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;



  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5 select-none">

      {/* ── Header ── */}
      <div className="flex justify-between items-center bg-obsidian-card p-4 rounded-2xl border border-obsidian-border shadow-glass">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-obsidian-light text-slate-400 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E1306C] text-white text-[10px] font-black">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
              Activity on your posts, reels &amp; stories
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleMarkAllRead}
            className="p-2.5 rounded-xl border border-obsidian-border bg-obsidian-light hover:bg-obsidian-hover text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Mark all as read"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearAll}
            className="p-2.5 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',    label: 'All' },
          { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          { key: 'follow', label: '👥 Following' },
          { key: 'reels',  label: '🎬 Reels' },
          { key: 'story',  label: '📖 Stories' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
              filter === f.key
                ? 'bg-[#E1306C] border-[#E1306C] text-white'
                : 'border-obsidian-border text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Notification list ── */}
      <div className="flex flex-col gap-3">
        {loading ? (
          /* Skeletons */
          [1, 2, 3].map(i => (
            <div key={i} className="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-obsidian-light flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-48 h-3 rounded bg-obsidian-light" />
                <div className="w-24 h-2 rounded bg-obsidian-light" />
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence>
            {filtered.length > 0 ? filtered.map((n) => {
              const cfg = TYPE_CONFIG[n.notification_type] || {
                icon: Bell, color: 'text-slate-400', fill: '', label: 'Notification'
              };
              const Icon = cfg.icon;
              const avatarUrl = getAvatarUrl(n.sender_avatar);
              const senderUsername = n.sender_username || n.sender || 'Someone';

              return (
                <motion.div
                  key={n.id}
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 12, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <GlowCard
                    hoverable={false}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${!n.is_read ? 'border-[#E1306C]/25 bg-[#E1306C]/[0.03]' : ''}`}
                    onClick={() => handleNotifClick(n)}
                  >
                    {/* Unread dot */}
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#E1306C] flex-shrink-0 animate-pulse" />
                    )}

                    {/* Avatar */}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={senderUsername}
                        className="w-10 h-10 rounded-full object-cover border border-obsidian-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                        {senderUsername[0]?.toUpperCase()}
                      </div>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-normal">
                        <span
                          className="font-black text-white hover:underline mr-1"
                          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${senderUsername}`); }}
                        >
                          {senderUsername}
                        </span>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {timeAgo(n.created_at)}
                        {n.notification_type === 'message' && n.target_id && (
                          <span
                            className="ml-2 text-[#0095F6] font-bold cursor-pointer hover:underline"
                            onClick={(e) => { e.stopPropagation(); navigate(`/chat/${n.target_id}`); }}
                          >
                            View message →
                          </span>
                        )}
                        {(n.notification_type === 'story_reaction' || n.notification_type === 'story_reply') && n.target_id && (
                          <span
                            className="ml-2 text-[#E1306C] font-bold cursor-pointer hover:underline"
                            onClick={(e) => { e.stopPropagation(); navigate(`/story/${n.target_id}`); }}
                          >
                            View story →
                          </span>
                        )}
                        {(n.notification_type === 'reel_like' || n.notification_type === 'reel_comment') && n.target_id && (
                          <span
                            className="ml-2 text-[#E1306C] font-bold cursor-pointer hover:underline"
                            onClick={(e) => { e.stopPropagation(); navigate(`/reels?reel=${n.target_id}`); }}
                          >
                            View reel →
                          </span>
                        )}
                        {n.notification_type === 'follow' && (
                          <span
                            className="ml-2 text-[#E1306C] font-bold cursor-pointer hover:underline"
                            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${n.sender_username || n.sender}`); }}
                          >
                            View profile →
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Right-side preview thumbnail with overlapping action icon badge */}
                    <div className="relative flex-shrink-0 ml-1">
                      {n.target_media ? (
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-obsidian-border bg-obsidian-light/30 shadow-glass">
                          {isVideoUrl(n.target_media) ? (
                            /* Video reel thumbnail — seek to first frame */
                            <>
                              <video
                                src={`${n.target_media}#t=0.5`}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              {/* Dark overlay + play hint */}
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                <Film className="w-3.5 h-3.5 text-white opacity-80" />
                              </div>
                            </>
                          ) : (
                            <img
                              src={n.target_media}
                              alt="Target media"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute -bottom-1 -right-1 p-1 bg-obsidian-card rounded-full border border-obsidian-border flex items-center justify-center scale-75 shadow-glass">
                            <Icon className={`w-3 h-3 ${cfg.color} ${cfg.fill}`} />
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-full border border-obsidian-border bg-obsidian-light/40 shadow-glass">
                          <Icon className={`w-4 h-4 ${cfg.color} ${cfg.fill}`} />
                        </div>
                      )}
                    </div>
                  </GlowCard>
                </motion.div>
              );
            }) : (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 border border-dashed border-obsidian-border rounded-2xl bg-obsidian-card/40 flex flex-col items-center gap-3"
              >
                <Bell className="w-7 h-7 text-slate-600 animate-bounce" />
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  {filter === 'unread' ? 'All caught up! No unread notifications.' : 'No notifications yet.'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Notifications;
