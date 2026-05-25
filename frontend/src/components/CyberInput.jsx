import React from 'react';
import { motion } from 'framer-motion';

const CyberInput = ({ label, type = "text", placeholder, value, onChange, className = "", required = false }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-[10px] md:text-xs font-black tracking-widest text-slate-400 uppercase">{label}</span>}
      <motion.input
        whileFocus={{ scale: 1.002 }}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 bg-obsidian-card border border-obsidian-border rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:border-cyber-pink/50 transition-all duration-200 text-xs md:text-sm ${className}`}
      />
    </div>
  );
};

export default CyberInput;
