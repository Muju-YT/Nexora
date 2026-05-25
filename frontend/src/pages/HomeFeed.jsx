import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Share2, Pin, CheckCircle2, TrendingUp, Sparkles, Send, X, Moon, Sun, MoreHorizontal, Trash2, Music, Play, Pause, Smile, ChevronLeft, ChevronRight, Film, Volume2, VolumeX, Bell } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import GlowCard from '../components/GlowCard';
import CyberButton from '../components/CyberButton';
import CyberInput from '../components/CyberInput';
import api from '../services/api';

const CURATED_SONGS = [
  { id: '1', title: 'Lofi Dreams', artist: 'Chillhop Society', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Cyberpunk Neon', artist: 'Retrowave Collective', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Acoustic Vibe', artist: 'Folk & Woods', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', title: 'Epic Journey', artist: 'Cinematic Symphonies', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: '5', title: 'Midnight Groove', artist: 'Jazz Lounge', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
];

const ALL_EMOJIS = [
  '❤️', '🙌', '🔥', '👏', '😂', '😍', '😢', '😮',
  '👍', '🎉', '✨', '💖', '😎', '🤔', '💯', '🙏',
  '🌟', '🚀', '👀', '🤣', '🤩', '🥰', '💔', '😭'
];

const InlineReelCard = ({ 
  reel, 
  isMuted, 
  setIsMuted, 
  onLike, 
  onDoubleTap, 
  onOpenComments, 
  onOpenShare, 
  onSave,
  navigate,
  getAvatarUrl,
  heartOverlayPostId,
  setHeartOverlayPostId
}) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [heartOverlay, setHeartOverlay] = useState(false);

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
    onDoubleTap(reel.id, reel.has_liked);
    setHeartOverlay(true);
    setTimeout(() => {
      setHeartOverlay(false);
    }, 850);
  };

  return (
    <GlowCard hoverable={false} className="p-0 overflow-hidden">
      {/* Reel Author Header */}
      <div className="flex justify-between items-center p-4 border-b border-obsidian-border/50 relative">
        <div className="flex items-center gap-3">
          {reel.avatar ? (
            <img 
              src={getAvatarUrl(reel.avatar)} 
              alt={reel.username} 
              className="w-9 h-9 rounded-full object-cover border border-obsidian-border cursor-pointer" 
              onClick={() => navigate(`/profile/${reel.username}`)}
            />
          ) : (
            <div 
              className="w-9 h-9 rounded-full border border-obsidian-border bg-slate-700 flex items-center justify-center text-sm font-black text-always-white uppercase cursor-pointer"
              onClick={() => navigate(`/profile/${reel.username}`)}
            >
              {reel.username?.[0] || '?'}
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span
                onClick={() => navigate(`/profile/${reel.username}`)}
                className="text-xs md:text-sm font-bold text-white hover:underline cursor-pointer"
              >
                {reel.username}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6]/10" />
            </div>
            <span className="text-[9px] text-slate-500">{new Date(reel.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] font-black text-[#E1306C] tracking-wider uppercase bg-[#E1306C]/10 border border-[#E1306C]/20 px-2.5 py-0.5 rounded-lg select-none">
            <Film className="w-2.5 h-2.5 text-[#E1306C]" /> Reel
          </div>
        </div>
      </div>

      {/* Reel Video Player Container */}
      <div 
        onDoubleClick={handleDoubleTapAction}
        onClick={handlePlayPause}
        className="w-full h-[500px] relative bg-black overflow-hidden flex items-center justify-center cursor-pointer select-none"
      >
        <video 
          ref={videoRef}
          src={reel.video} 
          autoPlay
          loop 
          muted={isMuted} 
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Soft elegant gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-10" />

        {/* Volume control overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(prev => !prev);
          }}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/85 text-always-white transition-colors cursor-pointer z-20 border border-white/10"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Click to view full reel indicator */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/reels?reel=${reel.id}`);
          }}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 hover:bg-black/85 text-always-white text-[10px] font-bold border border-white/10 transition-colors z-20 cursor-pointer"
        >
          <Film className="w-3.5 h-3.5" />
          <span>View Full Reel</span>
        </div>

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
              className="absolute z-30 pointer-events-none"
            >
              <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption & Content Panel */}
      <div className="p-4 flex flex-col gap-3">
        {reel.caption && (
          <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
            <span 
              className="font-bold text-white mr-2 hover:underline cursor-pointer" 
              onClick={() => navigate(`/profile/${reel.username}`)}
            >
              {reel.username}
            </span>
            {reel.caption}
          </p>
        )}

        {/* Action Buttons Row */}
        <div className="flex justify-between items-center border-t border-obsidian-border/40 pt-3 mt-1">
          <div className="flex gap-5">
            <button 
              onClick={() => onLike(reel.id)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${reel.has_liked ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Heart className={`w-5 h-5 ${reel.has_liked ? 'fill-red-500' : ''}`} />
              <span className="text-xs font-black">{reel.likes}</span>
            </button>
            <button 
              onClick={() => onOpenComments(reel)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-black">{reel.comments}</span>
            </button>
            <button 
              onClick={() => onOpenShare(reel)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Share Reel"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={() => onSave(reel.id)}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
              reel.has_saved ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Save Reel"
          >
            <Bookmark className={`w-5 h-5 ${reel.has_saved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    </GlowCard>
  );
};

const HomeFeed = () => {
  const navigate = useNavigate();
  const { user, theme, setTheme, unreadMessagesCount, unreadNotificationsCount } = useAuthStore();
  const { rooms, fetchRooms } = useChatStore();

  // Single-instance active audio player states & ref
  const [playingPostId, setPlayingPostId] = useState(null);
  const activeAudioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, []);

  const getAudioUrlForPost = (post) => {
    if (post.music_file) {
      return getMediaUrl(post.music_file);
    }
    if (post.music_title) {
      const curated = CURATED_SONGS.find(s => s.title.toLowerCase() === post.music_title.toLowerCase());
      if (curated) {
        return curated.url;
      }
    }
    return null;
  };

  const togglePostAudio = (post) => {
    const audioUrl = getAudioUrlForPost(post);
    if (!audioUrl) return;

    if (playingPostId === post.id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      setPlayingPostId(null);
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audio.volume = 0.6;
      audio.play()
        .then(() => {
          activeAudioRef.current = audio;
          setPlayingPostId(post.id);
          audio.onended = () => {
            if (activeAudioRef.current === audio) {
              setPlayingPostId(null);
            }
          };
        })
        .catch((err) => {
          console.error("Failed to play audio", err);
          alert("Could not load or play this post's audio track.");
        });
    }
  };

  const [activePollVotes, setActivePollVotes] = useState({});

  // Reels strip states
  const [reels, setReels] = useState([]);
  const [reelsMuted, setReelsMuted] = useState(true);

  // Real database-driven states
  const [posts, setPosts] = useState([]);
  const [activeMediaIndices, setActiveMediaIndices] = useState({});
  const [stories, setStories] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingReels, setLoadingReels] = useState(true);

  const isVideoFile = (url) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || 
           cleanUrl.endsWith('.mov') || 
           cleanUrl.endsWith('.avi') || 
           cleanUrl.endsWith('.webm') || 
           cleanUrl.endsWith('.mkv') || 
           cleanUrl.includes('/media/videos/') || 
           cleanUrl.includes('/reels/') ||
           cleanUrl.includes('/media/reels/');
  };

  // Comments drawer states
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Sharing drawer/modal states
  const [activeSharePost, setActiveSharePost] = useState(null);
  const [sentRooms, setSentRooms] = useState({}); // mapping room.id -> boolean
  const [searchRoomQuery, setSearchRoomQuery] = useState('');

  const handleOpenShare = (post) => {
    setActiveSharePost(post);
    setSentRooms({});
    setSearchRoomQuery('');
    fetchRooms();
  };

  const handleShareToRoom = async (room) => {
    if (!activeSharePost) return;
    const isReel = activeSharePost.type === 'reel';
    let postContent = '';
    if (isReel) {
      postContent = `[REEL_SHARE] | ${activeSharePost.username} | ${activeSharePost.caption || ''} | ${activeSharePost.video || ''} | ${activeSharePost.id}`;
    } else {
      postContent = `[POST_SHARE] | ${activeSharePost.username} | ${activeSharePost.caption || ''} | ${activeSharePost.media && activeSharePost.media.length > 0 ? activeSharePost.media[0].file : ''}`;
    }
    
    try {
      await api.post(`/chats/rooms/${room.id}/messages/`, {
        content: postContent,
        media_type: 'text'
      });
      
      setSentRooms(prev => ({ ...prev, [room.id]: true }));
    } catch (err) {
      console.error("Failed to share post/reel", err);
      alert("Failed to share. Please try again.");
    }
  };

  // Heart double-tap animation state
  const [heartOverlayPostId, setHeartOverlayPostId] = useState(null);

  // Real logged-in user helpers
  const myUsername = user?.username || 'you';

  // Post action dropdown states
  const [activeDropdownPostId, setActiveDropdownPostId] = useState(null);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      await api.delete(`/posts/feed/${postId}/`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      alert("Post deleted successfully!");
    } catch (err) {
      console.error("Failed to delete post", err);
      alert("Failed to delete the post. Please try again.");
    } finally {
      setActiveDropdownPostId(null);
    }
  };
  
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return `http://127.0.0.1:8000${avatar}`;
  };

  const getMediaUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    return `http://127.0.0.1:8000${fileUrl}`;
  };

  const myAvatarUrl = getAvatarUrl(user?.profile?.avatar);
  const myInitial = myUsername[0]?.toUpperCase() || '?';

  // Fetch real posts from API — always trending
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await api.get('/posts/feed/?feed=trending');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setPosts(data);

      // Auto register active poll votes if user already voted in them
      const pollVotes = {};
      data.forEach(p => {
        if (p.poll) {
          const votedOption = p.poll.options.find(opt => opt.has_voted);
          if (votedOption) {
            pollVotes[p.poll.id] = votedOption.id;
          }
        }
      });
      setActivePollVotes(pollVotes);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch reels for the home strip
  const fetchReels = async () => {
    setLoadingReels(true);
    try {
      const res = await api.get('/reels/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setReels(data.map(r => ({
        id: r.id,
        username: r.username,
        avatar: r.avatar ? (r.avatar.startsWith('http') ? r.avatar : `http://127.0.0.1:8000${r.avatar}`) : null,
        caption: r.caption,
        video: r.video ? (r.video.startsWith('http') ? r.video : `http://127.0.0.1:8000${r.video}`) : '',
        likes: r.likes_count || 0,
        comments: r.comments_count || 0,
        has_liked: r.has_liked || false,
        has_saved: r.has_saved || false,
        is_following: r.is_following || false,
        created_at: r.created_at,
      })));
    } catch (err) {
      console.error('Failed to load reels', err);
    } finally {
      setLoadingReels(false);
    }
  };

  // Fetch real active stories
  const fetchStories = async () => {
    try {
      const res = await api.get('/stories/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setStories(data);
    } catch (err) {
      console.error("Failed to load stories", err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchReels();
  }, []);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (!loadingPosts && posts.length > 0) {
      const queryParams = new URLSearchParams(window.location.search);
      const targetPostId = queryParams.get('post');
      let finalPostId = targetPostId;
      
      const hash = window.location.hash;
      if (!finalPostId && hash && hash.startsWith('#post-')) {
        finalPostId = hash.replace('#post-', '');
      }

      if (finalPostId) {
        const targetPost = posts.find(p => p.id === parseInt(finalPostId));
        if (targetPost) {
          if (targetPostId) {
            handleOpenComments(targetPost);
          }
          setTimeout(() => {
            const element = document.getElementById(`post-${finalPostId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      }
    }
  }, [loadingPosts, posts]);

  // Separate own stories from others'
  const myStories = stories.filter(s => s.username === myUsername);
  const hasMyActiveStory = myStories.length > 0;
  // Deduplicate: show one bubble per user (latest story), excluding self
  const seenUsernames = new Set([myUsername]);
  const otherStories = stories.filter(s => {
    if (seenUsernames.has(s.username)) return false;
    seenUsernames.add(s.username);
    return true;
  });

  const activeStories = [
    // "Your Story" bubble — always first
    {
      id: hasMyActiveStory ? myStories[0].id : 'me',
      username: myUsername,
      avatarUrl: myAvatarUrl,
      avatarInitial: myInitial,
      has_unseen: false,
      isMe: true,
      hasActiveStory: hasMyActiveStory,
    },
    // Everyone else — one bubble per user
    ...otherStories.map(s => ({
      id: s.id,
      username: s.username,
      avatarUrl: getAvatarUrl(s.avatar),
      avatarInitial: s.username[0]?.toUpperCase(),
      has_unseen: !s.viewers.some(v => v.username === myUsername),
    }))
  ];

  const trends = [
    { tag: "#NexoraRedesign", count: "189.5K actions" },
    { tag: "#ThreadsMode", count: "123.2K actions" },
    { tag: "#ContentFirst", count: "98.1K actions" }
  ];

  const buildUnifiedFeed = () => {
    const combined = [
      ...posts.map(p => ({ ...p, type: 'post' })),
      ...reels.map(r => ({ ...r, type: 'reel' }))
    ];
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return combined;
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/feed/${postId}/like/`);
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        has_liked: !p.has_liked,
        likes_count: p.has_liked ? p.likes_count - 1 : p.likes_count + 1
      } : p));
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  const handleDoubleTap = (postId, alreadyLiked) => {
    if (!alreadyLiked) {
      handleLike(postId);
    }
    setHeartOverlayPostId(postId);
    setTimeout(() => {
      setHeartOverlayPostId(null);
    }, 850);
  };

  const handleReelLike = async (reelId) => {
    try {
      const res = await api.post(`/reels/${reelId}/like/`);
      setReels(prev => prev.map(r => r.id === reelId ? {
        ...r,
        has_liked: res.data.status === 'liked',
        likes: res.data.status === 'liked' ? r.likes + 1 : r.likes - 1
      } : r));
    } catch (err) {
      console.error("Failed to like reel", err);
    }
  };

  const handleReelDoubleTap = (reelId, alreadyLiked) => {
    if (!alreadyLiked) {
      handleReelLike(reelId);
    }
    setHeartOverlayPostId(`reel-${reelId}`);
    setTimeout(() => {
      setHeartOverlayPostId(null);
    }, 850);
  };

  const handleReelSave = async (reelId) => {
    try {
      const res = await api.post(`/reels/${reelId}/save_reel/`);
      setReels(prev => prev.map(r => r.id === reelId ? {
        ...r,
        has_saved: res.data.status === 'saved'
      } : r));
    } catch (err) {
      console.error("Failed to toggle save on reel", err);
    }
  };

  const handleSave = async (postId) => {
    try {
      await api.post(`/posts/feed/${postId}/save_post/`);
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        has_saved: !p.has_saved
      } : p));
    } catch (err) {
      console.error("Failed to save post", err);
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      await api.post(`/posts/polls/vote/${optionId}/`);
      setPosts(prev => prev.map(p => {
        if (p.poll && p.poll.id === pollId) {
          const nextOptions = p.poll.options.map(opt => {
            if (opt.id === optionId) {
              return { ...opt, votes_count: opt.votes_count + 1, has_voted: true };
            }
            return opt;
          });
          return {
            ...p,
            poll: {
              ...p.poll,
              options: nextOptions,
              total_votes: p.poll.total_votes + 1
            }
          };
        }
        return p;
      }));
      setActivePollVotes(prev => ({ ...prev, [pollId]: optionId }));
    } catch (err) {
      console.error("Failed to cast vote", err);
    }
  };

  // Open comments bottom-drawer and load real comments from API
  const handleOpenComments = async (post) => {
    setActiveCommentPost(post);
    setComments([]);
    setNewCommentText('');
    setLoadingComments(true);
    setShowEmojiPicker(false);
    try {
      const isReel = post.type === 'reel';
      const endpoint = isReel ? `/reels/comments/?reel=${post.id}` : `/posts/comments/?post=${post.id}`;
      const res = await api.get(endpoint);
      let data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      if (isReel) {
        if (data.length > 0 && data[0].reel !== undefined) {
          data = data.filter(c => c.reel === post.id);
        }
      }
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Post a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentPost) return;

    const isReel = activeCommentPost.type === 'reel';
    const endpoint = isReel ? '/reels/comments/' : '/posts/comments/';
    const payload = isReel 
      ? { reel: activeCommentPost.id, content: newCommentText.trim() }
      : { post: activeCommentPost.id, content: newCommentText.trim() };

    try {
      const res = await api.post(endpoint, payload);
      setComments(prev => [res.data, ...prev]);
      setNewCommentText('');
      
      if (isReel) {
        setReels(prev => prev.map(r => r.id === activeCommentPost.id ? {
          ...r,
          comments: r.comments + 1
        } : r));
        setActiveCommentPost(prev => ({ ...prev, comments: prev.comments + 1 }));
      } else {
        setPosts(prev => prev.map(p => p.id === activeCommentPost.id ? {
          ...p,
          comments_count: p.comments_count + 1
        } : p));
        setActiveCommentPost(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
      }
    } catch (err) {
      console.error("Failed to submit comment", err);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row gap-8 relative">
      
      {/* MOBILE ONLY TOP BAR HEADER */}
      <div className="md:hidden flex items-center justify-between border-b border-obsidian-border pb-3 mb-2 px-1">
        <h1 className="text-3xl font-black italic tracking-tight select-none bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] bg-clip-text text-transparent">
          Nexora
        </h1>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 hover:bg-obsidian-light/35 rounded-full text-slate-400">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>
          <button onClick={() => navigate('/notifications')} className="p-2 hover:bg-obsidian-light/35 rounded-full text-slate-400 relative">
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_6px_#EF4444] block" />
            )}
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#EF4444] block" />
            )}
          </button>
          <button onClick={() => navigate('/chats')} className="p-2 hover:bg-obsidian-light/35 rounded-full text-slate-400 relative">
            <Send className="w-5 h-5 rotate-12" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.5 rounded-full bg-[#E1306C] text-[8px] font-black text-white flex items-center justify-center min-w-4 h-4 shadow-[0_0_8px_#E1306C]" style={{ transform: 'translate(25%, -25%)' }}>
                {unreadMessagesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main timeline column */}
      <div className="flex-1 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        
        {/* Horizontal stories bar */}
        <div className="overflow-x-auto flex gap-4 p-4 rounded-2xl border border-obsidian-border bg-obsidian-card/45 backdrop-blur-xl scrollbar-none">
          {activeStories.map((story) => (
            <div
              key={story.id}
              onClick={() => {
                if (story.isMe) {
                  // If we have an active story, view it; clicking the + badge will redirect to create
                  if (story.hasActiveStory) {
                    navigate(`/story/${story.id}`);
                  } else {
                    navigate('/create-story');
                  }
                } else {
                  navigate(`/story/${story.id}`);
                }
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <div className="relative">
                {/* Ring: gradient if has unseen/active story, dashed if isMe with no story, plain border otherwise */}
                <div className={`p-[2.5px] rounded-full transition-transform hover:scale-105 duration-200 ${
                  story.has_unseen
                    ? 'bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584]'
                    : story.isMe && story.hasActiveStory
                      ? 'bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] opacity-60'
                      : story.isMe
                        ? 'border-2 border-dashed border-slate-500'
                        : 'border-2 border-obsidian-border'
                }`}>
                  {story.avatarUrl ? (
                    <img
                      src={story.avatarUrl}
                      alt={story.username}
                      className="w-14 h-14 rounded-full border-2 border-obsidian object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full border-2 border-obsidian bg-slate-700 flex items-center justify-center text-lg font-black text-white">
                      {story.avatarInitial}
                    </div>
                  )}
                </div>
                {/* + badge — always show on own bubble, navigates to create-story */}
                {story.isMe && (
                  <div
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0095F6] border-2 border-obsidian flex items-center justify-center text-[11px] font-black text-white select-none z-10"
                    onClick={(e) => { e.stopPropagation(); navigate('/create-story'); }}
                  >
                    +
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 max-w-[70px] truncate">
                {story.isMe ? 'Your Story' : story.username}
              </span>
            </div>
          ))}
        </div>


        {/* Posts timeline */}
        <div className="flex flex-col gap-5">
          {loadingPosts || loadingReels ? (
            // Skeleton loaders
            [1, 2, 3].map((s) => (
              <div key={s} className="bg-obsidian-card border border-obsidian-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-obsidian-light" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="w-24 h-3 bg-obsidian-light rounded" />
                    <div className="w-16 h-2 bg-obsidian-light rounded" />
                  </div>
                </div>
                <div className="w-full h-72 bg-obsidian-light rounded-xl" />
                <div className="w-3/4 h-3 bg-obsidian-light rounded" />
                <div className="w-1/2 h-3 bg-obsidian-light rounded" />
              </div>
            ))
          ) : buildUnifiedFeed().length === 0 ? (
            <div className="text-center py-16 bg-obsidian-card border border-obsidian-border rounded-2xl">
              <span className="text-slate-400 text-sm font-semibold">No posts or reels yet. Be the first to upload!</span>
            </div>
          ) : (
            buildUnifiedFeed().map((item) => {
              if (item.type === 'reel') {
                return (
                  <div id={`reel-${item.id}`} key={`reel-${item.id}`}>
                    <InlineReelCard
                      reel={item}
                      isMuted={reelsMuted}
                      setIsMuted={setReelsMuted}
                      onLike={handleReelLike}
                      onDoubleTap={handleReelDoubleTap}
                      onOpenComments={handleOpenComments}
                      onOpenShare={handleOpenShare}
                      onSave={handleReelSave}
                      navigate={navigate}
                      getAvatarUrl={getAvatarUrl}
                      heartOverlayPostId={heartOverlayPostId}
                      setHeartOverlayPostId={setHeartOverlayPostId}
                    />
                  </div>
                );
              } else {
                const post = item;
                return (
                  <div id={`post-${post.id}`} key={`post-${post.id}`}>
                <GlowCard hoverable={false} className="p-0 overflow-hidden">
                  {/* Post Author */}
                <div className="flex justify-between items-center p-4 border-b border-obsidian-border/50 relative">
                  <div className="flex items-center gap-3">
                    {post.avatar ? (
                      <img 
                        src={getAvatarUrl(post.avatar)} 
                        alt={post.username} 
                        className="w-9 h-9 rounded-full object-cover border border-obsidian-border" 
                        onClick={() => navigate(`/profile/${post.username}`)}
                      />
                    ) : (
                      <div 
                        className="w-9 h-9 rounded-full border border-obsidian-border bg-slate-700 flex items-center justify-center text-sm font-black text-white uppercase cursor-pointer"
                        onClick={() => navigate(`/profile/${post.username}`)}
                      >
                        {post.username?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span
                          onClick={() => navigate(`/profile/${post.username}`)}
                          className="text-xs md:text-sm font-bold text-white hover:underline cursor-pointer"
                        >
                          {post.username}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6]/10" />
                      </div>
                      <span className="text-[9px] text-slate-500">{post.created_at}</span>
                      
                      {post.music_title && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); togglePostAudio(post); }}
                          className="flex items-center gap-1.5 mt-1 text-[10px] text-cyber-cyan font-bold select-none cursor-pointer hover:text-cyber-cyan/80 transition-colors bg-cyber-cyan/5 border border-cyber-cyan/15 px-2.5 py-0.5 rounded-full w-fit max-w-[180px] sm:max-w-[220px]"
                        >
                          <Music className={`w-2.5 h-2.5 text-cyber-cyan ${playingPostId === post.id ? 'animate-pulse' : ''}`} />
                          <span className="truncate">{post.music_artist} · {post.music_title}</span>
                          
                          {playingPostId === post.id ? (
                            <div className="flex items-end gap-[1.5px] h-2 w-2.5 ml-0.5 pb-[1px] shrink-0">
                              <span className="w-[1.5px] bg-cyber-cyan rounded-full animate-music-bar-1" style={{ height: '30%' }} />
                              <span className="w-[1.5px] bg-cyber-cyan rounded-full animate-music-bar-2" style={{ height: '40%' }} />
                              <span className="w-[1.5px] bg-cyber-cyan rounded-full animate-music-bar-3" style={{ height: '20%' }} />
                            </div>
                          ) : (
                            <Play className="w-2 h-2 ml-0.5 fill-cyber-cyan/20 text-cyber-cyan shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {post.is_pinned && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-[#0095F6] tracking-wider uppercase bg-[#0095F6]/10 border border-[#0095F6]/20 px-2 py-0.5 rounded-lg">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </div>
                    )}

                    {post.username === myUsername && (
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdownPostId(prev => prev === post.id ? null : post.id)}
                          className="p-1 rounded-full hover:bg-obsidian-light text-slate-400 hover:text-white cursor-pointer transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {activeDropdownPostId === post.id && (
                            <>
                              {/* Overlay click catcher to close */}
                              <div 
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveDropdownPostId(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-0 mt-1.5 w-32 bg-obsidian-card border border-obsidian-border rounded-xl shadow-glass overflow-hidden z-40 py-1"
                              >
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-colors cursor-pointer text-left"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete Post</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Image with Double-Tap Heart animation */}
                {post.media && post.media.length > 0 ? (
                  <div 
                    onDoubleClick={() => handleDoubleTap(post.id, post.has_liked)}
                    className="w-full h-96 relative bg-obsidian-light overflow-hidden flex items-center justify-center cursor-pointer select-none"
                  >
                    {(() => {
                      const activeIdx = activeMediaIndices[post.id] || 0;
                      const activeItem = post.media[activeIdx];
                      if (!activeItem) return null;
                      return isVideoFile(activeItem.file) ? (
                        <video 
                          key={activeItem.file}
                          src={getMediaUrl(activeItem.file)} 
                          controls 
                          autoPlay
                          loop 
                          muted 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          src={getMediaUrl(activeItem.file)} 
                          alt="Media" 
                          className="w-full h-full object-cover" 
                        />
                      );
                    })()}

                    {/* Carousel Overlay Navigation Arrows */}
                    {post.media.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const activeIdx = activeMediaIndices[post.id] || 0;
                            const prevIdx = activeIdx === 0 ? post.media.length - 1 : activeIdx - 1;
                            setActiveMediaIndices(prev => ({ ...prev, [post.id]: prevIdx }));
                          }}
                          className="absolute left-3 p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white transition-all border border-white/10 active:scale-90 z-20 cursor-pointer shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const activeIdx = activeMediaIndices[post.id] || 0;
                            const nextIdx = activeIdx === post.media.length - 1 ? 0 : activeIdx + 1;
                            setActiveMediaIndices(prev => ({ ...prev, [post.id]: nextIdx }));
                          }}
                          className="absolute right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white transition-all border border-white/10 active:scale-90 z-20 cursor-pointer shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* Carousel Dot Indicators Overlay */}
                    {post.media.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/5 z-20">
                        {post.media.map((_, idx) => {
                          const activeIdx = activeMediaIndices[post.id] || 0;
                          return (
                            <div 
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                idx === activeIdx 
                                  ? 'bg-cyber-cyan scale-125' 
                                  : 'bg-white/40'
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Popping Heart Animation */}
                    <AnimatePresence>
                      {heartOverlayPostId === post.id && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.45 }}
                          className="absolute z-30 pointer-events-none"
                        >
                          <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : null}

                {/* Caption & Content Panel */}
                <div className="p-4 flex flex-col gap-3">
                  {/* Caption */}
                  {post.caption && (
                    <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
                      <span className="font-bold text-white mr-2 hover:underline cursor-pointer" onClick={() => navigate(`/profile/${post.username}`)}>
                        {post.username}
                      </span>
                      {post.caption}
                    </p>
                  )}

                  {/* Polling Module */}
                  {post.poll && (
                    <div className="p-4 rounded-xl bg-obsidian-light/30 border border-obsidian-border flex flex-col gap-3">
                      <span className="text-xs font-bold text-white">{post.poll.question}</span>
                      <div className="flex flex-col gap-2">
                        {post.poll.options.map((opt) => {
                          const totalVotes = post.poll.options.reduce((sum, o) => sum + (o.votes_count || 0), 0);
                          const isVoted = activePollVotes[post.poll.id] === opt.id;
                          const hasAnyVoted = activePollVotes[post.poll.id] !== undefined;
                          
                          const percentage = totalVotes > 0 
                            ? Math.round(((opt.votes_count || 0) / totalVotes) * 100) 
                            : 0;

                          return (
                            <button
                              key={opt.id}
                              disabled={hasAnyVoted}
                              onClick={() => handleVote(post.poll.id, opt.id)}
                              className="w-full relative px-4 py-2.5 rounded-xl border border-obsidian-border hover:border-cyber-pink/25 transition-all text-left overflow-hidden flex justify-between items-center text-xs cursor-pointer"
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: hasAnyVoted ? `${percentage}%` : '0%' }}
                                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                className={`absolute left-0 top-0 bottom-0 ${isVoted ? 'bg-[#E1306C]/15' : 'bg-slate-700/10'}`}
                              />
                              <span className="relative z-10 font-bold text-slate-200">{opt.text}</span>
                              {hasAnyVoted && <span className="relative z-10 font-black text-cyber-pink">{percentage}%</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex justify-between items-center border-t border-obsidian-border/40 pt-3 mt-1">
                    <div className="flex gap-5">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 transition-all cursor-pointer ${post.has_liked ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <Heart className={`w-5 h-5 ${post.has_liked ? 'fill-red-500' : ''}`} />
                        <span className="text-xs font-black">{post.likes_count}</span>
                      </button>
                      <button 
                        onClick={() => handleOpenComments(post)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-xs font-black">{post.comments_count}</span>
                      </button>
                      <button 
                        onClick={() => handleOpenShare(post)}
                        className="text-slate-400 hover:text-slate-200 cursor-pointer"
                        title="Share Post"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleSave(post.id)}
                      className={`cursor-pointer ${post.has_saved ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Bookmark className={`w-5 h-5 ${post.has_saved ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
              </GlowCard>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>

      {/* Right recommendation column (Desktop sidebar recommendation widget) */}
      <div className="hidden lg:flex flex-col gap-6 w-80 shrink-0">
        
        {/* Logged in User Identity Card */}
        <GlowCard hoverable={false} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {myAvatarUrl ? (
              <img
                src={myAvatarUrl}
                alt="Self"
                className="w-11 h-11 rounded-full object-cover border border-obsidian-border"
              />
            ) : (
              <div className="w-11 h-11 rounded-full border border-obsidian-border bg-slate-700 flex items-center justify-center text-lg font-black text-white uppercase">
                {myInitial}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-black text-white hover:underline cursor-pointer" onClick={() => navigate('/profile')}>
                {user?.username || 'Loading...'}
              </span>
              <span className="text-[10px] text-slate-500">
                {user?.email || 'Nexora account'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')} 
            className="text-[10px] font-black text-[#0095F6] hover:text-[#1877F2] uppercase cursor-pointer"
          >
            Profile
          </button>
        </GlowCard>

        {/* Trends */}
        <GlowCard hoverable={false} className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-obsidian-border">
            <TrendingUp className="w-4 h-4 text-cyber-pink" />
            <span className="text-[10px] font-black tracking-widest text-white uppercase">Trending Hashtags</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {trends.map((t, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer">{t.tag}</span>
                <span className="text-[10px] text-slate-500">{t.count}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* DYNAMIC COMMENTS BOTTOM DRAWER SLIDING MODAL */}
      <AnimatePresence>
        {activeCommentPost && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCommentPost(null)}
              className="fixed inset-0 bg-black z-[999]"
            />

            {/* Comments sliding sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 md:left-auto md:right-0 md:top-0 md:h-screen md:w-96 bg-obsidian-card border-t md:border-t-0 md:border-l border-obsidian-border z-[1000] rounded-t-3xl md:rounded-t-none flex flex-col overflow-hidden max-h-[85vh] md:max-h-screen"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center p-4 border-b border-obsidian-border">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white">Comments</span>
                  <span className="text-[10px] text-slate-500">@{activeCommentPost.username}'s post</span>
                </div>
                <button 
                  onClick={() => setActiveCommentPost(null)}
                  className="p-1.5 hover:bg-obsidian-light/35 rounded-full text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments scroll pane */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {loadingComments ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="w-6 h-6 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-xs text-slate-500 font-semibold">No comments yet. Start the conversation!</span>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      {comment.avatar ? (
                        <img 
                          src={getAvatarUrl(comment.avatar)} 
                          alt={comment.username} 
                          className="w-8 h-8 rounded-full object-cover border border-obsidian-border" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-obsidian-border bg-slate-700 flex items-center justify-center text-[10px] font-black text-white uppercase">
                          {comment.username?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex flex-col flex-1 bg-obsidian-light/20 border border-obsidian-border/40 p-2.5 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                            {comment.username}
                          </span>
                          <span className="text-[8px] text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 text-xs mt-1 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment submission form input with Emoji integration */}
              <form onSubmit={handleSubmitComment} className="p-4 border-t border-obsidian-border bg-obsidian-card flex flex-col gap-3 relative">
                
                {/* Emoji Popover Picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <>
                      {/* Click outside overlay to close */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="absolute bottom-20 left-4 right-4 bg-obsidian-card/95 border border-obsidian-border rounded-2xl p-3 shadow-glass z-50 flex flex-col gap-2 max-h-[180px] overflow-y-auto backdrop-blur-xl"
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 select-none">Express Yourself</span>
                        <div className="grid grid-cols-8 gap-2 justify-items-center">
                          {ALL_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setNewCommentText(prev => prev + emoji);
                              }}
                              className="text-lg hover:scale-125 transition-transform duration-100 cursor-pointer active:scale-95"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Quick Emojis Row */}
                <div className="flex gap-2 px-1 pb-1 select-none overflow-x-auto scrollbar-none justify-between border-b border-obsidian-border/30">
                  {['❤️', '🙌', '🔥', '👏', '😂', '😍', '😢', '😮'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCommentText(prev => prev + emoji)}
                      className="text-base hover:scale-125 transition-transform duration-100 cursor-pointer active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      required
                      className="w-full pl-4 pr-10 py-3 bg-obsidian-light/20 border border-obsidian-border rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:border-cyber-pink/50 transition-all duration-200 text-xs md:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-3 p-1 rounded-full text-slate-500 hover:text-white transition-colors cursor-pointer hover:bg-obsidian-light/30"
                    >
                      <Smile className={`w-4 h-4 ${showEmojiPicker ? 'text-cyber-pink' : ''}`} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="p-3 bg-cyber-pink hover:bg-cyber-pink/85 disabled:opacity-40 disabled:hover:bg-cyber-pink text-white rounded-xl cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* INSTAGRAM-STYLE SHARE MODAL */}
      <AnimatePresence>
        {activeSharePost && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSharePost(null)}
              className="fixed inset-0 bg-black/80 z-[999]"
            />

            {/* Share sliding sheet / popup */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:h-[500px] md:w-[450px] bg-obsidian-card border border-obsidian-border z-[1000] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden max-h-[80vh] md:max-h-[500px] shadow-glass"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-obsidian-border">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white uppercase tracking-wider">Share Post</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Send this post to friends or groups</span>
                </div>
                <button 
                  onClick={() => setActiveSharePost(null)}
                  className="p-1.5 hover:bg-obsidian-light/35 rounded-full text-slate-400 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search room filter input */}
              <div className="p-3 border-b border-obsidian-border bg-obsidian/30">
                <input 
                  type="text"
                  placeholder="Search conversations..."
                  value={searchRoomQuery}
                  onChange={(e) => setSearchRoomQuery(e.target.value)}
                  className="w-full px-3.5 py-2 bg-obsidian border border-obsidian-border rounded-xl text-white outline-none focus:border-cyber-pink text-xs transition-colors"
                />
              </div>

              {/* Chat room list scroll pane */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {rooms.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-xs text-slate-500 font-semibold">No active conversations found.</span>
                  </div>
                ) : (
                  rooms
                    .filter(r => {
                      const other = r.members?.find(m => m.username !== user?.username);
                      const title = r.is_group ? r.title : (other?.username || 'Chat');
                      return title.toLowerCase().includes(searchRoomQuery.toLowerCase());
                    })
                    .map((room) => {
                      const other = room.members?.find(m => m.username !== user?.username);
                      const title = room.is_group ? room.title : (other?.username || 'Chat');
                      const avatar = room.is_group ? getAvatarUrl(room.avatar) : getAvatarUrl(other?.avatar);
                      const isSent = sentRooms[room.id] === true;

                      return (
                        <div key={room.id} className="flex justify-between items-center p-2 rounded-xl border border-obsidian-border bg-obsidian-light/10 hover:bg-obsidian-light/20 transition-all">
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <img 
                                src={avatar} 
                                alt={title} 
                                className="w-9 h-9 rounded-full object-cover border border-obsidian-border" 
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full border border-obsidian-border bg-slate-700 flex items-center justify-center text-xs font-black text-white uppercase">
                                {title?.[0] || '?'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">{title}</span>
                              <span className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">
                                {room.is_group ? 'Group Chat' : 'Direct Message'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleShareToRoom(room)}
                            disabled={isSent}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                              isSent 
                                ? 'bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald font-bold' 
                                : 'bg-[#0095F6] hover:bg-[#0095F6]/85 border border-[#0095F6]/20 text-white font-bold shadow-md'
                            }`}
                          >
                            {isSent ? 'Sent ✓' : 'Send'}
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HomeFeed;
