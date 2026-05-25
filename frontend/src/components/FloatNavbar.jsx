import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, PlusSquare, Heart, MessageCircle, Film, Compass, Settings, Sun, Moon, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';

const FloatNavbar = () => {
  const navigate = useNavigate();
  const { 
    user, 
    theme, 
    setTheme, 
    logout, 
    unreadNotificationsCount, 
    unreadMessagesCount, 
    fetchUnreadCounts,
    isAuthenticated 
  } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCounts();
      const interval = setInterval(() => {
        fetchUnreadCounts();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return `http://127.0.0.1:8000${avatar}`;
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/explore", icon: Compass, label: "Explore" },
    { path: "/reels", icon: Film, label: "Reels" },
    { path: "/chats", icon: MessageCircle, label: "Messages" },
    { path: "/notifications", icon: Heart, label: "Notifications" },
    { path: "/create", icon: PlusSquare, label: "Create" },
    { path: "/profile", label: "Profile" }
  ];

  const profileAvatar = getAvatarUrl(user?.profile?.avatar);
  const profileInitial = user?.username?.[0]?.toUpperCase() || 'U';

  const renderProfileIcon = (isActive) => {
    if (profileAvatar) {
      return (
        <img
          src={profileAvatar}
          alt="Profile"
          className={`w-6 h-6 rounded-full object-cover border transition-all ${
            isActive ? 'border-cyber-pink scale-110 shadow-sm' : 'border-slate-500'
          }`}
        />
      );
    }
    return (
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white uppercase transition-all ${
          isActive 
            ? 'bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] scale-110' 
            : 'bg-slate-700'
        }`}
      >
        {profileInitial}
      </div>
    );
  };

  return (
    <>
      {/* DESKTOP SIDEBAR NAVIGATION (md and up) */}
      <div className="hidden md:flex fixed top-0 left-0 h-screen w-64 border-r border-obsidian-border bg-obsidian-card p-6 flex-col justify-between z-50">
        <div className="flex flex-col gap-8">
          {/* Script Brand Logo */}
          <div className="py-2">
            <h1 className="text-3xl font-bold tracking-tight italic select-none cursor-default bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] bg-clip-text text-transparent">
              Nexora
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-obsidian-light/60 text-white font-semibold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-obsidian-light/20"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label === "Profile" ? (
                      renderProfileIcon(isActive)
                    ) : (
                      <div className="relative">
                        <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-white' : ''}`} />
                        {item.label === "Notifications" && unreadNotificationsCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_#EF4444] block" style={{ transform: 'translate(25%, -25%)' }} />
                        )}
                        {item.label === "Notifications" && unreadNotificationsCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444] block" style={{ transform: 'translate(25%, -25%)' }} />
                        )}
                        {item.label === "Messages" && unreadMessagesCount > 0 && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#E1306C] text-[8px] font-black text-white flex items-center justify-center min-w-4.5 h-4.5 shadow-[0_0_8px_#E1306C]" style={{ transform: 'translate(35%, -35%)' }}>
                            {unreadMessagesCount}
                          </span>
                        )}
                      </div>
                    )}
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Theme and Account Switch Deck */}
        <div className="flex flex-col gap-1 border-t border-obsidian-border pt-4">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-4 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-100 hover:bg-obsidian-light/20 w-full text-left cursor-pointer transition-all duration-200"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-5 h-5 text-slate-400" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5 text-slate-400" />
                <span>Light Mode</span>
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-4 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-100 hover:bg-obsidian-light/20 w-full text-left cursor-pointer transition-all duration-200"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-4 px-4 py-2.5 rounded-xl font-medium text-sm text-red-500 hover:bg-red-500/5 w-full text-left cursor-pointer transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (default visible on mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-obsidian-border bg-obsidian-card/85 backdrop-blur-xl flex items-center justify-around z-50 px-2 pb-safe">
        {/* Render 5 core tabs similar to Instagram bottom bar */}
        {[
          { path: "/", icon: Home, label: "Home" },
          { path: "/search", icon: Search, label: "Search" },
          { path: "/create", icon: PlusSquare, label: "Create" },
          { path: "/reels", icon: Film, label: "Reels" },
          { path: "/profile", label: "Profile" }
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative p-2.5 rounded-xl transition-all duration-200 ${
                isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center">
                {item.label === "Profile" ? (
                  renderProfileIcon(isActive)
                ) : (
                  <item.icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`} />
                )}
                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-cyber-pink"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </>
  );
};

export default FloatNavbar;
