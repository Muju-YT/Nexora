import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import CyberInput from '../components/CyberInput';
import CyberButton from '../components/CyberButton';
import GlowCard from '../components/GlowCard';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error, isAuthenticated } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Redirect to Home Feed if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(username, email, password, firstName, lastName);
    if (result.success) {
      alert(`Nexora Simulated System: OTP Dispatched! Verification code is: ${result.otp}`);
      navigate('/verify-otp');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-obsidian">
      {/* Background glowing elements */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyber-pink/5 blur-[120px] -top-20 -right-20 animate-pulse" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyber-violet/5 blur-[120px] -bottom-20 -left-20 animate-pulse" />

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black italic tracking-tight select-none bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] bg-clip-text text-transparent">
            Nexora
          </h1>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-3">Create New Account</p>
        </div>

        <GlowCard hoverable={false} className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-cyber-pink/10 border border-cyber-pink/20 text-xs font-semibold text-cyber-pink tracking-wide">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <CyberInput 
                label="First Name" 
                placeholder="Jane" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
              />
              <CyberInput 
                label="Last Name" 
                placeholder="Doe" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
              />
            </div>

            <CyberInput 
              label="Username" 
              placeholder="jane_doe" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />

            <CyberInput 
              label="Email Address" 
              type="email"
              placeholder="name@domain.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />

            <CyberInput 
              label="Password" 
              type="password" 
              placeholder="••••••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />

            <CyberButton 
              type="submit" 
              variant="pink" 
              className="mt-2 w-full py-3"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </CyberButton>

            <span className="text-xs font-medium tracking-wide text-slate-400 text-center mt-3">
              Already have an account?{' '}
              <Link to="/login" className="text-cyber-pink hover:underline font-bold">
                Log In
              </Link>
            </span>
          </form>
        </GlowCard>
      </motion.div>
    </div>
  );
};

export default Register;
