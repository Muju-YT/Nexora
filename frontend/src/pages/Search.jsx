import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, CheckCircle2, Hash, ArrowLeft, User } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import GlowCard from '../components/GlowCard';

const Search = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [followedStatus, setFollowedStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return `${import.meta.env.VITE_API_URL}${avatar}`;
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/profiles/');
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        // Exclude currently logged-in user from the list
        const filtered = data.filter(p => p.username !== authUser?.username);
        setProfiles(filtered);

        // Initialize followedStatus dynamically
        if (authUser) {
          const initialStatus = {};
          filtered.forEach(p => {
            initialStatus[p.username] = p.followers_usernames?.includes(authUser.username) || false;
          });
          setFollowedStatus(initialStatus);
        }
      } catch (err) {
        console.error("Failed to fetch profiles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [authUser]);

  const toggleFollow = async (username) => {
    try {
      const res = await api.post(`/users/profiles/${username}/follow/`);
      setFollowedStatus(prev => ({
        ...prev,
        [username]: res.data.status === 'followed'
      }));
    } catch (err) {
      console.error("Failed to follow creator", err);
    }
  };

  const hashtags = [
    { tag: "#NexoraRedesign", count: "189.5K actions" },
    { tag: "#ThreadsMode", count: "123.2K actions" },
    { tag: "#ContentFirst", count: "98.1K actions" }
  ];

  const filteredUsers = profiles.filter(p => 
    p.username?.toLowerCase().includes(query.toLowerCase()) || 
    (p.profession && p.profession.toLowerCase().includes(query.toLowerCase())) ||
    (p.bio && p.bio.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 select-none">
      
      {/* Search Navigation Header */}
      <div className="flex items-center gap-3 bg-obsidian-card p-4 rounded-2xl border border-obsidian-border shadow-glass">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-obsidian-light text-slate-400 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 relative flex items-center">
          <SearchIcon className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search creators, bios, professions..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-obsidian border border-obsidian-border rounded-xl text-xs md:text-sm text-white outline-none focus:border-cyber-pink transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        
        {/* Render Users */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase px-1">People</span>
          
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u, idx) => (
              <GlowCard key={idx} hoverable={false} className="p-4 flex items-center justify-between">
                <div 
                  onClick={() => navigate(`/profile/${u.username}`)}
                  className="flex items-center gap-3.5 cursor-pointer"
                >
                  {u.avatar ? (
                    <img src={getAvatarUrl(u.avatar)} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-obsidian-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 border border-obsidian-border flex items-center justify-center text-sm font-bold text-white uppercase">
                      {u.username?.[0] || '?'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-xs md:text-sm font-bold text-white hover:underline">{u.username}</span>
                      {u.is_verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-white" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">{u.profession || 'Nexora Member'}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleFollow(u.username)}
                  className={`text-[9px] font-black uppercase px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    followedStatus[u.username]
                      ? "bg-transparent border-obsidian-border text-slate-400"
                      : "bg-[#0095F6] border-transparent text-white hover:bg-[#1877F2]"
                  }`}
                >
                  {followedStatus[u.username] ? "Following" : "Follow"}
                </button>
              </GlowCard>
            ))
          ) : (
            <span className="text-xs text-slate-500 px-1 font-semibold uppercase tracking-wider">No matching creators found.</span>
          )}
        </div>

        {/* Render Trends */}
        {!query && (
          <div className="flex flex-col gap-3 mt-3">
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase px-1">Trending Tags</span>
            <div className="flex flex-col gap-2.5">
              {hashtags.map((h, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate('/')}
                  className="p-3.5 rounded-xl border border-obsidian-border bg-obsidian-card hover:border-cyber-pink transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink">
                      <Hash className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{h.tag}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">{h.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
