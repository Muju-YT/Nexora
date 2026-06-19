import React from 'react';
import { motion } from 'framer-motion';

const CyberButton = ({ children, onClick, type = "button", variant = "violet", className = "" }) => {
  const themes = {
    // Premium clean blue (Instagram Style CTA primary action)
    violet: "bg-[#0095F6] hover:bg-[#1877F2] border-transparent text-always-white font-semibold shadow-sm",
    // Nexora Brand Gradient premium button
    pink: "bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] hover:opacity-95 border-transparent text-always-white font-semibold",
    // Minimal standard outline/secondary button (Instagram Edit Profile style)
    outline: "bg-obsidian-light/10 border-obsidian-border hover:bg-obsidian-light/35 text-slate-100 font-semibold",
    // Clean default container button
    cyan: "bg-obsidian-card hover:bg-obsidian-light border-obsidian-border text-slate-200 hover:text-white font-semibold"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      type={type}
      onClick={onClick}
      className={`px-5 py-2 rounded-xl border text-xs md:text-sm transition-all duration-200 cursor-pointer ${themes[variant] || themes.violet} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default CyberButton;
