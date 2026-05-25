import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CyberButton from '../components/CyberButton';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "PREMIUM CONNECTIONS",
      description: "Step into a beautiful, content-first social space designed for your friends, standard timeline stories, and community circles.",
      accent: "pink"
    },
    {
      title: "VERTICAL REELS FEED",
      description: "Experience smooth fullscreen vertical scrolling reels, dynamic trending videos, and responsive interaction trays.",
      accent: "pink"
    },
    {
      title: "MESSENGER CHATS",
      description: "Enjoy zero latency instant messaging with active tags, online badges, typing indicators, and emoji reactions.",
      accent: "pink"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-obsidian relative overflow-hidden p-6 md:p-12">
      {/* Dynamic background node */}
      <div className="absolute w-[350px] h-[350px] rounded-full bg-cyber-pink/5 blur-[90px] top-10 right-10 animate-pulse" />

      <div className="flex justify-between items-center z-10">
        <span className="text-xl font-bold tracking-tight italic select-none bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] bg-clip-text text-transparent">
          Nexora
        </span>
        <button 
          onClick={() => navigate('/login')}
          className="text-xs font-bold tracking-wider text-slate-400 hover:text-white uppercase cursor-pointer transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="max-w-md mx-auto w-full z-10 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col gap-6"
          >
            <div className="h-64 rounded-2xl border border-obsidian-border bg-obsidian-card flex items-center justify-center relative overflow-hidden shadow-glass">
              {/* Neutral content first inside the slide container */}
              <div className="absolute inset-0 bg-[#000000]/10" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="w-32 h-32 rounded-full border border-dashed border-cyber-pink/20 opacity-60 flex items-center justify-center"
              >
                <div className="w-24 h-24 rounded-full border border-dotted border-cyber-pink/30 flex items-center justify-center" />
              </motion.div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <h2 className="text-2xl font-black tracking-wide text-white">
                {slides[currentSlide].title}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mt-8">
          {slides.map((_, index) => (
            <div 
              key={index} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "w-8 bg-cyber-pink" 
                  : "w-2 bg-obsidian-light"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between z-10">
        <span className="text-[10px] md:text-xs font-black tracking-widest text-slate-500 uppercase">
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <CyberButton 
          variant="pink"
          onClick={handleNext}
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
        </CyberButton>
      </div>
    </div>
  );
};

export default Onboarding;
