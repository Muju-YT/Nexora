import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings as SettingsIcon, CheckCircle2, MapPin, Grid, ShieldAlert, Heart, MessageCircle, Play, Bookmark, Tag, Music, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '../components/GlowCard';
import CyberButton from '../components/CyberButton';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { getAvatarUrl, getMediaUrl } from '../utils/url';

const FALLBACK_COVER = "https://images.unsplash.com/photo-1541462608141-275d72e4bc02?auto=format&fit=crop&w=800&q=80";

const UserProfile = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user: authUser, isAuthenticated } = useAuthStore();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  
  // Real database-driven states
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [savedActiveSubTab, setSavedActiveSubTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Modal states for followers / following overlay lists
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('followers');
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Post detail overlay modal states
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [loadingCommentsPost, setLoadingCommentsPost] = useState(false);
  const [newPostCommentText, setNewPostCommentText] = useState('');

  const openFollowModal = async (type) => {
    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);
    setModalUsers([]);
    try {
      const endpoint = `/users/profiles/${targetUsername}/${type}_list/`;
      const res = await api.get(endpoint);
      setModalUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(`Failed to load ${type} list`, err);
    } finally {
      setModalLoading(false);
    }
  };

  // Determine if viewing own profile
  const isOwnProfile = !username || username.toLowerCase() === authUser?.username?.toLowerCase();
  const targetUsername = isOwnProfile ? authUser?.username : username;

  console.log("DEBUG UserProfile:", {
    username,
    authUsername: authUser?.username,
    isOwnProfile,
    savedPostsLength: savedPosts.length,
    loadingSaved,
    activeTab
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (!targetUsername) return;
      setLoading(true);
      try {
        const resProfile = await api.get(`/users/profiles/${targetUsername}/`);
        setProfile(resProfile.data);
        
        if (authUser && resProfile.data.followers_usernames) {
          setIsFollowing(
            resProfile.data.followers_usernames
              .map(u => u.toLowerCase())
              .includes(authUser.username.toLowerCase())
          );
        }

        const resPosts = await api.get(`/posts/feed/?username=${targetUsername}`);
        const dataPosts = Array.isArray(resPosts.data) ? resPosts.data : (resPosts.data.results || []);
        setPosts(dataPosts);

        // Fetch Reels
        try {
          const resReels = await api.get('/reels/');
          const dataReels = Array.isArray(resReels.data) ? resReels.data : (resReels.data.results || []);
          const userReels = dataReels.filter(r => r.username.toLowerCase() === targetUsername.toLowerCase());
          setReels(userReels);
        } catch (reelErr) {
          console.error("Failed to load reels inside profile", reelErr);
        }

        // Fetch saved posts if own profile
        if (isOwnProfile) {
          setLoadingSaved(true);
          const resSaved = await api.get('/posts/feed/?feed=saved');
          const dataSaved = Array.isArray(resSaved.data) ? resSaved.data : (resSaved.data.results || []);
          setSavedPosts(dataSaved);

          try {
            const resSavedReels = await api.get('/reels/?feed=saved');
            const dataSavedReels = Array.isArray(resSavedReels.data) ? resSavedReels.data : (resSavedReels.data.results || []);
            setSavedReels(dataSavedReels);
          } catch (reelErr) {
            console.error("Failed to load saved reels inside profile", reelErr);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile data", err);
      } finally {
        setLoading(false);
        setLoadingSaved(false);
      }
    };

    if (isAuthenticated) {
      loadProfileData();
    }
  }, [targetUsername, authUser, isAuthenticated]);

  const handleFollow = async () => {
    if (!targetUsername) return;
    try {
      const res = await api.post(`/users/profiles/${targetUsername}/follow/`);
      setIsFollowing(res.data.status === 'followed');
      setProfile(prev => prev ? {
        ...prev,
        followers_count: res.data.status === 'followed' ? prev.followers_count + 1 : prev.followers_count - 1
      } : null);
    } catch (err) {
      console.error("Failed to toggle follow", err);
    }
  };

  const handleBlock = async () => {
    if (!targetUsername) return;
    try {
      const res = await api.post(`/users/profiles/${targetUsername}/block/`);
      setIsBlocked(res.data.status === 'blocked');
      if (res.data.status === 'blocked') setIsFollowing(false);
    } catch (err) {
      console.error("Failed to toggle block", err);
    }
  };

  const handleOpenPostDetails = async (post) => {
    setSelectedPost(post);
    setPostComments([]);
    setNewPostCommentText('');
    setLoadingCommentsPost(true);
    try {
      const res = await api.get(`/posts/comments/?post=${post.id}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setPostComments(data);
    } catch (err) {
      console.error("Failed to load post comments", err);
    } finally {
      setLoadingCommentsPost(false);
    }
  };

  const handleAddPostComment = async (e) => {
    e.preventDefault();
    if (!newPostCommentText.trim() || !selectedPost) return;
    try {
      const res = await api.post('/posts/comments/', {
        post: selectedPost.id,
        content: newPostCommentText.trim()
      });
      
      // Append the comment locally
      setPostComments(prev => [...prev, res.data]);
      setNewPostCommentText('');
      
      // Increment local count in selectedPost and within posts/savedPosts states
      const updatedCommentsCount = (selectedPost.comments_count || 0) + 1;
      setSelectedPost(prev => ({ ...prev, comments_count: updatedCommentsCount }));
      
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: updatedCommentsCount } : p));
      setSavedPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: updatedCommentsCount } : p));
    } catch (err) {
      console.error("Failed to add comment to post", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/feed/${postId}/`);
      
      // Filter out of state lists
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
      
      // Close modal
      setSelectedPost(null);
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center text-slate-100">
        <div className="w-8 h-8 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center text-slate-100">
        <span className="text-sm font-black text-cyber-pink uppercase tracking-wider">Profile Not Found</span>
      </div>
    );
  }

  const profileUser = {
    username: targetUsername,
    avatarUrl: getAvatarUrl(profile.avatar),
    avatarInitial: targetUsername?.[0]?.toUpperCase() || '?',
    cover: FALLBACK_COVER,
    profession: profile.profession || 'Nexora Member',
    bio: profile.bio || 'Welcome to my Nexora profile. Update your bio in Edit Profile.',
    location: profile.location || 'Nexora Grid',
    followers: profile.followers_count ?? 0,
    following: profile.following_count ?? 0,
    nodes: posts.length,
    isVerified: profile.is_verified || false,
  };

  const mockHighlights = [
    { title: "Travels", cover: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=120&q=80" },
    { title: "Design", cover: "https://images.unsplash.com/photo-1541462608141-275d72e4bc02?auto=format&fit=crop&w=120&q=80" },
    { title: "Fitness", cover: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=120&q=80" }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8 select-none">
      
      {/* Instagram Profile Header (Responsive Grid) */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start border-b border-obsidian-border/50 pb-8">
        
        {/* Left Column: Avatar */}
        <div className="flex-shrink-0 relative">
          <div className="p-1 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] shadow-lg">
            {profileUser.avatarUrl ? (
              <img
                src={profileUser.avatarUrl}
                alt="Avatar"
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-obsidian object-cover bg-obsidian-card"
              />
            ) : (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-obsidian bg-slate-700 flex items-center justify-center text-5xl font-black text-white">
                {profileUser.avatarInitial}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions, Stats & Bio */}
        <div className="flex-1 flex flex-col gap-5 w-full">
          
          {/* Row 1: Username & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left justify-center sm:justify-start">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">@{profileUser.username}</h2>
              {profileUser.isVerified && (
                <CheckCircle2 className="w-5 h-5 text-[#0095F6] fill-white" />
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => navigate('/edit-profile')}
                    className="px-6 py-2 rounded-xl bg-obsidian-light hover:bg-obsidian-hover border border-obsidian-border text-xs font-bold text-white cursor-pointer transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-2 rounded-xl border border-obsidian-border bg-obsidian-light hover:bg-obsidian-hover text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-4.5 h-4.5" />
                  </button>
                </>
              ) : (
                <>
                  <CyberButton
                    onClick={handleFollow}
                    variant={isFollowing ? 'outline' : 'pink'}
                    className="text-[10px] font-black px-5 py-2"
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </CyberButton>
                  <button
                    onClick={handleBlock}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isBlocked
                        ? 'bg-cyber-pink/20 border-cyber-pink text-cyber-pink'
                        : 'bg-obsidian-light border-obsidian-border text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Row 2: Stats (Desktop/Tablet View) */}
          <div className="hidden sm:flex gap-10 items-center justify-start text-sm">
            <div>
              <span className="font-bold text-white text-base mr-1">{profileUser.nodes}</span>
              <span className="text-slate-400 font-semibold">posts</span>
            </div>
            <div className="cursor-pointer hover:opacity-85 transition-opacity" onClick={() => openFollowModal('followers')}>
              <span className="font-bold text-white text-base mr-1">{profileUser.followers}</span>
              <span className="text-slate-400 font-semibold">followers</span>
            </div>
            <div className="cursor-pointer hover:opacity-85 transition-opacity" onClick={() => openFollowModal('following')}>
              <span className="font-bold text-white text-base mr-1">{profileUser.following}</span>
              <span className="text-slate-400 font-semibold">following</span>
            </div>
          </div>

          {/* Row 3: Bio Information */}
          <div className="flex flex-col gap-2.5 text-center sm:text-left">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-cyber-pink uppercase tracking-wider">
                {profileUser.profession}
              </span>
              <p className="text-slate-200 text-xs md:text-sm leading-relaxed max-w-xl mx-auto sm:mx-0">
                {profileUser.bio}
              </p>
            </div>
            
            {profileUser.location && (
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                <MapPin className="w-3.5 h-3.5" /> {profileUser.location}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Stats Row (Mobile Only View) */}
      <div className="flex sm:hidden justify-around border-y border-obsidian-border/50 py-3 text-center text-xs">
        <div className="flex flex-col">
          <span className="font-black text-white text-sm">{profileUser.nodes}</span>
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px] mt-0.5">posts</span>
        </div>
        <div className="flex flex-col cursor-pointer" onClick={() => openFollowModal('followers')}>
          <span className="font-black text-white text-sm">{profileUser.followers}</span>
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px] mt-0.5">followers</span>
        </div>
        <div className="flex flex-col cursor-pointer" onClick={() => openFollowModal('following')}>
          <span className="font-black text-white text-sm">{profileUser.following}</span>
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px] mt-0.5">following</span>
        </div>
      </div>

      {/* Instagram 4-Tab Switcher grid */}
      <div className="flex justify-around border-b border-obsidian-border/50">
        {[
          { id: 'posts', label: 'POSTS', icon: Grid },
          { id: 'reels', label: 'REELS', icon: Play },
          { id: 'saved', label: 'SAVED', icon: Bookmark },
          { id: 'tagged', label: 'TAGGED', icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-4 border-t -mt-[1px] transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-white text-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[9px] md:text-[10px] tracking-widest uppercase font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="py-4">
        {activeTab === 'posts' && (
          posts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs font-semibold uppercase tracking-widest">
              No Posts Yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ opacity: 0.85 }}
                  onClick={() => handleOpenPostDetails(post)}
                  className="aspect-square overflow-hidden bg-obsidian-card relative group cursor-pointer border border-obsidian-border"
                >
                  {post.media && post.media.length > 0 ? (
                    <img src={getMediaUrl(post.media[0].file)} alt="Post" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full p-3 flex flex-col justify-between bg-obsidian-light/20 text-slate-400">
                      <p className="text-[10px] line-clamp-4">{post.caption}</p>
                      <span className="text-[8px] font-black uppercase text-cyber-pink">Text Post</span>
                    </div>
                  )}

                  {/* Top-Right Music Icon Indicator */}
                  {post.music_title && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-cyber-cyan border border-white/10 z-10 shadow-lg">
                      <Music className="w-3 h-3 animate-pulse" />
                    </div>
                  )}

                  {/* Hover stats overlays */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity duration-150 p-2 text-center">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs font-bold text-white"><Heart className="w-4.5 h-4.5 fill-white text-white" /> {post.likes_count}</span>
                      <span className="flex items-center gap-1 text-xs font-bold text-white"><MessageCircle className="w-4.5 h-4.5 fill-white text-white" /> {post.comments_count}</span>
                    </div>
                    {post.music_title && (
                      <span className="text-[9px] font-semibold text-cyber-cyan truncate max-w-full flex items-center gap-1 bg-cyber-cyan/10 border border-cyber-cyan/30 px-2 py-0.5 rounded-full mt-1">
                        <Music className="w-2.5 h-2.5 text-cyber-cyan shrink-0" />
                        <span className="truncate max-w-[80px]">{post.music_title}</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {activeTab === 'reels' && (
          reels.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs font-semibold uppercase tracking-widest">
              No Reels Yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {reels.map((reel) => (
                <motion.div
                  key={reel.id}
                  whileHover={{ opacity: 0.85 }}
                  onClick={() => navigate('/reels')}
                  className="aspect-[9/16] overflow-hidden bg-obsidian-card relative group cursor-pointer border border-obsidian-border rounded-xl"
                >
                  <video 
                    src={getMediaUrl(reel.video)} 
                    className="w-full h-full object-cover" 
                    muted 
                    playsInline 
                  />
                  
                  {/* Play Overlay Icon */}
                  <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 z-10 shadow-lg">
                    <Play className="w-3 h-3 fill-white text-white" />
                  </div>

                  {/* Hover stats overlays */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity duration-150 p-2 text-center">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs font-bold text-white"><Heart className="w-4.5 h-4.5 fill-white text-white" /> {reel.likes_count}</span>
                      <span className="flex items-center gap-1 text-xs font-bold text-white"><MessageCircle className="w-4.5 h-4.5 fill-white text-white" /> {reel.comments_count}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {activeTab === 'saved' && (
          !isOwnProfile ? (
            <div className="text-center py-16 text-slate-500 text-xs font-semibold uppercase tracking-widest">
              Saved items are secure & private
            </div>
          ) : loadingSaved ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Saved Sub-Tabs Switcher */}
              <div className="flex gap-6 border-b border-obsidian-border/50 pb-2 justify-center sm:justify-start">
                <button
                  onClick={() => setSavedActiveSubTab('posts')}
                  className={`text-[10px] tracking-widest font-black uppercase pb-1.5 border-b-2 transition-all cursor-pointer ${
                    savedActiveSubTab === 'posts'
                      ? 'border-cyber-pink text-white font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Saved Posts ({savedPosts.length})
                </button>
                <button
                  onClick={() => setSavedActiveSubTab('reels')}
                  className={`text-[10px] tracking-widest font-black uppercase pb-1.5 border-b-2 transition-all cursor-pointer ${
                    savedActiveSubTab === 'reels'
                      ? 'border-cyber-pink text-white font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Saved Reels ({savedReels.length})
                </button>
              </div>

              {savedActiveSubTab === 'posts' ? (
                savedPosts.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs font-semibold uppercase tracking-widest">
                    No Saved Posts Yet
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {savedPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        whileHover={{ opacity: 0.85 }}
                        onClick={() => handleOpenPostDetails(post)}
                        className="aspect-square overflow-hidden bg-obsidian-card relative group cursor-pointer border border-obsidian-border"
                      >
                        {post.media && post.media.length > 0 ? (
                          <img src={getMediaUrl(post.media[0].file)} alt="Post" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full p-3 flex flex-col justify-between bg-obsidian-light/20 text-slate-400">
                            <p className="text-[10px] line-clamp-4">{post.caption}</p>
                            <span className="text-[8px] font-black uppercase text-cyber-pink">Text Post</span>
                          </div>
                        )}

                        {post.music_title && (
                          <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-cyber-cyan border border-white/10 z-10 shadow-lg">
                            <Music className="w-3 h-3 animate-pulse" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity duration-150 p-2 text-center">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs font-bold text-white"><Heart className="w-4.5 h-4.5 fill-white text-white" /> {post.likes_count}</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-white"><MessageCircle className="w-4.5 h-4.5 fill-white text-white" /> {post.comments_count}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              ) : (
                savedReels.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs font-semibold uppercase tracking-widest">
                    No Saved Reels Yet
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {savedReels.map((reel) => (
                      <motion.div
                        key={reel.id}
                        whileHover={{ opacity: 0.85 }}
                        onClick={() => navigate(`/reels?reel=${reel.id}`)}
                        className="aspect-[9/16] overflow-hidden bg-obsidian-card relative group cursor-pointer border border-obsidian-border rounded-xl"
                      >
                        <video 
                          src={getMediaUrl(reel.video)} 
                          className="w-full h-full object-cover" 
                          muted 
                          playsInline 
                        />
                        
                        <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 z-10 shadow-lg">
                          <Play className="w-3 h-3 fill-white text-white" />
                        </div>

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity duration-150 p-2 text-center">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs font-bold text-white"><Heart className="w-4.5 h-4.5 fill-white text-white" /> {reel.likes_count || 0}</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-white"><MessageCircle className="w-4.5 h-4.5 fill-white text-white" /> {reel.comments_count || 0}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              )}
            </div>
          )
        )}

        {activeTab === 'tagged' && (
          <div className="text-center py-16 text-slate-500 text-xs font-semibold uppercase tracking-widest">
            No tagged photos of @{profileUser.username}
          </div>
        )}
      </div>

      {/* Followers / Following Modal overlay */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-obsidian-card border border-obsidian-border rounded-2xl overflow-hidden shadow-glass flex flex-col max-h-[400px]"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-obsidian-border">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {modalType === 'followers' ? 'Followers' : 'Following'}
                </span>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest px-3 py-1 bg-obsidian-light rounded-lg cursor-pointer hover:bg-obsidian-hover transition-colors"
                >
                  Close
                </button>
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {modalLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : modalUsers.length > 0 ? (
                  modalUsers.map((u, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-obsidian-light/20 transition-all cursor-pointer"
                      onClick={() => {
                        setModalOpen(false);
                        navigate(`/profile/${u.username}`);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={getAvatarUrl(u.avatar)}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full object-cover border border-obsidian-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-700 border border-obsidian-border flex items-center justify-center text-xs font-bold text-white uppercase">
                            {u.username?.[0] || '?'}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">@{u.username}</span>
                          <span className="text-[9px] text-slate-500">{u.profession || 'Nexora Member'}</span>
                        </div>
                      </div>
                      
                      <span className="text-[8px] font-black uppercase tracking-wider text-cyber-pink bg-cyber-pink/10 border border-cyber-pink/20 px-2 py-1 rounded">
                        View
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    No {modalType} yet
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal Overlay */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] p-3 md:p-6 backdrop-blur-sm forced-dark">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl h-[90vh] md:h-[85vh] max-h-[800px] bg-obsidian-card border border-obsidian-border rounded-3xl overflow-hidden shadow-glass flex flex-col md:flex-row animate-fade-in"
            >
              {/* Left Panel: Media Player / Content */}
              <div className="w-full md:flex-1 h-[35vh] min-h-[220px] md:h-full md:min-h-0 bg-black flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-obsidian-border/50 shrink-0 md:shrink animate-fade-in">
                {selectedPost.media && selectedPost.media.length > 0 ? (
                  selectedPost.media[0].file_type === 'video' ? (
                    <video
                      src={getMediaUrl(selectedPost.media[0].file)}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={getMediaUrl(selectedPost.media[0].file)}
                      alt="Post Media"
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="w-full h-full p-8 flex flex-col justify-center items-center bg-gradient-to-br from-obsidian-light/30 via-obsidian/40 to-cyber-pink/5 text-slate-300">
                    <p className="text-sm md:text-base text-center italic font-medium leading-relaxed max-w-md">
                      "{selectedPost.caption}"
                    </p>
                  </div>
                )}
                
                {/* Mobile Close Button Overlay */}
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 left-4 md:hidden p-2.5 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-all active:scale-95 z-20 shadow-lg border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Right Panel: Info, Comments and Comment Form */}
              <div className="w-full md:w-[420px] flex flex-col flex-1 md:flex-none min-h-0 bg-[#0b0c10]/95 md:h-full">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-border/50 shrink-0">
                  <div className="flex items-center gap-3">
                    {selectedPost.avatar ? (
                      <img
                        src={getAvatarUrl(selectedPost.avatar)}
                        alt={selectedPost.username}
                        className="w-8 h-8 rounded-full object-cover border border-obsidian-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-obsidian-border flex items-center justify-center text-xs font-bold text-white uppercase">
                        {selectedPost.username?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white">@{selectedPost.username}</span>
                        {selectedPost.is_verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-white" />
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {new Date(selectedPost.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delete post action if owner */}
                    {(isOwnProfile || selectedPost.username?.toLowerCase() === authUser?.username?.toLowerCase()) && (
                      <button
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-obsidian-light transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="px-4 py-3 border-b border-obsidian-border/50 bg-obsidian-light/5 shrink-0 flex flex-col gap-2">
                  {selectedPost.caption && (
                    <p className="text-xs text-slate-200 leading-relaxed max-h-[80px] overflow-y-auto pr-1">
                      {selectedPost.caption}
                    </p>
                  )}
                  
                  {/* Music badge */}
                  {selectedPost.music_title && (
                    <div className="flex items-center gap-2 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-xl px-3 py-1.5 self-start max-w-full">
                      <Music className="w-3 h-3 text-cyber-cyan animate-pulse shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-[9px] font-bold truncate">{selectedPost.music_title}</span>
                        <span className="text-slate-400 text-[8px] truncate">{selectedPost.music_artist}</span>
                      </div>
                    </div>
                  )}

                  {/* Likes and comments count summary */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 border-t border-obsidian-border/30 pt-2">
                    <span className="flex items-center gap-1 text-white">
                      <Heart className="w-3.5 h-3.5 text-cyber-pink fill-cyber-pink" />
                      {selectedPost.likes_count} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-cyber-cyan" />
                      {selectedPost.comments_count} comments
                    </span>
                  </div>
                </div>

                {/* Comments List (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0 bg-black/10">
                  {loadingCommentsPost ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : postComments.length > 0 ? (
                    postComments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 items-start animate-fade-in">
                        {comment.avatar ? (
                          <img
                            src={getAvatarUrl(comment.avatar)}
                            alt={comment.username}
                            className="w-8 h-8 rounded-full object-cover border border-obsidian-border shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-obsidian-border bg-slate-700 flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0">
                            {comment.username?.[0] || '?'}
                          </div>
                        )}
                        <div className="flex flex-col flex-1 bg-obsidian-light/10 border border-obsidian-border/30 p-2.5 rounded-2xl">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-white hover:underline cursor-pointer">
                              @{comment.username}
                            </span>
                            <span className="text-[8px] text-slate-500">
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageCircle className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">No comments yet</p>
                    </div>
                  )}
                </div>

                {/* Comment Form (Sticky Bottom) */}
                <form
                  onSubmit={handleAddPostComment}
                  className="p-3 border-t border-obsidian-border/50 bg-[#0b0c10] flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={newPostCommentText}
                    onChange={(e) => setNewPostCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-obsidian-light/35 border border-obsidian-border/60 hover:border-obsidian-border focus:border-cyber-pink/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newPostCommentText.trim()}
                    className="px-4 py-2 rounded-xl bg-cyber-pink hover:bg-cyber-pink-hover disabled:opacity-40 disabled:hover:bg-cyber-pink text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-neon-pink"
                  >
                    Post
                  </button>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserProfile;
