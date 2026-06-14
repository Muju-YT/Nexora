import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CyberInput from '../components/CyberInput';
import CyberButton from '../components/CyberButton';
import GlowCard from '../components/GlowCard';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-obsidian">
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyber-pink/5 blur-[120px] -top-20 -right-20 animate-pulse" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyber-violet/5 blur-[120px] -bottom-20 -left-20 animate-pulse" />

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
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-3">Trouble Logging In?</p>
        </div>

        <GlowCard hoverable={false} className="p-8">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <span className="text-xs text-slate-400 leading-relaxed text-center px-2">
                Enter your email address below and we'll send you a secure link to reset your password and recover your account.
              </span>

              <CyberInput 
                label="Email Address" 
                type="email"
                placeholder="name@domain.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />

              <CyberButton 
                type="submit" 
                variant="pink" 
                className="mt-2 w-full py-3"
              >
                Send Reset Link
              </CyberButton>

              <Link to="/login" className="text-xs font-bold text-center text-slate-400 hover:text-white uppercase mt-3 transition-colors">
                Back to Login
              </Link>
            </form>
          ) : (
            <div className="flex flex-col gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/20 flex items-center justify-center mx-auto text-cyber-emerald text-2xl font-black">
                ✓
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-black tracking-wider text-white">LINK DISPATCHED</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A reset link has been successfully dispatched to <span className="text-white font-semibold">{email}</span>. Click the link to set your new password.
                </p>
              </div>
              <CyberButton 
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full mt-4"
              >
                Back to Login
              </CyberButton>
            </div>
          )}
        </GlowCard>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
