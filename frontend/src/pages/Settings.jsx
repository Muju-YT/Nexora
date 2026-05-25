import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, ShieldCheck, LogOut, User, Bell, Key, Bookmark } from 'lucide-react';
import useAuthStore from '../store/authStore';
import GlowCard from '../components/GlowCard';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme, logout } = useAuthStore();

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 select-none">
      
      {/* Settings Navigation Header */}
      <div className="flex items-center gap-3 mb-6 bg-obsidian-card p-4 rounded-2xl border border-obsidian-border shadow-glass">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 rounded-full hover:bg-obsidian-light text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Settings</h2>
          <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Manage your preferences & profile parameters</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        
        {/* Appearance Control */}
        <GlowCard hoverable={false} className="p-5 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Appearance</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Configure light or dark styling</span>
            </div>
          </div>
          <button
            onClick={handleToggleTheme}
            className="px-4 py-2 rounded-xl border border-obsidian-border bg-obsidian-light hover:bg-[#262626] text-xs font-bold text-white transition-colors cursor-pointer"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </GlowCard>

        {/* Saved Posts */}
        <GlowCard hoverable={false} className="p-5 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors" onClick={() => navigate('/saved')}>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-obsidian border border-obsidian-border text-slate-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Saved Posts</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">View your bookmarked posts</span>
            </div>
          </div>
          <span className="text-slate-500 text-xs">➔</span>
        </GlowCard>

        {/* Security protocol */}
        <GlowCard hoverable={false} className="p-5 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyber-pink/10 border border-cyber-pink/20 text-[#0095F6]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Privacy & Safety</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Secure session accounts active</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-[#0095F6] bg-[#0095F6]/10 border border-[#0095F6]/20 px-2.5 py-1.5 rounded-lg uppercase tracking-wider">
            Verified
          </span>
        </GlowCard>

        {/* Account and preferences mock links for extra premium feeling */}
        <GlowCard hoverable={false} className="p-5 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors" onClick={() => navigate('/edit-profile')}>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-obsidian border border-obsidian-border text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Account Details</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Update personal email & usernames</span>
            </div>
          </div>
          <span className="text-slate-500 text-xs">➔</span>
        </GlowCard>

        {/* Logout button triggers */}
        <button 
          onClick={logout}
          className="w-full flex items-center justify-between p-5 rounded-2xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-500">Log Out</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Disconnect from your social feed</span>
            </div>
          </div>
          <span className="text-xs font-black text-red-500 uppercase tracking-widest">Sign Out</span>
        </button>

      </div>
    </div>
  );
};

export default Settings;
