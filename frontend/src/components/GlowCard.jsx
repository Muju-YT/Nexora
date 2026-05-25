import React from 'react';
import { motion } from 'framer-motion';

const GlowCard = ({ children, className = "", onClick, hoverable = true }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-obsidian-card border border-obsidian-border rounded-2xl shadow-glass transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default GlowCard;
