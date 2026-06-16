import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Play, Compass, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { getMediaUrl } from '../utils/url';
import useAuthStore from '../store/authStore';

const Explore = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        setLoading(true);
        // Fetch posts from database
        const postsRes = await api.get('/posts/feed/');
        const postsData = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data.results || []);
        
        // Fetch reels from database
        const reelsRes = await api.get('/reels/');
        const reelsData = Array.isArray(reelsRes.data) ? reelsRes.data : (reelsRes.data.results || []);

        // Map posts
        const mappedPosts = postsData.map(p => ({
          id: `post-${p.id}`,
          originalId: p.id,
          username: p.username,
          caption: p.caption,
          image: p.media && p.media.length > 0 ? getMediaUrl(p.media[0].file) : "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80",
          likes: p.likes_count || 0,
          comments: p.comments_count || 0,
          is_reel: false
        }));

        // Map reels
        const mappedReels = reelsData.map(r => ({
          id: `reel-${r.id}`,
          originalId: r.id,
          username: r.username,
          caption: r.caption,
          image: r.video ? getMediaUrl(r.video) : "https://images.unsplash.com/photo-1541462608141-275d72e4bc02?auto=format&fit=crop&w=600&q=80",
          likes: r.likes_count || 0,
          comments: r.comments_count || 0,
          is_reel: true
        }));

        // Combine
        let combined = [...mappedPosts, ...mappedReels];

        // Sort by likes descending to reflect trending
        combined.sort((a, b) => b.likes - a.likes);

        // Fallback mocks if the database is empty
        if (combined.length === 0) {
          combined = [
            { id: 'mock-1', username: "alexa_travels", caption: "✨ Chasing sunrises in Greece! Still can't believe this view is real.", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80", likes: 12400, comments: 182, is_reel: false },
            { id: 'mock-2', username: "designer_marcus", caption: "🪐 Crafting the new Nexora mobile interface. Clean high-contrast glass.", image: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-futuristic-city-38999-large.mp4", likes: 8590, comments: 94, is_reel: true },
            { id: 'mock-3', username: "fit_lifestyle", caption: "⚡ Consistency is key! 5 AM workout done. Stop making excuses.", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80", likes: 19800, comments: 310, is_reel: false },
            { id: 'mock-4', username: "travel_blogger", caption: "🌴 Living the dream in Maldives. Save this for your next trip!", image: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-in-a-futuristic-city-31908-large.mp4", likes: 9200, comments: 145, is_reel: true },
            { id: 'mock-5', username: "nature_pics", caption: "🌲 Serene morning in the Swiss Alps. Breathe in that fresh air.", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80", likes: 11200, comments: 180, is_reel: false },
            { id: 'mock-6', username: "street_hustle", caption: "🌆 Neon streets of Tokyo. The city that never sleeps.", image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80", likes: 5400, comments: 62, is_reel: false }
          ];
        }

        // Apply responsive asymmetric layout grid classes
        const mappedWithClasses = combined.map((item, index) => {
          let className = "aspect-square";
          // Inject row-span / col-span for beautiful asymmetric layout
          if (index % 5 === 1) {
            className = "col-span-2 row-span-2 aspect-video md:aspect-auto h-full";
          }
          return {
            ...item,
            className
          };
        });

        setItems(mappedWithClasses);
      } catch (err) {
        console.error("Failed to load explore data", err);
        // Clean elegant mocks fallback
        setItems([
          { id: 'mock-1', username: "alexa_travels", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80", likes: 12400, comments: 182, is_reel: false, className: "aspect-square" },
          { id: 'mock-2', username: "designer_marcus", image: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-futuristic-city-38999-large.mp4", likes: 8590, comments: 94, is_reel: true, className: "col-span-2 row-span-2 aspect-video md:aspect-auto" },
          { id: 'mock-3', username: "fit_lifestyle", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80", likes: 19800, comments: 310, is_reel: false, className: "aspect-square" },
          { id: 'mock-4', username: "travel_blogger", image: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-in-a-futuristic-city-31908-large.mp4", likes: 9200, comments: 145, is_reel: true, className: "aspect-square" },
          { id: 'mock-5', username: "nature_pics", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80", likes: 11200, comments: 180, is_reel: false, className: "aspect-square" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchExploreData();
    }
  }, [isAuthenticated]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 select-none">
      
      {/* Top action header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-obsidian-card p-5 rounded-2xl border border-obsidian-border shadow-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyber-pink/10 text-cyber-pink border border-cyber-pink/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Explore</h2>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Discover trending posts across Nexora</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/reels')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-white" /> Watch Reels
        </button>
      </div>

      {/* Fake Search bar triggers */}
      <div className="relative flex items-center" onClick={() => navigate('/search')}>
        <Search className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
        <input 
          type="text" 
          placeholder="Search creators, hashtags, categories..."
          readOnly
          className="w-full pl-11 pr-4 py-3 bg-obsidian-card border border-obsidian-border rounded-xl text-xs md:text-sm text-slate-400 outline-none hover:border-slate-700 cursor-pointer transition-colors"
        />
      </div>

      {/* Loader */}
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center text-slate-800 dark:text-slate-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-cyber-pink animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading explore feed...</span>
          </div>
        </div>
      ) : (
        /* Asymmetric Responsive Masonry Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 auto-rows-max">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.is_reel) {
                  navigate(`/reels?reel=${item.originalId}`);
                } else {
                  // Direct navigation with anchor scroll
                  navigate(`/#post-${item.originalId}`);
                }
              }}
              className={`${item.className} relative rounded-2xl overflow-hidden border border-obsidian-border bg-obsidian-card cursor-pointer group shadow-sm flex items-center justify-center`}
            >
              {item.is_reel ? (
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
                  <video 
                    src={item.image} 
                    muted 
                    loop 
                    playsInline 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onMouseEnter={(e) => {
                      e.target.play().catch(err => console.log("Hover play blocked:", err));
                    }}
                    onMouseLeave={(e) => {
                      e.target.pause();
                    }}
                  />
                  <div className="absolute top-3.5 right-3.5 p-1.5 rounded-xl bg-black/55 border border-white/10 text-white z-10 shadow">
                    <Play className="w-3 h-3 fill-white" />
                  </div>
                </div>
              ) : (
                <img 
                  src={item.image} 
                  alt="Explore Grid" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              )}
              
              {/* Overlay statistics on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 z-10">
                <div className="flex items-center gap-1.5 text-white font-black">
                  <Heart className="w-5 h-5 fill-white" />
                  <span className="text-xs md:text-sm">{new Intl.NumberFormat().format(item.likes)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white font-black">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span className="text-xs md:text-sm">{new Intl.NumberFormat().format(item.comments)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
