import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ArrowLeft, 
  Play, 
  Volume2, 
  Music, 
  CheckCircle2, 
  Loader2, 
  Send, 
  X, 
  Trash2, 
  Smile,
  Bookmark,
  Search
} from 'lucide-react';
import GlowCard from '../components/GlowCard';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const ALL_EMOJIS = [
  '❤️', '🙌', '🔥', '👏', '😂', '😍', '😢', '😮',
  '👍', '🎉', '✨', '💖', '😎', '🤔', '💯', '🙏',
  '🌟', '🚀', '👀', '🤣', '🤩', '🥰', '💔', '😭'
];

const ReelCard = ({ 
  reel, 
  isActive, 
  isMuted, 
  isLiked, 
  likedCount, 
  isSaved,
  isFollowing, 
  onLike, 
  onDoubleTap, 
  onOpenComments, 
  onOpenShare, 
  onSave,
  onFollow, 
  navigate 
}) => {
  const videoRef = useRef(null);
  const [heartOverlay, setHeartOverlay] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        videoRef.current.play()
          .then(() => setIsPaused(false))
          .catch(err => {
            console.log("Autoplay blocked:", err);
            setIsPaused(true);
          });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPaused(false);
      }
    }
  }, [isActive]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => setIsPaused(false))
          .catch(err => console.log(err));
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleDoubleTapAction = () => {
    onDoubleTap(reel);
    setHeartOverlay(true);
    setTimeout(() => {
      setHeartOverlay(false);
    }, 850);
  };

  return (
    <div 
      className="w-full h-full snap-start snap-always relative shrink-0 overflow-hidden flex flex-col justify-end bg-black"
      onDoubleClick={handleDoubleTapAction}
    >
      {/* Reel video/image container */}
      <div 
        onClick={handlePlayPause}
        className="absolute inset-0 z-0 bg-black flex items-center justify-center cursor-pointer"
      >
        {reel.isVideo ? (
          <video 
            ref={videoRef}
            src={reel.media} 
            loop 
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={reel.media} 
            alt="Reel Content" 
            className="w-full h-full object-cover" 
          />
        )}
        
        {/* Soft elegant gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent z-10" />

        {/* Centered Play Indicator Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.85 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-always-white z-20 pointer-events-none border border-white/10"
            >
              <Play className="w-8 h-8 fill-white ml-1 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double Tap Heart Overlay */}
        <AnimatePresence>
          {heartOverlay && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute z-30"
            >
              <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info & Actions Layer */}
      <div className="relative z-20 w-full flex items-end justify-between px-4 reels-overlay-padding md:pb-6 select-none pointer-events-none">
        
        {/* Bottom Details Metadata */}
        <div className="flex flex-col gap-2 max-w-[76%] pointer-events-auto">
          {/* Identity & Follow Row */}
          <div className="flex items-center gap-2">
            {reel.avatar ? (
              <img 
                src={reel.avatar} 
                alt="Avatar" 
                className="w-7 h-7 rounded-full border border-white/20 object-cover cursor-pointer hover:scale-105 transition-transform" 
                onClick={() => navigate(`/profile/${reel.username}`)}
              />
            ) : (
              <div 
                className="w-7 h-7 rounded-full border border-white/20 bg-slate-700 flex items-center justify-center text-[10px] font-black text-always-white uppercase cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/profile/${reel.username}`)}
              >
                {reel.username?.[0] || '?'}
              </div>
            )}
            <div className="flex items-center gap-0.5 min-w-0">
              <span 
                className="text-xs font-bold text-always-white cursor-pointer hover:underline truncate max-w-[90px]"
                onClick={() => navigate(`/profile/${reel.username}`)}
              >
                {reel.username}
              </span>
              <CheckCircle2 className="w-3 h-3 text-[#0095F6] fill-white flex-shrink-0" />
            </div>
            <button 
              onClick={onFollow}
              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border transition-all cursor-pointer flex-shrink-0 ${
                isFollowing
                  ? "bg-transparent border-white/20 text-always-slate-400"
                  : "bg-white border-transparent text-black hover:bg-slate-200"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          {/* Reel Caption */}
          <p className="text-always-slate-100 text-[11px] leading-relaxed break-words font-medium line-clamp-3 drop-shadow">
            {reel.caption}
          </p>

          {/* Music track ticker */}
          <div className="flex items-center gap-1.5 text-always-slate-300">
            <Music className="w-3 h-3 animate-spin flex-shrink-0" style={{ animationDuration: '6s' }} />
            <div className="overflow-hidden max-w-[150px]">
              <span className="text-[9px] font-semibold tracking-wide truncate block">
                {reel.audio}
              </span>
            </div>
          </div>
        </div>

        {/* Floating action buttons column */}
        <div className="flex flex-col gap-3.5 items-center mb-1 pointer-events-auto">
          {/* Like Button */}
          <button 
            onClick={onLike}
            className="flex flex-col items-center gap-0.5 cursor-pointer group"
          >
            <div className={`p-2 rounded-full border transition-all duration-200 ${
              isLiked 
                ? 'bg-red-500 border-transparent text-always-white scale-110 shadow-[0_0_12px_rgba(239,68,68,0.5)]' 
                : 'bg-black/45 border-white/10 text-always-white hover:bg-black/60 hover:scale-105'
            }`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[8px] font-black text-always-slate-200 drop-shadow">
              {new Intl.NumberFormat().format(likedCount)}
            </span>
          </button>

          {/* Comment Button */}
          <button 
            onClick={() => onOpenComments(reel)}
            className="flex flex-col items-center gap-0.5 cursor-pointer group"
          >
            <div className="p-2 rounded-full border bg-black/45 border-white/10 text-always-white hover:bg-black/60 hover:scale-105 transition-all">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[8px] font-black text-always-slate-200 drop-shadow">
              {reel.comments}
            </span>
          </button>

          {/* Send/Share Button */}
          <button 
            onClick={() => onOpenShare(reel)}
            className="flex flex-col items-center gap-0.5 cursor-pointer group"
          >
            <div className="p-2 rounded-full border bg-black/45 border-white/10 text-always-white hover:bg-black/60 hover:scale-105 transition-all">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-[8px] font-black text-always-slate-200 drop-shadow">Send</span>
          </button>

          {/* Save/Bookmark Button */}
          <button 
            onClick={onSave}
            className="flex flex-col items-center gap-0.5 cursor-pointer group"
          >
            <div className={`p-2 rounded-full border transition-all duration-200 ${
              isSaved 
                ? 'bg-amber-500 border-transparent text-always-white scale-110 shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
                : 'bg-black/45 border-white/10 text-always-white hover:bg-black/60 hover:scale-105'
            }`}>
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[8px] font-black text-always-slate-200 drop-shadow">Save</span>
          </button>

          {/* Music disk spinning disc indicator */}
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-white/20 p-0.5 mt-1 animate-spin" style={{ animationDuration: '8s' }}>
            {reel.avatar ? (
              <img src={reel.avatar} alt="disk" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-cyber-pink flex items-center justify-center text-[8px] font-bold text-always-white">
                {reel.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const ReelsFeed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuthStore();
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [likedStatus, setLikedStatus] = useState({});
  const [savedStatus, setSavedStatus] = useState({});
  const [followStatus, setFollowStatus] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef(null);

  // Dynamic reels states
  const [reelsList, setReelsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Comments drawer states
  const [activeCommentReel, setActiveCommentReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Share / Send to DM states
  const [shareReel, setShareReel] = useState(null);
  const [shareRooms, setShareRooms] = useState([]);
  const [loadingShareRooms, setLoadingShareRooms] = useState(false);
  const [searchShareQuery, setSearchShareQuery] = useState('');
  const [sendingStatus, setSendingStatus] = useState({});

  useEffect(() => {
    const fetchReels = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reels/');
        const dbReels = Array.isArray(res.data) ? res.data : (res.data.results || []);
        
        // Map dbReels to match Reels feed format
        const mappedDbReels = dbReels.map(r => ({
          id: r.id,
          username: r.username,
          avatar: r.avatar ? (r.avatar.startsWith('http') ? r.avatar : `http://127.0.0.1:8000${r.avatar}`) : null,
          caption: r.caption,
          media: r.video ? (r.video.startsWith('http') ? r.video : `http://127.0.0.1:8000${r.video}`) : '',
          audio: `${r.username} · Original Audio`,
          likes: r.likes_count || 0,
          comments: r.comments_count || 0,
          has_liked: r.has_liked || false,
          has_saved: r.has_saved || false,
          is_following: r.is_following || false,
          views: r.views_count || 0,
          isVideo: true,
          db_reel: true
        }));

        const initialFollowStatus = {};
        dbReels.forEach(r => {
          initialFollowStatus[r.username] = r.is_following || false;
        });
        setFollowStatus(initialFollowStatus);

        // Merging db reels with premium mock fallback loops
        const defaultMocks = [
          {
            id: 'mock-1',
            username: "alexa_travels",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
            caption: "✨ Chasing sunrises in Greece! Still can't believe this view is real. Tag someone you want to travel here with! 🇬🇷 #travel #greece #summer #wanderlust",
            media: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-futuristic-city-38999-large.mp4",
            audio: "Alexa Travels · Original Audio",
            likes: 12400,
            comments: 182,
            has_liked: false,
            isVideo: true,
            db_reel: false
          },
          {
            id: 'mock-2',
            username: "designer_marcus",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
            caption: "🪐 Crafting the new Nexora mobile interface. Out with the neon cyberpunk and in with clean, high-contrast iOS glass. Thoughts? 👇 #uiux #designer #threads",
            media: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-in-a-futuristic-city-31908-large.mp4",
            audio: "Marcus Designer • Original Audio",
            likes: 8590,
            comments: 94,
            has_liked: false,
            isVideo: true,
            db_reel: false
          },
          {
            id: 'mock-3',
            username: "fit_lifestyle",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            caption: "⚡ Consistency is key! 5 AM workout done. Stop making excuses and start building habits today. Let's get it! 💪 #fitness #motivation #grind #workout",
            media: "https://assets.mixkit.co/videos/preview/mixkit-woman-exercising-in-a-gym-with-neon-lights-39871-large.mp4",
            audio: "Workout Beats Vol. 4",
            likes: 19800,
            comments: 310,
            has_liked: false,
            isVideo: true,
            db_reel: false
          }
        ];

        if (mappedDbReels.length > 0) {
          // If the user has uploaded reels, ONLY show these uploaded reels.
          // To create a continuous loop, repeat the uploaded reels list 50 times.
          const repeatedReels = [];
          for (let i = 0; i < 50; i++) {
            repeatedReels.push(...mappedDbReels.map((r, index) => ({
              ...r,
              id: `${r.id}-loop-${i}-${index}`
            })));
          }
          setReelsList(repeatedReels);
        } else {
          setReelsList(defaultMocks);
        }
      } catch (err) {
        console.error("Failed to load dynamic reels", err);
        // Fallback strictly to mock reels on error
        setReelsList([
          {
            id: 'mock-1',
            username: "alexa_travels",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
            caption: "✨ Chasing sunrises in Greece! Still can't believe this view is real. Tag someone you want to travel here with! 🇬🇷 #travel #greece #summer #wanderlust",
            media: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-futuristic-city-38999-large.mp4",
            audio: "Alexa Travels · Original Audio",
            likes: 12400,
            comments: 182,
            has_liked: false,
            isVideo: true,
            db_reel: false
          },
          {
            id: 'mock-2',
            username: "designer_marcus",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
            caption: "🪐 Crafting the new Nexora mobile interface. Out with the neon cyberpunk and in with clean, high-contrast iOS glass. Thoughts? 👇 #uiux #designer #threads",
            media: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-in-a-futuristic-city-31908-large.mp4",
            audio: "Marcus Designer • Original Audio",
            likes: 8590,
            comments: 94,
            has_liked: false,
            isVideo: true,
            db_reel: false
          },
          {
            id: 'mock-3',
            username: "fit_lifestyle",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            caption: "⚡ Consistency is key! 5 AM workout done. Stop making excuses and start building habits today. Let's get it! 💪 #fitness #motivation #grind #workout",
            media: "https://assets.mixkit.co/videos/preview/mixkit-woman-exercising-in-a-gym-with-neon-lights-39871-large.mp4",
            audio: "Workout Beats Vol. 4",
            likes: 19800,
            comments: 310,
            has_liked: false,
            isVideo: true,
            db_reel: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  // Track dynamic views on active reel change
  useEffect(() => {
    if (reelsList.length === 0) return;
    const activeReel = reelsList[activeReelIndex];
    if (activeReel && activeReel.db_reel) {
      const originalId = String(activeReel.id).split('-loop-')[0];
      api.post(`/reels/${originalId}/view/`).catch(err => {
        console.error("Failed to increment reel view count", err);
      });
    }
  }, [activeReelIndex, reelsList]);

  // Deep-link from notification: auto-scroll to ?reel=ID
  useEffect(() => {
    if (reelsList.length === 0 || !containerRef.current) return;
    const params = new URLSearchParams(location.search);
    const targetReelId = params.get('reel');
    if (!targetReelId) return;
    const idx = reelsList.findIndex(r => String(r.id).split('-loop-')[0] === String(targetReelId));
    if (idx < 0) return;
    // Scroll the snap container to that reel card
    const cardHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({ top: idx * cardHeight, behavior: 'smooth' });
    setActiveReelIndex(idx);
  }, [reelsList, location.search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyber-pink animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading reels grid...</span>
        </div>
      </div>
    );
  }

  const handleLike = async (reel) => {
    const originalId = String(reel.id).split('-loop-')[0];
    if (!reel.db_reel) {
      // Mock reel
      setLikedStatus(prev => ({
        ...prev,
        [reel.id]: !prev[reel.id]
      }));
      return;
    }
    try {
      const res = await api.post(`/reels/${originalId}/like/`);
      setReelsList(prev => prev.map(r => {
        const rOrigId = String(r.id).split('-loop-')[0];
        return rOrigId === originalId ? {
          ...r,
          has_liked: res.data.status === 'liked',
          likes: res.data.status === 'liked' ? r.likes + 1 : r.likes - 1
        } : r;
      }));
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  const handleSaveReel = async (reel) => {
    const originalId = String(reel.id).split('-loop-')[0];
    if (!reel.db_reel) {
      // Mock reel
      setSavedStatus(prev => ({
        ...prev,
        [reel.id]: !prev[reel.id]
      }));
      return;
    }
    try {
      const res = await api.post(`/reels/${originalId}/save_reel/`);
      setReelsList(prev => prev.map(r => {
        const rOrigId = String(r.id).split('-loop-')[0];
        return rOrigId === originalId ? {
          ...r,
          has_saved: res.data.status === 'saved'
        } : r;
      }));
    } catch (err) {
      console.error("Failed to toggle save on reel", err);
    }
  };

  const handleDoubleTap = (reel) => {
    const isAlreadyLiked = reel.db_reel ? reel.has_liked : likedStatus[reel.id];
    if (!isAlreadyLiked) {
      handleLike(reel);
    }
  };

  const toggleFollow = async (username) => {
    // Optimistic UI update
    setFollowStatus(prev => ({
      ...prev,
      [username]: !prev[username]
    }));

    try {
      const res = await api.post(`/users/profiles/${username}/follow/`);
      setFollowStatus(prev => ({
        ...prev,
        [username]: res.data.status === 'followed'
      }));
    } catch (err) {
      console.error("Failed to toggle follow status on creator", err);
      // Revert optimistic change on network error
      setFollowStatus(prev => ({
        ...prev,
        [username]: !prev[username]
      }));
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight <= 0) return;
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== activeReelIndex && newIndex >= 0 && newIndex < reelsList.length) {
      setActiveReelIndex(newIndex);
    }
  };

  const handleOpenComments = async (reel) => {
    setActiveCommentReel(reel);
    setComments([]);
    setNewCommentText('');
    setLoadingComments(true);
    setShowEmojiPicker(false);
    
    const originalId = String(reel.id).split('-loop-')[0];
    if (!reel.db_reel) {
      setComments([
        { id: 1, username: 'cyber_traveler', content: 'Incredible view! Adding this to my bucket list now 🔥', created_at: '2h ago' },
        { id: 2, username: 'neon_hustler', content: 'What focal length did you use? The framing is next-level!', created_at: '1h ago' }
      ]);
      setLoadingComments(false);
      return;
    }
    
    try {
      const res = await api.get(`/reels/comments/?reel=${originalId}`);
      let data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      if (data.length > 0 && data[0].reel !== undefined) {
        data = data.filter(c => String(c.reel) === String(originalId));
      }
      setComments(data);
    } catch (err) {
      try {
        const res = await api.get('/reels/comments/');
        let data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        data = data.filter(c => String(c.reel) === String(originalId));
        setComments(data);
      } catch (innerErr) {
        console.error("Failed to load comments", innerErr);
      }
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenShare = async (reel) => {
    setShareReel(reel);
    setSearchShareQuery('');
    setSendingStatus({});
    setLoadingShareRooms(true);

    try {
      const res = await api.get('/chats/rooms/');
      const rawRooms = Array.isArray(res.data) ? res.data : (res.data.results || []);
      
      const mappedRooms = rawRooms.map(room => {
        const otherMember = room.members?.find(m => m.username !== authUser?.username);
        const title = room.is_group ? room.title : (otherMember?.username || 'Chat');
        const avatar = room.is_group 
          ? (room.avatar ? (room.avatar.startsWith('http') ? room.avatar : `http://127.0.0.1:8000${room.avatar}`) : null) 
          : (otherMember?.avatar ? (otherMember.avatar.startsWith('http') ? otherMember.avatar : `http://127.0.0.1:8000${otherMember.avatar}`) : null);

        return {
          id: room.id,
          title,
          avatar,
          is_group: room.is_group
        };
      });

      setShareRooms(mappedRooms);
    } catch (err) {
      console.error("Failed to load chat rooms for sharing", err);
      // Fallback mocks for seamless sandbox demo
      setShareRooms([
        { id: 'mock-room-1', title: 'alexa_travels', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', is_group: false },
        { id: 'mock-room-2', title: 'designer_marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', is_group: false },
        { id: 'mock-room-3', title: 'Nexora Devs Guild 🚀', avatar: null, is_group: true }
      ]);
    } finally {
      setLoadingShareRooms(false);
    }
  };

  const handleSendReelToRoom = async (roomId) => {
    if (!shareReel) return;
    
    // Set immediate loading/sent state locally to keep UI ultra responsive
    setSendingStatus(prev => ({
      ...prev,
      [roomId]: true
    }));

    const originalId = String(shareReel.id).split('-loop-')[0];
    try {
      const messageContent = `[REEL_SHARE] | ${shareReel.username} | ${shareReel.caption || ''} | ${shareReel.media || ''} | ${originalId}`;

      // API call to post standard message to chat thread
      await api.post(`/chats/rooms/${roomId}/messages/`, {
        content: messageContent,
        media_type: 'text'
      });
    } catch (err) {
      console.error("Failed to dispatch Reel to chat room", err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentReel) return;

    const originalId = String(activeCommentReel.id).split('-loop-')[0];
    if (!activeCommentReel.db_reel) {
      const newComment = {
        id: Date.now(),
        username: authUser?.username || 'you',
        content: newCommentText.trim(),
        created_at: 'Just now'
      };
      setComments(prev => [newComment, ...prev]);
      setNewCommentText('');
      setReelsList(prev => prev.map(r => {
        const rOrigId = String(r.id).split('-loop-')[0];
        return rOrigId === originalId ? { ...r, comments: r.comments + 1 } : r;
      }));
      return;
    }

    try {
      const res = await api.post('/reels/comments/', {
        reel: originalId,
        content: newCommentText.trim()
      });
      setComments(prev => [res.data, ...prev]);
      setNewCommentText('');
      setReelsList(prev => prev.map(r => {
        const rOrigId = String(r.id).split('-loop-')[0];
        return rOrigId === originalId ? { ...r, comments: r.comments + 1 } : r;
      }));
    } catch (err) {
      console.error("Failed to submit comment", err);
    }
  };

  const handleSelectEmoji = (emoji) => {
    setNewCommentText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const filteredShareRooms = shareRooms.filter(room => 
    room.title?.toLowerCase().includes(searchShareQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-0 md:p-6 overflow-hidden select-none relative">
      
      {/* Mobile-first centered phone mockup frame on desktop screen */}
      <div 
        className="w-full md:w-auto h-screen md:h-[80vh] md:max-h-[700px] rounded-none md:rounded-3xl border-0 md:border md:border-obsidian-border bg-black relative flex flex-col justify-between overflow-hidden shadow-2xl z-10"
        style={{ aspectRatio: '9/16' }}
      >
        
        {/* Transparent top actions layer */}
        <div className="absolute top-0 left-0 right-0 p-4 z-30 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-black/35 text-always-white hover:bg-black/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-always-white tracking-wide">Reels</span>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-black/35 text-always-white hover:bg-black/50 transition-colors cursor-pointer"
          >
            <Volume2 className={`w-5 h-5 ${isMuted ? 'opacity-40 line-through' : ''}`} />
          </button>
        </div>

        {/* Scrollable vertical snap feed */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none relative bg-black"
          style={{ scrollBehavior: 'smooth' }}
        >
          {reelsList.map((reel, idx) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              isActive={idx === activeReelIndex}
              isMuted={isMuted}
              isLiked={reel.db_reel ? reel.has_liked : !!likedStatus[reel.id]}
              likedCount={reel.likes + (reel.db_reel ? 0 : (likedStatus[reel.id] ? 1 : 0))}
              isSaved={reel.db_reel ? reel.has_saved : !!savedStatus[reel.id]}
              isFollowing={!!followStatus[reel.username]}
              onLike={() => handleLike(reel)}
              onDoubleTap={handleDoubleTap}
              onOpenComments={handleOpenComments}
              onOpenShare={handleOpenShare}
              onSave={() => handleSaveReel(reel)}
              onFollow={() => toggleFollow(reel.username)}
              navigate={navigate}
            />
          ))}
        </div>
      </div>

      {/* DYNAMIC COMMENTS DRAWER SLIDING MODAL */}
      <AnimatePresence>
        {activeCommentReel && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCommentReel(null)}
              className="fixed inset-0 bg-black z-[999]"
            />

            {/* Comments sliding sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 md:left-auto md:right-0 md:top-0 md:h-screen md:w-96 bg-obsidian-card border-t md:border-t-0 md:border-l border-obsidian-border z-[1000] rounded-t-3xl md:rounded-t-none flex flex-col overflow-hidden max-h-[85vh] md:max-h-screen shadow-glass"
            >
              {/* Drawer Header */}
              <div className="px-4 py-4 border-b border-obsidian-border/50 flex justify-between items-center bg-obsidian-card select-none">
                <span className="text-xs font-black tracking-widest uppercase text-white flex items-center gap-1.5">
                  Comments 💬 <span className="text-[10px] text-slate-500 font-bold">({activeCommentReel.comments})</span>
                </span>
                <button 
                  onClick={() => setActiveCommentReel(null)}
                  className="p-1 rounded-full hover:bg-obsidian-light text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments Stream list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-cyber-pink" />
                    <span className="text-[10px] uppercase font-bold text-slate-600">Retrieving Comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center gap-2 select-none">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">No Comments Yet</span>
                    <span className="text-[10px] text-slate-600">Be the first to share your thoughts!</span>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group/comment items-start">
                      {/* Avatar */}
                      {comment.avatar ? (
                        <img 
                          src={comment.avatar.startsWith('http') ? comment.avatar : `http://127.0.0.1:8000${comment.avatar}`} 
                          alt="Commenter" 
                          className="w-8 h-8 rounded-full border border-obsidian-border object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-obsidian-border flex items-center justify-center text-xs font-black text-always-white uppercase flex-shrink-0">
                          {comment.username?.[0] || '?'}
                        </div>
                      )}
                      {/* Comment Box Balloon */}
                      <div className="flex-1 flex flex-col bg-obsidian-light/20 border border-obsidian-border/40 rounded-2xl px-4 py-2.5">
                        <div className="flex justify-between items-center select-none">
                          <span className="text-xs font-black text-white hover:underline cursor-pointer">
                            @{comment.username}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">
                            {comment.created_at}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1.5 leading-relaxed break-words">
                           {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Emoji Picker Overlay row */}
              <div className="px-4 py-2 bg-obsidian border-t border-obsidian-border/50 flex gap-2 overflow-x-auto scrollbar-none select-none shrink-0">
                {ALL_EMOJIS.map(emoji => (
                  <button 
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectEmoji(emoji)}
                    className="hover:scale-125 transition-transform text-sm cursor-pointer shrink-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Form Input submit row */}
              <form 
                onSubmit={handleSubmitComment} 
                className="p-4 border-t border-obsidian-border bg-obsidian-card flex gap-2 items-center select-none shrink-0"
              >
                <div className="relative flex-1 flex items-center bg-obsidian border border-obsidian-border rounded-xl">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <input 
                    type="text" 
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder-slate-500 focus:ring-0 focus:outline-none py-2.5 pr-3"
                  />

                  {/* Absolute Popup Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-2 mb-2 bg-obsidian-card border border-obsidian-border rounded-xl shadow-glass p-2 grid grid-cols-6 gap-2 z-50 max-h-40 overflow-y-auto"
                        >
                          {ALL_EMOJIS.map(emoji => (
                            <button 
                              key={emoji}
                              type="button"
                              onClick={() => handleSelectEmoji(emoji)}
                              className="text-base hover:scale-125 transition-all cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  type="submit" 
                  disabled={!newCommentText.trim()}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    newCommentText.trim()
                      ? 'bg-cyber-pink border-transparent text-always-white shadow-md active:scale-95'
                      : 'bg-obsidian border-obsidian-border text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DYNAMIC SHARE / SEND TO DIRECT MESSAGES MODAL */}
      <AnimatePresence>
        {shareReel && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareReel(null)}
              className="fixed inset-0 bg-black z-[999]"
            />

            {/* Share sliding sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 md:left-auto md:right-0 md:top-0 md:h-screen md:w-96 bg-obsidian-card border-t md:border-t-0 md:border-l border-obsidian-border z-[1000] rounded-t-3xl md:rounded-t-none flex flex-col overflow-hidden max-h-[80vh] md:max-h-screen shadow-glass"
            >
              {/* Drawer Header */}
              <div className="px-4 py-4 border-b border-obsidian-border/50 flex justify-between items-center bg-obsidian-card select-none">
                <span className="text-xs font-black tracking-widest uppercase text-white flex items-center gap-1.5 animate-pulse">
                  Send Reel 🚀
                </span>
                <button 
                  onClick={() => setShareReel(null)}
                  className="p-1 rounded-full hover:bg-obsidian-light text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search contacts input bar */}
              <div className="p-3 border-b border-obsidian-border/30 bg-obsidian/40 select-none">
                <div className="flex items-center bg-obsidian border border-obsidian-border rounded-xl px-3 py-2 gap-2">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search chats..."
                    value={searchShareQuery}
                    onChange={(e) => setSearchShareQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none text-xs text-white placeholder-slate-500 focus:ring-0 focus:outline-none w-full"
                  />
                </div>
              </div>

              {/* Scrollable list of active threads/chats */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
                {loadingShareRooms ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-cyber-pink" />
                    <span className="text-[10px] uppercase font-bold text-slate-600">Loading Chats...</span>
                  </div>
                ) : filteredShareRooms.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center gap-2 select-none">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">No Active Chats</span>
                    <span className="text-[10px] text-slate-600">Start conversations in Messages to send directly.</span>
                  </div>
                ) : (
                  filteredShareRooms.map((room) => {
                    const isSent = !!sendingStatus[room.id];
                    return (
                      <div key={room.id} className="flex justify-between items-center p-2 rounded-xl hover:bg-obsidian-light/20 transition-all border border-transparent hover:border-obsidian-border/35">
                        <div className="flex items-center gap-3">
                          {room.avatar ? (
                            <img 
                              src={room.avatar} 
                              alt={room.title} 
                              className="w-10 h-10 rounded-full border border-obsidian-border object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-obsidian-border flex items-center justify-center text-xs font-black text-always-white uppercase flex-shrink-0">
                              {room.title?.[0] || '?'}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                              {room.title}
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
                              {room.is_group ? "Group Room" : "Direct Message"}
                            </span>
                          </div>
                        </div>

                        {/* Send button status */}
                        <button 
                          onClick={() => handleSendReelToRoom(room.id)}
                          disabled={isSent}
                          className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSent 
                              ? "bg-transparent border-cyber-emerald text-cyber-emerald cursor-default font-black"
                              : "bg-cyber-pink border-transparent text-always-white active:scale-95 hover:bg-cyber-pink/90 hover:shadow-[0_0_10px_rgba(225,48,108,0.3)]"
                          }`}
                        >
                          {isSent ? "Sent ✓" : "Send"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Quick-actions bar (Copy Link) */}
              <div className="p-4 border-t border-obsidian-border bg-obsidian-card select-none shrink-0 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    const originalId = String(shareReel.id).split('-loop-')[0];
                    navigator.clipboard.writeText(window.location.origin + `/reels/${originalId}`);
                    alert("Reel link copied to clipboard!");
                  }}
                  className="flex-1 bg-obsidian border border-obsidian-border hover:bg-obsidian-light text-slate-200 hover:text-white transition-all text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-cyber-pink" />
                  Copy Link
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReelsFeed;
