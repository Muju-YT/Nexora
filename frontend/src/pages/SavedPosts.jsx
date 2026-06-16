import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ArrowLeft, Music, Heart, MessageCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { getMediaUrl } from '../utils/url';
import useAuthStore from '../store/authStore';

const SavedPosts = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedItems = async () => {
      try {
        setLoading(true);
        const resPosts = await api.get('/posts/feed/?feed=saved');
        const dataPosts = Array.isArray(resPosts.data) ? resPosts.data : (resPosts.data.results || []);
        setSavedPosts(dataPosts);

        try {
          const resReels = await api.get('/reels/?feed=saved');
          const dataReels = Array.isArray(resReels.data) ? resReels.data : (resReels.data.results || []);
          setSavedReels(dataReels);
        } catch (reelErr) {
          console.error("Failed to load saved reels in settings page", reelErr);
        }
      } catch (err) {
        console.error("Failed to load saved items", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchSavedItems();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center text-slate-100 bg-grid-cyber">
        <span className="text-sm font-black text-cyber-violet animate-pulse uppercase tracking-wider">Opening Saved Vault...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 rounded-full border border-white/5 bg-obsidian-card text-slate-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-black tracking-widest text-white uppercase">Saved Dispatches</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="w-4 h-4 text-cyber-cyan" />
        <span className="text-xs font-black tracking-widest text-white uppercase">Vault Archive</span>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex gap-6 border-b border-white/5 pb-3 mb-6 select-none">
        <button
          onClick={() => setActiveSubTab('posts')}
          className={`text-xs tracking-widest font-black uppercase pb-1.5 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'posts'
              ? 'border-cyber-pink text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Saved Posts ({savedPosts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('reels')}
          className={`text-xs tracking-widest font-black uppercase pb-1.5 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'reels'
              ? 'border-cyber-pink text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Saved Reels ({savedReels.length})
        </button>
      </div>

      {activeSubTab === 'posts' ? (
        savedPosts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {savedPosts.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/')}
                className="aspect-square rounded-xl overflow-hidden border border-white/5 cursor-pointer bg-obsidian-card relative group"
              >
                {item.media && item.media.length > 0 ? (
                  <img src={getMediaUrl(item.media[0].file)} alt="Saved dispatch" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-obsidian-border/10 text-slate-400">
                    <p className="text-xs line-clamp-4">{item.caption}</p>
                    <span className="text-[9px] font-black uppercase tracking-wider text-cyber-violet">Text Module</span>
                  </div>
                )}

                {/* Top-Right Music Icon Indicator */}
                {item.music_title && (
                  <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-cyber-cyan border border-white/10 z-10 shadow-lg animate-pulse">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Hover stats overlays */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity duration-150 p-2 text-center">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs font-bold text-white"><Heart className="w-4.5 h-4.5 fill-white text-white" /> {item.likes_count}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-white"><MessageCircle className="w-4.5 h-4.5 fill-white text-white" /> {item.comments_count}</span>
                  </div>
                  {item.music_title && (
                    <span className="text-[9px] font-semibold text-cyber-cyan truncate max-w-full flex items-center gap-1 bg-cyber-cyan/10 border border-cyber-cyan/30 px-2 py-0.5 rounded-full mt-1">
                      <Music className="w-2.5 h-2.5 text-cyber-cyan shrink-0" />
                      <span className="truncate max-w-[80px]">{item.music_title}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/5 rounded-xl bg-obsidian-card/25 flex flex-col items-center gap-3">
            <Bookmark className="w-8 h-8 text-slate-600" />
            <span className="text-xs text-slate-500">Your saved posts vault is empty.</span>
          </div>
        )
      ) : (
        savedReels.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {savedReels.map((reel) => (
              <motion.div
                key={reel.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/reels?reel=${reel.id}`)}
                className="aspect-[9/16] rounded-xl overflow-hidden border border-white/5 cursor-pointer bg-obsidian-card relative group"
              >
                <video 
                  src={getMediaUrl(reel.video)} 
                  className="w-full h-full object-cover" 
                  muted 
                  playsInline 
                />

                {/* Play Overlay Icon */}
                <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 z-10 shadow-lg animate-pulse">
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                </div>

                {/* Hover stats overlays */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity duration-150 p-2 text-center">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs font-bold text-white"><Heart className="w-4.5 h-4.5 fill-white text-white" /> {reel.likes_count || 0}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-white"><MessageCircle className="w-4.5 h-4.5 fill-white text-white" /> {reel.comments_count || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/5 rounded-xl bg-obsidian-card/25 flex flex-col items-center gap-3">
            <Bookmark className="w-8 h-8 text-slate-600" />
            <span className="text-xs text-slate-500">Your saved reels vault is empty.</span>
          </div>
        )
      )}
    </div>
  );
};

export default SavedPosts;

