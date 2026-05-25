import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

// Common components
import FloatNavbar from './components/FloatNavbar';

// Pages
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import OTPVerification from './pages/OTPVerification';
import HomeFeed from './pages/HomeFeed';
import Explore from './pages/Explore';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import ChatList from './pages/ChatList';
import ChatWindow from './pages/ChatWindow';
import StoriesViewer from './pages/StoriesViewer';
import ReelsFeed from './pages/ReelsFeed';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import CreatePost from './pages/CreatePost';
import CreateStory from './pages/CreateStory';
import Settings from './pages/Settings';
import SavedPosts from './pages/SavedPosts';
import AdminDashboard from './pages/AdminDashboard';

import useAuthStore from './store/authStore';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    if (window.location.pathname === '/') {
      return <Login />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian text-slate-100 bg-grid-cyber">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyber-violet border-t-transparent animate-spin" />
          <span className="text-xs font-black text-cyber-violet animate-pulse uppercase tracking-wider">Establishing Neural Link...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Animated route wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, loadSession, theme, setTheme } = useAuthStore();

  useEffect(() => {
    // Clear previous sessions to always present the login page first on link load
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    useAuthStore.setState({ user: null, isAuthenticated: false, loading: false });
  }, []);

  // Sync theme class with document element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Hide nav on onboarding/auth/splash pages
  const hideNavPaths = ['/splash', '/onboarding', '/login', '/register', '/forgot-password', '/verify-otp'];
  const showNav = !hideNavPaths.includes(location.pathname);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen bg-obsidian text-slate-100 bg-grid-cyber transition-colors duration-300 ${showNav ? 'md:pl-64 pb-20 md:pb-0' : ''}`}>
      
      {/* Floating Theme Switcher visible ONLY on Onboarding/Auth Screens where sidebar is hidden */}
      {!showNav && (
        <button
          onClick={toggleTheme}
          className="fixed top-6 right-6 p-3 rounded-full border border-obsidian-border bg-obsidian-card backdrop-blur-xl shadow-glass hover:bg-obsidian-light/40 transition-all duration-200 z-[999] cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-400" />
          ) : (
            <Sun className="w-4 h-4 text-slate-400" />
          )}
        </button>
      )}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/splash" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          
          {/* Main Social routes */}
          <Route path="/" element={<ProtectedRoute><HomeFeed /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
          <Route path="/chat/:roomId" element={<ProtectedRoute><ChatWindow /></ProtectedRoute>} />
          <Route path="/story/:storyId" element={<ProtectedRoute><StoriesViewer /></ProtectedRoute>} />
          <Route path="/reels" element={<ProtectedRoute><ReelsFeed /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          <Route path="/create-story" element={<ProtectedRoute><CreateStory /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
      {showNav && <FloatNavbar />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
