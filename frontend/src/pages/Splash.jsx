import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Splash = () => {
  const navigate = useNavigate();
  const [statusText, setStatusText] = useState('Verifying active session...');

  const statuses = [
    'Verifying active session...',
    'Syncing timeline feeds...',
    'Loading connections...',
    'Welcome to Nexora'
  ];

  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-obsidian relative overflow-hidden">
      {/* Background glow node */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyber-pink/5 blur-[100px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        className="text-center z-10 flex flex-col items-center gap-6"
      >
        <div className="p-8 rounded-3xl border border-obsidian-border bg-obsidian-card shadow-glass">
          <h1 className="text-6xl font-black italic tracking-tight select-none bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] bg-clip-text text-transparent px-8 py-4">
            Nexora
          </h1>
        </div>

        <div className="flex flex-col gap-2.5 items-center mt-6">
          <div className="w-48 h-1 bg-obsidian-light rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ left: '-100%' }}
              animate={{ left: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-cyber-pink to-transparent"
            />
          </div>
          <span className="text-[10px] md:text-xs font-black tracking-widest text-slate-400 uppercase mt-2">
            {statusText}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Splash;
