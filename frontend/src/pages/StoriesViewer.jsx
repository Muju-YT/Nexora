import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Music, Send, Eye, ChevronDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { TEXT_STYLES, TEXT_SIZE_VALUES } from '../constants/storyConstants';

const STORY_DURATION = 6000; // ms

const StoriesViewer = () => {
  const navigate = useNavigate();
  const { storyId } = useParams();
  const { user } = useAuthStore();

  // Grouped active stories lists
  const [groupedUsers,   setGroupedUsers]   = useState([]);
  const [currentUserIdx,  setCurrentUserIdx]  = useState(0);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);

  const [loading,        setLoading]        = useState(true);
  const [progress,       setProgress]       = useState(0);
  const [paused,         setPaused]         = useState(false);
  const [hasLiked,       setHasLiked]       = useState(false);
  const [showHeart,      setShowHeart]      = useState(false);
  const [replyText,      setReplyText]      = useState('');
  const [showReplyBar,   setShowReplyBar]   = useState(false);
  const [replySent,      setReplySent]      = useState(false);

  // Viewers panel (only for own story)
  const [viewers,        setViewers]        = useState([]);
  const [viewersCount,   setViewersCount]   = useState(0);
  const [showViewers,    setShowViewers]    = useState(false);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const timerRef  = useRef(null);
  const startRef  = useRef(null);
  const elapsedRef = useRef(0);

  const getUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`;
  };

  const myUsername = user?.username || '';

  // Get active user and story objects
  const activeUser = groupedUsers[currentUserIdx] || null;
  const activeStory = activeUser?.stories?.[currentStoryIdx] || null;
  const isOwnStory = activeStory?.username === myUsername;

  /* ── Fetch all active stories & group them ─────────────────────────────────── */
  useEffect(() => {
    const fetchAllStories = async () => {
      try {
        setLoading(true);
        const res = await api.get('/stories/');
        const storiesList = Array.isArray(res.data) ? res.data : (res.data.results || []);

        // Group by username
        const usersMap = {};
        storiesList.forEach(s => {
          const uname = s.username;
          if (!usersMap[uname]) {
            usersMap[uname] = {
              username: uname,
              avatar: s.avatar,
              stories: []
            };
          }
          usersMap[uname].stories.push(s);
        });

        // Convert to array and sort each user's stories chronologically (oldest first)
        const usersArray = Object.values(usersMap).map(u => {
          u.stories.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          return u;
        });

        // Initialize user index and story index
        let initialUserIdx = 0;
        let initialStoryIdx = 0;

        if (storyId === 'me') {
          // Look for logged in user's stories
          const myIdx = usersArray.findIndex(u => u.username === myUsername);
          if (myIdx >= 0) {
            initialUserIdx = myIdx;
            initialStoryIdx = 0;
          } else {
            // Placeholder if user clicked "Your Story" but has no database stories
            usersArray.unshift({
              username: myUsername,
              avatar: user?.profile?.avatar,
              stories: [{
                id: 'me',
                username: myUsername,
                avatar: user?.profile?.avatar,
                media: user?.profile?.avatar,
                created_at: new Date().toISOString(),
                media_type: 'image',
                caption: 'No active stories yet',
                viewers: []
              }]
            });
            initialUserIdx = 0;
            initialStoryIdx = 0;
          }
        } else {
          // Specific story clicked. Find who owns it
          let found = false;
          for (let uIdx = 0; uIdx < usersArray.length; uIdx++) {
            const sIdx = usersArray[uIdx].stories.findIndex(s => String(s.id) === String(storyId));
            if (sIdx >= 0) {
              initialUserIdx = uIdx;
              // Find the first unviewed story index for this user
              const firstUnviewed = usersArray[uIdx].stories.findIndex(s => {
                if (s.id === 'me') return false;
                return !s.viewers?.some(v => v.username === myUsername);
              });
              initialStoryIdx = firstUnviewed >= 0 ? firstUnviewed : 0;
              found = true;
              break;
            }
          }
          if (!found && usersArray.length > 0) {
            initialUserIdx = 0;
            initialStoryIdx = 0;
          }
        }

        setGroupedUsers(usersArray);
        setCurrentUserIdx(initialUserIdx);
        setCurrentStoryIdx(initialStoryIdx);
      } catch (err) {
        console.error('Failed to load active stories list', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStories();
  }, [storyId, navigate, myUsername, user]);

  /* ── Handle relative navigation ───────────────────────────────────────────── */
  const handleNext = () => {
    if (groupedUsers.length === 0) return;
    const userStories = groupedUsers[currentUserIdx]?.stories || [];

    if (currentStoryIdx < userStories.length - 1) {
      // Next story of current user
      setCurrentStoryIdx(prev => prev + 1);
      setProgress(0);
      elapsedRef.current = 0;
      setHasLiked(false);
    } else {
      // Last story of current user -> next user
      if (currentUserIdx < groupedUsers.length - 1) {
        setCurrentUserIdx(prev => prev + 1);
        setCurrentStoryIdx(0);
        setProgress(0);
        elapsedRef.current = 0;
        setHasLiked(false);
      } else {
        // No more users -> back to home
        navigate('/');
      }
    }
  };

  const handlePrev = () => {
    if (groupedUsers.length === 0) return;

    if (currentStoryIdx > 0) {
      // Previous story of current user
      setCurrentStoryIdx(prev => prev - 1);
      setProgress(0);
      elapsedRef.current = 0;
      setHasLiked(false);
    } else {
      // First story of current user -> previous user's last story
      if (currentUserIdx > 0) {
        const prevUserIdx = currentUserIdx - 1;
        const prevUserStories = groupedUsers[prevUserIdx]?.stories || [];
        setCurrentUserIdx(prevUserIdx);
        setCurrentStoryIdx(prevUserStories.length - 1);
        setProgress(0);
        elapsedRef.current = 0;
        setHasLiked(false);
      } else {
        // First user, first story -> reset progress to 0
        setProgress(0);
        elapsedRef.current = 0;
      }
    }
  };

  // Ref handles to avoid closures holding stale index states in setInterval
  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  });

  /* ── Mark as viewed & update viewers count when story changes ────────────────── */
  useEffect(() => {
    if (!activeStory) return;

    // Reset liked state
    setHasLiked(false);

    // If it's another user's story, mark viewed
    if (activeStory.id !== 'me' && activeStory.username !== myUsername) {
      api.post(`/stories/${activeStory.id}/view/`).catch(() => {});
    }

    // Set viewers count
    if (activeStory.username === myUsername) {
      setViewersCount(activeStory.viewers_count || 0);
    }
  }, [currentUserIdx, currentStoryIdx, activeStory, myUsername]);

  /* ── Load viewers panel list (own story only) ─────────────────────────── */
  const loadViewers = async () => {
    if (!isOwnStory || !activeStory || activeStory.id === 'me') return;
    setLoadingViewers(true);
    try {
      const res = await api.get(`/stories/${activeStory.id}/viewers/`);
      setViewers(res.data.viewers || []);
      setViewersCount(res.data.count || 0);
    } catch (err) {
      console.error('Failed to load viewers list', err);
    } finally {
      setLoadingViewers(false);
    }
  };

  /* ── Progress timer loop ──────────────────────────────────────────────────── */
  const startTimer = () => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const total = elapsedRef.current + (Date.now() - startRef.current);
      const pct = Math.min(100, (total / STORY_DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        handleNextRef.current();
      }
    }, 30);
  };

  const pauseTimer = () => {
    clearInterval(timerRef.current);
    elapsedRef.current += Date.now() - startRef.current;
    setPaused(true);
  };

  const resumeTimer = () => {
    setPaused(false);
    startTimer();
  };

  useEffect(() => {
    if (loading || !activeStory) return;
    setProgress(0);
    elapsedRef.current = 0;
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [loading, currentUserIdx, currentStoryIdx]);

  /* ── Actions / Interaction ────────────────────────────────────────────── */
  const handleDoubleTap = async () => {
    if (!activeStory || activeStory.id === 'me' || isOwnStory) return;
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
    if (!hasLiked) {
      setHasLiked(true);
      try {
        await api.post(`/stories/${activeStory.id}/react/`, { reaction: '❤️' });
      } catch {}
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory || activeStory.id === 'me') return;
    const text = replyText.trim();
    setReplyText('');
    setShowReplyBar(false);
    resumeTimer();
    try {
      await api.post(`/stories/${activeStory.id}/reply/`, { text });
      setReplySent(true);
      setTimeout(() => setReplySent(false), 2500);
    } catch (err) {
      console.error('Failed to send story reply', err);
    }
  };

  const openReply = () => {
    pauseTimer();
    setShowReplyBar(true);
  };
  const closeReply = () => {
    setShowReplyBar(false);
    resumeTimer();
  };

  const handleOpenViewers = () => {
    setShowViewers(true);
    pauseTimer();
    loadViewers();
  };
  const handleCloseViewers = () => {
    setShowViewers(false);
    resumeTimer();
  };

  const handleDeleteStory = async () => {
    pauseTimer();
    if (!window.confirm("Are you sure you want to delete this story?")) {
      resumeTimer();
      return;
    }

    try {
      await api.delete(`/stories/${activeStory.id}/`);
      
      const activeUser = groupedUsers[currentUserIdx];
      const updatedStories = [...activeUser.stories];
      updatedStories.splice(currentStoryIdx, 1);

      if (updatedStories.length > 0) {
        // User still has other stories left
        const updatedUsers = groupedUsers.map((u, uIdx) => {
          if (uIdx === currentUserIdx) {
            return { ...u, stories: updatedStories };
          }
          return u;
        });
        setGroupedUsers(updatedUsers);
        
        // Adjust story index
        const nextStoryIdx = currentStoryIdx >= updatedStories.length ? updatedStories.length - 1 : currentStoryIdx;
        setCurrentStoryIdx(nextStoryIdx);
        setProgress(0);
        elapsedRef.current = 0;
      } else {
        // User has no stories left, remove user from list
        const updatedUsers = groupedUsers.filter((_, uIdx) => uIdx !== currentUserIdx);
        
        if (updatedUsers.length > 0) {
          setGroupedUsers(updatedUsers);
          const nextUserIdx = currentUserIdx >= updatedUsers.length ? updatedUsers.length - 1 : currentUserIdx;
          setCurrentUserIdx(nextUserIdx);
          setCurrentStoryIdx(0);
          setProgress(0);
          elapsedRef.current = 0;
        } else {
          // No active stories left in the feed
          navigate('/');
        }
      }
    } catch (err) {
      console.error("Failed to delete story", err);
      alert("Failed to delete story. Please try again.");
      resumeTimer();
    }
  };

  /* ── Render loading ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!activeStory) return null;

  const expiresAt     = activeStory.expires_at ? new Date(activeStory.expires_at) : new Date(Date.now() + 86400000);
  const hoursLeft     = Math.max(0, Math.round((expiresAt - Date.now()) / 3600000));
  const avatarUrl     = getUrl(activeStory.avatar);
  const mediaUrl      = getUrl(activeStory.media);
  const isVideo       = activeStory.media_type === 'video';
  const hasMusicBadge = activeStory.song_name;
  const hasText       = activeStory.text_overlay;

  const activeUserStories = activeUser?.stories || [];

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden forced-dark select-none">

      {/* ── Blurred viewport background duplication ── */}
      {mediaUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {isVideo
            ? <video key={`bg-video-${activeStory.id}`} src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover scale-110 blur-3xl opacity-35" />
            : <img key={`bg-img-${activeStory.id}`} src={mediaUrl} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-35" />
          }
        </div>
      )}

      {/* ── Desktop left/right chevrons outside the frame ── */}
      <button
        onClick={handlePrev}
        className="absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all cursor-pointer z-[99]"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all cursor-pointer z-[99]"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* ── Main Premium aspect-ratio Story Card ── */}
      <div
        className="relative w-full h-full md:h-[92vh] md:max-h-[860px] md:w-auto md:aspect-[9/16] bg-black md:rounded-2xl md:shadow-2xl md:border md:border-white/10 flex items-center justify-center overflow-hidden"
        onDoubleClick={handleDoubleTap}
        onMouseDown={() => { if (!showReplyBar && !showViewers) pauseTimer(); }}
        onMouseUp={() => { if (!showReplyBar && !showViewers) resumeTimer(); }}
        onTouchStart={() => { if (!showReplyBar && !showViewers) pauseTimer(); }}
        onTouchEnd={() => { if (!showReplyBar && !showViewers) resumeTimer(); }}
      >
        {/* Underlay blurred background image duplicate inside card */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none md:rounded-2xl">
          {isVideo ? (
            <video key={`card-bg-video-${activeStory.id}`} src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover scale-110 blur-xl opacity-40" />
          ) : (
            <img key={`card-bg-img-${activeStory.id}`} src={mediaUrl} alt="" className="w-full h-full object-cover scale-110 blur-xl opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75 pointer-events-none" />
        </div>

        {/* Foreground containment media player */}
        {isVideo ? (
          <video key={`card-fg-video-${activeStory.id}`} src={mediaUrl} autoPlay loop playsInline
            className="w-full h-full relative z-10 md:rounded-2xl"
            style={{
              objectFit: activeStory.media_fit || 'contain',
              transform: `translate(${activeStory.media_x || 0}%, ${activeStory.media_y || 0}%) scale(${activeStory.media_scale || 1})`,
              transition: 'transform 0.3s ease-out',
            }}
          />
        ) : (
          <img key={`card-fg-img-${activeStory.id}`} src={mediaUrl} alt="Story Content"
            className="w-full h-full relative z-10 md:rounded-2xl"
            style={{
              objectFit: activeStory.media_fit || 'contain',
              transform: `translate(${activeStory.media_x || 0}%, ${activeStory.media_y || 0}%) scale(${activeStory.media_scale || 1})`,
              transition: 'transform 0.3s ease-out',
            }}
          />
        )}

        {/* ── Multi Segment Progress Bars at the top ── */}
        <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex gap-1 px-1">
          {activeUserStories.map((s, idx) => (
            <div key={idx} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: idx < currentStoryIdx ? '100%' : idx === currentStoryIdx ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Top Bar: User details + close button ── */}
        <div className="absolute top-7 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/70" />
              : <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] flex items-center justify-center text-sm font-black text-white">
                  {activeStory.username?.[0]?.toUpperCase()}
                </div>
            }
            <div>
              <p className="text-white text-[13px] font-bold leading-tight drop-shadow">{activeStory.username}</p>
              {activeStory.id !== 'me' && !isOwnStory && (
                <p className="text-white/60 text-[10px] leading-tight drop-shadow">{hoursLeft}h remaining</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            {isOwnStory && activeStory.id !== 'me' && (
              <button
                onClick={handleDeleteStory}
                className="p-1.5 rounded-full bg-red-600/35 hover:bg-red-600/50 text-red-500 hover:text-white transition-colors cursor-pointer"
                title="Delete Story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => navigate('/')} className="p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors cursor-pointer">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* ── Left / Right Tap zones (Mobile fallback navigation) ── */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-[15] cursor-pointer" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-[15] cursor-pointer" onClick={handleNext} />

        {/* ── Double-tap Heart Overlay ── */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.4, opacity: 0 }} transition={{ duration: 0.5 }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Text Overlay Sticker ── */}
        {hasText && (() => {
          const styleObj = TEXT_STYLES.find(s => s.id === activeStory.text_style_id) ?? TEXT_STYLES[0];
          const fontSize = TEXT_SIZE_VALUES[activeStory.text_size_idx ?? 2] ?? 28;
          const x = activeStory.text_x ?? 50;
          const y = activeStory.text_y ?? 45;
          const rot = activeStory.text_rotation ?? 0;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              className={`absolute z-20 pointer-events-none ${styleObj.className}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                fontSize,
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxWidth: '75%',
                lineHeight: 1.25,
                ...styleObj.style
              }}
            >
              {activeStory.text_overlay}
            </motion.div>
          );
        })()}

        {/* ── Music Badge Overlay ── */}
        {hasMusicBadge && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${activeStory.music_x ?? 50}%`,
              top: `${activeStory.music_y ?? 75}%`,
              transform: `translate(-50%, -50%) rotate(${activeStory.music_rotation ?? 0}deg)`,
            }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2.5 bg-black/55 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2.5 max-w-[220px]"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#833ab4] to-[#fcb045] flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-[11px] font-bold truncate leading-tight">{activeStory.song_name}</span>
                <span className="text-white/60 text-[10px] truncate leading-tight">{activeStory.song_artist}</span>
              </div>
              <div className="flex gap-[3px] items-end h-4 flex-shrink-0">
                {[3,5,4,6,3].map((h, i) => (
                  <motion.div key={i}
                    animate={{ height: [`${h*2}px`, `${(h+3)*2}px`, `${h*2}px`] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1, ease: 'easeInOut' }}
                    className="w-[3px] bg-[#fcb045] rounded-full" style={{ height: `${h*2}px` }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Own Story Viewers bar ── */}
        {isOwnStory && activeStory.id !== 'me' && !showReplyBar && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-4 left-3 right-3 z-20"
          >
            <button
              onClick={handleOpenViewers}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 hover:bg-black/65 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-bold">
                  {viewersCount} {viewersCount === 1 ? 'viewer' : 'viewers'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>
          </motion.div>
        )}

        {/* ── Others' Story Like & Reply controls ── */}
        {!isOwnStory && activeStory.id !== 'me' && !showReplyBar && (
          <div className="absolute bottom-4 left-3 right-3 z-20 flex items-center gap-3">
            <button onClick={openReply}
              className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/30 bg-black/35 text-white/60 hover:border-white/50 transition-colors"
            >
              <span className="text-white/50 text-sm text-left truncate">Reply to {activeStory.username}…</span>
            </button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={handleDoubleTap}
              className="w-10 h-10 rounded-full flex items-center justify-center"
            >
              <Heart className={`w-6 h-6 transition-all ${hasLiked ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-white'}`} />
            </motion.button>
          </div>
        )}

        {/* ── Reply sent Toast ── */}
        <AnimatePresence>
          {replySent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 left-0 right-0 z-30 flex justify-center pointer-events-none"
            >
              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 text-white text-sm font-semibold">
                ✓ Reply sent — check your messages
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reply input form overlay ── */}
        <AnimatePresence>
          {showReplyBar && (
            <motion.form
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              onSubmit={handleReply}
              className="absolute bottom-0 left-0 right-0 z-30 flex items-center gap-2 px-3 py-3 bg-black/75 backdrop-blur-xl border-t border-white/10"
            >
              <button type="button" onClick={closeReply} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
              <input
                autoFocus
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Reply to ${activeStory.username}…`}
                className="flex-1 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-sm text-white placeholder-white/40 outline-none"
              />
              <button type="submit" disabled={!replyText.trim()}
                className="p-2 text-white disabled:opacity-40 transition-opacity"
              >
                <Send className="w-4 h-4 rotate-45" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Viewers Drawer Panel ── */}
        <AnimatePresence>
          {showViewers && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={handleCloseViewers}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                className="absolute bottom-0 left-0 right-0 z-50 bg-[#111] rounded-t-3xl max-h-[60%] flex flex-col overflow-hidden border-t border-white/10"
              >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-white" />
                    <span className="text-white font-bold text-sm">
                      {viewersCount} {viewersCount === 1 ? 'View' : 'Views'}
                    </span>
                  </div>
                  <button onClick={handleCloseViewers} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Viewer list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                  {loadingViewers ? (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : viewers.length === 0 ? (
                    <div className="text-center py-10">
                      <Eye className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-xs font-semibold">No views yet</p>
                    </div>
                  ) : (
                    viewers.map((v, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center gap-3"
                      >
                        {v.avatar
                          ? <img src={getUrl(v.avatar)} alt={v.username} className="w-9 h-9 rounded-full object-cover border border-white/15" />
                          : <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] flex items-center justify-center text-sm font-black text-white">
                              {v.username?.[0]?.toUpperCase()}
                            </div>
                        }
                        <div className="flex-1">
                          <p className="text-white text-xs font-bold">{v.username}</p>
                          <p className="text-slate-500 text-[10px]">
                            {v.viewed_at ? new Date(v.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default StoriesViewer;
