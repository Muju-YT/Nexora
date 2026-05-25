import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import CyberInput from '../components/CyberInput';
import CyberButton from '../components/CyberButton';
import GlowCard from '../components/GlowCard';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to Home Feed if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-obsidian">
      {/* Background glowing gradients */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-cyber-pink/5 blur-[120px] -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-cyber-violet/5 blur-[120px] -bottom-20 -right-20 animate-pulse" />

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black italic tracking-tight select-none bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] bg-clip-text text-transparent">
            Nexora
          </h1>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-3">Welcome Back</p>
        </div>

        <GlowCard hoverable={false} className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-cyber-pink/10 border border-cyber-pink/20 text-xs font-semibold text-cyber-pink tracking-wide">
                {error}
              </div>
            )}

            {loading && !email && (
              <div className="p-3.5 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/25 text-xs font-semibold text-cyber-cyan tracking-wide flex items-center justify-center gap-3 animate-pulse">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
                <span className="uppercase tracking-wider text-[10px] font-black">Restoring session... Welcome back!</span>
              </div>
            )}

            <CyberInput 
              label="Username or Email" 
              type="text"
              placeholder="username or email@domain.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />

            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[10px] md:text-xs font-black tracking-widest text-slate-400 uppercase">Password</span>
                <Link to="/forgot-password" className="text-xs text-cyber-cyan hover:underline font-bold">
                  Forgot?
                </Link>
              </div>
              <div className="relative w-full flex items-center">
                <CyberInput 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <CyberButton 
              type="submit" 
              variant="pink" 
              className="mt-2 w-full py-3"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </CyberButton>


            <span className="text-xs font-medium tracking-wide text-slate-400 text-center mt-3">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyber-pink hover:underline font-bold">
                Sign Up
              </Link>
            </span>
          </form>
        </GlowCard>
      </motion.div>
    </div>
  );
};

export default Login;
