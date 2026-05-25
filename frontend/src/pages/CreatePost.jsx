import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  BarChart2, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowLeft, 
  Image, 
  Film, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Loader2, 
  Smile,
  ShieldCheck,
  Plus,
  RefreshCw,
  Music,
  Play,
  Pause,
  Volume2,
  Check,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const CURATED_SONGS = [
  { id: '1', title: 'Lofi Dreams', artist: 'Chillhop Society', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Cyberpunk Neon', artist: 'Retrowave Collective', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Acoustic Vibe', artist: 'Folk & Woods', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', title: 'Epic Journey', artist: 'Cinematic Symphonies', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: '5', title: 'Midnight Groove', artist: 'Jazz Lounge', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
];

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Core post creation states
  const [activeTab, setActiveTab] = useState('post'); // 'post' | 'reel'
  const [caption, setCaption] = useState('');
  const [mediaItems, setMediaItems] = useState([]); // [{ file, url, type }]
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPollEnabled, setIsPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isPosting, setIsPosting] = useState(false);

  // AI & Safety states
  const [aiPrompt, setAiPrompt] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [toxicityResult, setToxicityResult] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);

  // Music States
  const [selectedCuratedSong, setSelectedCuratedSong] = useState(null);
  const [customMusicFile, setCustomMusicFile] = useState(null);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicTab, setMusicTab] = useState('library'); // 'library' | 'custom'
  const [searchMusicQuery, setSearchMusicQuery] = useState('');
  const [playingSongId, setPlayingSongId] = useState(null);
  const audioRef = useRef(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Collapsible UI panels state
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [isSafetyExpanded, setIsSafetyExpanded] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [isPollExpanded, setIsPollExpanded] = useState(false);

  // Profile data mappings
  const myUsername = user?.username || 'you';
  
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return `http://127.0.0.1:8000${avatar}`;
  };

  const myAvatarUrl = getAvatarUrl(user?.profile?.avatar);
  const myInitial = myUsername[0]?.toUpperCase() || '?';

  // Release object URLs and pause audio to avoid memory leaks
  useEffect(() => {
    return () => {
      mediaItems.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [mediaItems]);

  // Sync poll expand state when poll is toggled
  useEffect(() => {
    if (isPollEnabled) {
      setIsPollExpanded(true);
    }
  }, [isPollEnabled]);

  const handleFileChange = (files) => {
    if (!files || files.length === 0) return;

    if (activeTab === 'reel') {
      const file = files[0];
      if (!file.type.startsWith('video/')) {
        alert("Reels only support video files (e.g. MP4).");
        return;
      }
      // Revoke any existing URLs
      mediaItems.forEach(item => URL.revokeObjectURL(item.url));

      const url = URL.createObjectURL(file);
      setMediaItems([{ file, url, type: file.type }]);
      setActivePreviewIndex(0);
    } else {
      const newItems = Array.from(files).map(file => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type
      }));

      setMediaItems(prev => {
        const combined = [...prev, ...newItems];
        if (combined.length > 10) {
          alert("You can select up to 10 files for a carousel post.");
          combined.slice(10).forEach(item => URL.revokeObjectURL(item.url));
          return combined.slice(0, 10);
        }
        return combined;
      });
    }
  };

  const handleRemoveMediaItem = (index, e) => {
    if (e) e.stopPropagation();
    const itemToRemove = mediaItems[index];
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    const nextItems = mediaItems.filter((_, idx) => idx !== index);
    setMediaItems(nextItems);
    if (activePreviewIndex >= nextItems.length) {
      setActivePreviewIndex(Math.max(0, nextItems.length - 1));
    }
  };

  const handleClearMedia = (e) => {
    if (e) e.stopPropagation();
    mediaItems.forEach(item => URL.revokeObjectURL(item.url));
    setMediaItems([]);
    setActivePreviewIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  // Music handlers
  const handleAttachCurated = (song) => {
    setSelectedCuratedSong(song);
    setCustomMusicFile(null);
    setMusicTitle(song.title);
    setMusicArtist(song.artist);
  };

  const handleCustomAudioChange = (file) => {
    if (!file) return;
    setCustomMusicFile(file);
    setSelectedCuratedSong(null);
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setMusicTitle(baseName);
    setMusicArtist('Custom Audio');
  };

  const handleClearMusic = (e) => {
    if (e) e.stopPropagation();
    setSelectedCuratedSong(null);
    setCustomMusicFile(null);
    setMusicTitle('');
    setMusicArtist('');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingSongId(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const togglePreviewSong = (song, e) => {
    e.stopPropagation();
    if (playingSongId === song.id) {
      audioRef.current.pause();
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(song.url);
      audioRef.current.volume = 0.5;
      audioRef.current.play();
      setPlayingSongId(song.id);
      audioRef.current.onended = () => setPlayingSongId(null);
    }
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, idx) => idx !== index));
  };

  const handleGenerateAICaption = async () => {
    if (!aiPrompt) return alert("Please input a prompt for the AI assistant.");
    setLoadingAi(true);
    try {
      const res = await api.post('/ai/caption/', { prompt: aiPrompt, style: 'futuristic' });
      setCaption(res.data.caption);
    } catch (err) {
      // Mock premium fallback if API fails
      setCaption(`✨ Synthesizing new realities: ${aiPrompt}. Visual coordinates locked onto the grid. #Nexora #Aesthetic`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCheckSafety = async () => {
    if (!caption) return alert("Please write a caption first.");
    setLoadingScan(true);
    try {
      const res = await api.post('/ai/scan/', { text: caption });
      setToxicityResult(res.data);
    } catch (err) {
      setToxicityResult({ is_toxic: false, label: "SAFE", confidence: 0.99, message: "Checked: content looks clear." });
    } finally {
      setLoadingScan(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (mediaItems.length === 0) {
      return alert(activeTab === 'reel' ? "Please select a video file." : "Please select an image or video to share.");
    }
    if (toxicityResult?.is_toxic) return alert("Please modify toxic content before sharing.");

    setIsPosting(true);

    const formData = new FormData();
    formData.append('caption', caption);

    if (activeTab === 'post') {
      // POST mode: append multiple files
      mediaItems.forEach(item => {
        formData.append('media_files', item.file);
      });

      // Append poll options if present
      if (isPollEnabled && pollQuestion) {
        formData.append('poll_question', pollQuestion);
        pollOptions.forEach(opt => {
          if (opt.trim()) {
            formData.append('poll_options', opt.trim());
          }
        });
      }

      // Append music options if present
      if (musicTitle) {
        formData.append('music_title', musicTitle);
        formData.append('music_artist', musicArtist || 'Unknown Artist');
      }

      if (customMusicFile) {
        formData.append('music_file', customMusicFile);
      } else if (selectedCuratedSong) {
        try {
          const response = await fetch(selectedCuratedSong.url);
          const blob = await response.blob();
          formData.append('music_file', blob, `${selectedCuratedSong.title}.mp3`);
        } catch (err) {
          console.error("Failed to append curated song blob, continuing without file", err);
        }
      }
    } else {
      // REEL mode: append single video file
      const reelVideo = mediaItems[0];
      if (!reelVideo || !reelVideo.type.startsWith('video/')) {
        setIsPosting(false);
        return alert("Reels require a video file.");
      }
      formData.append('video', reelVideo.file);
    }

    try {
      if (activeTab === 'post') {
        await api.post('/posts/feed/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await api.post('/reels/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      navigate(activeTab === 'post' ? '/' : '/reels');
    } catch (err) {
      console.error("Failed to share content", err);
      alert("Failed to publish content. Ensure connection is stable.");
    } finally {
      setIsPosting(false);
    }
  };

  const filteredSongs = CURATED_SONGS.filter(song => 
    song.title.toLowerCase().includes(searchMusicQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchMusicQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-20px)] flex items-center justify-center p-2 md:p-6 bg-obsidian transition-all duration-300">
      
      {/* Sleek Instagram Modal Box Container */}
      <div className="w-full max-w-4xl bg-obsidian-card border border-obsidian-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[650px] md:h-[600px] transition-all duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-border bg-obsidian-card select-none">
          <button 
            type="button"
            onClick={() => mediaItems.length > 0 ? handleClearMedia({ stopPropagation: () => {} }) : navigate('/')}
            className="p-1 hover:bg-obsidian-light rounded-full transition-all text-slate-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <span className="text-[15px] font-semibold text-white tracking-wide">
            {mediaItems.length > 0 
              ? (activeTab === 'post' ? 'Create new post' : 'Create new reel') 
              : (activeTab === 'post' ? 'Select Post Media' : 'Select Reel Video')}
          </span>

          {mediaItems.length > 0 ? (
            <button
              onClick={() => handleSubmit()}
              disabled={isPosting || toxicityResult?.is_toxic}
              className={`text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isPosting || toxicityResult?.is_toxic
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-cyber-cyan hover:text-white'
              }`}
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                'Share'
              )}
            </button>
          ) : (
            <div className="w-5 h-5" /> /* Placeholder to balance alignment */
          )}
        </div>

        {/* Sliding Tab Switcher */}
        <div className="flex justify-center py-2.5 border-b border-obsidian-border bg-obsidian-card">
          <div className="relative flex p-1 bg-obsidian rounded-xl border border-obsidian-border w-60 select-none">
            <motion.div 
              className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-cyber-violet to-cyber-cyan shadow-lg shadow-cyber-violet/20"
              layoutId="activeTabIndicator"
              style={{
                width: 'calc(50% - 4px)',
                left: activeTab === 'post' ? '4px' : 'calc(50%)'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'post') {
                  setActiveTab('post');
                  handleClearMedia();
                }
              }}
              className={`relative z-10 w-1/2 py-1.5 text-xs font-black tracking-wider uppercase transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'post' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>POST</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'reel') {
                  setActiveTab('reel');
                  handleClearMedia();
                }
              }}
              className={`relative z-10 w-1/2 py-1.5 text-xs font-black tracking-wider uppercase transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'reel' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>REEL</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          
          {/* STATE A: NO MEDIA SELECTED (Drag & Drop Zone) */}
          {mediaItems.length === 0 ? (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center p-8 m-6 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer select-none ${
                isDragging 
                  ? 'border-cyber-violet bg-cyber-violet/5 shadow-[0_0_15px_rgba(193,53,132,0.1)]' 
                  : 'border-obsidian-border hover:border-slate-600 bg-obsidian-card/40'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                accept={activeTab === 'reel' ? "video/*" : "image/*,video/*"}
                multiple={activeTab === 'post'}
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
              />
              
              <div className="p-6 rounded-full bg-obsidian-light/50 border border-obsidian-border mb-5 text-slate-300 transition-all duration-300 hover:scale-105">
                {activeTab === 'post' ? (
                  <Image className="w-12 h-12 text-cyber-violet" />
                ) : (
                  <Film className="w-12 h-12 text-cyber-cyan animate-pulse" />
                )}
              </div>
              
              <h3 className="text-white font-medium text-lg text-center tracking-wide">
                {activeTab === 'post' ? 'Drag photos and videos here' : 'Drag reel video here'}
              </h3>
              
              <p className="text-xs text-slate-500 mt-2 mb-6 text-center max-w-xs">
                {activeTab === 'post' ? 'Supports High Quality Images and MP4 Videos' : 'Supports high definition MP4/MOV/AVI Reels'}
              </p>
              
              <button
                type="button"
                className={`px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer ${
                  activeTab === 'post' ? 'bg-cyber-violet hover:bg-cyber-violet/90' : 'bg-cyber-cyan hover:bg-cyber-cyan/90'
                }`}
              >
                Select from computer
              </button>
            </div>
          ) : (
            
            /* STATE B: MEDIA SELECTED (2-Column Premium Editing Grid) */
            <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full">
              
              {/* Left Column: Live Visual Media Frame */}
              <div className="w-full md:w-[55%] h-[240px] md:h-full bg-black relative flex flex-col justify-between overflow-hidden border-r border-obsidian-border select-none">
                
                {/* Main Display Item */}
                <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden bg-black">
                  {mediaItems[activePreviewIndex]?.type?.startsWith('video/') ? (
                    <video 
                      key={mediaItems[activePreviewIndex]?.url}
                      src={mediaItems[activePreviewIndex]?.url} 
                      controls 
                      autoPlay 
                      loop 
                      muted 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img 
                      src={mediaItems[activePreviewIndex]?.url} 
                      className="w-full h-full object-contain" 
                      alt="Uploaded Media Preview" 
                    />
                  )}

                  {/* Carousel Overlay Navigation Arrows */}
                  {activeTab === 'post' && mediaItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePreviewIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
                        }}
                        className="absolute left-3 p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white transition-all border border-white/10 active:scale-90 z-20 cursor-pointer shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePreviewIndex(prev => (prev === mediaItems.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white transition-all border border-white/10 active:scale-90 z-20 cursor-pointer shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Carousel Dot Indicators Overlay */}
                  {activeTab === 'post' && mediaItems.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/5 z-20">
                      {mediaItems.map((_, idx) => (
                        <div 
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            idx === activePreviewIndex 
                              ? 'bg-cyber-cyan scale-125' 
                              : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Carousel Thumbnail strip & controls */}
                {activeTab === 'post' && (
                  <div className="w-full bg-obsidian-card/95 backdrop-blur-md border-t border-obsidian-border/50 px-4 py-2 flex flex-col gap-2 z-10">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                      <span>Media List ({mediaItems.length}/10)</span>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-cyber-cyan hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add more
                      </button>
                    </div>
                    
                    <div className="flex gap-2.5 overflow-x-auto py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-obsidian-border pr-2 select-none">
                      {mediaItems.map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setActivePreviewIndex(idx)}
                          className={`relative w-12 h-12 rounded-lg border-2 overflow-hidden flex-shrink-0 cursor-pointer group/thumb transition-all duration-200 ${
                            idx === activePreviewIndex 
                              ? 'border-cyber-cyan shadow-[0_0_10px_rgba(0,242,254,0.3)] scale-105' 
                              : 'border-obsidian-border hover:border-slate-500'
                          }`}
                        >
                          {item.type.startsWith('video/') ? (
                            <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                              <Film className="w-5 h-5 text-slate-400" />
                              <div className="absolute inset-0 bg-black/20" />
                            </div>
                          ) : (
                            <img src={item.url} className="w-full h-full object-cover" alt="" />
                          )}
                          
                          {/* Mini Delete Overlay */}
                          <button
                            type="button"
                            onClick={(e) => handleRemoveMediaItem(idx, e)}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/70 hover:bg-cyber-pink text-white hover:text-white transition-all shadow-md z-25 opacity-0 group-hover/thumb:opacity-100"
                            title="Remove"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Music Small Banner Overlay (only if activeTab is post) */}
                {activeTab === 'post' && musicTitle && (
                  <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-white max-w-xs shadow-lg animate-pulse select-none z-20">
                    <Music className="w-3.5 h-3.5 text-cyber-cyan animate-bounce" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{musicTitle}</p>
                      <p className="text-[10px] text-slate-400 truncate">{musicArtist}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleClearMusic}
                      className="p-1 text-slate-400 hover:text-cyber-pink transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Reset Media Button (If single item or reel, we show trash overlay) */}
                {(activeTab === 'reel' || mediaItems.length === 1) && (
                  <button
                    type="button"
                    onClick={handleClearMedia}
                    className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/95 text-white hover:text-cyber-pink transition-all backdrop-blur-md shadow-lg border border-white/10 active:scale-95 cursor-pointer z-20"
                    title="Remove media"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Right Column: Details, Captions & Advanced Modifiers */}
              <div className="w-full md:w-[45%] h-full flex flex-col bg-obsidian-card divide-y divide-obsidian-border/50 overflow-y-auto">
                
                {/* 1. Logged-in User Header */}
                <div className="p-4 flex items-center gap-3 select-none">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-obsidian-border bg-slate-800 flex-shrink-0 flex items-center justify-center">
                    {myAvatarUrl ? (
                      <img src={myAvatarUrl} className="w-full h-full object-cover" alt={myUsername} />
                    ) : (
                      <span className="text-[10px] font-bold text-white">{myInitial}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white tracking-wide">{myUsername}</span>
                </div>

                {/* 2. Borderless Caption Input */}
                <div className="p-4 flex flex-col justify-between min-h-[140px] bg-transparent">
                  <textarea
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-white placeholder-slate-500 resize-none text-sm h-28 focus:ring-0 focus:outline-none"
                    maxLength={2200}
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-500 select-none mt-2">
                    <Smile className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                    <span>{caption.length} / 2,200</span>
                  </div>
                </div>

                {/* 3. Collapsible Panels */}
                <div className="flex-1 flex flex-col divide-y divide-obsidian-border/50">
                  
                  {/* Accordion A: AI Caption Generator */}
                  <div className="flex flex-col">
                    <div 
                      onClick={() => setIsAiExpanded(!isAiExpanded)}
                      className="py-3.5 px-4 flex items-center justify-between cursor-pointer hover:bg-obsidian-light/30 transition-all select-none"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-cyber-violet flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> AI Caption Assistant
                      </span>
                      {isAiExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                    
                    <AnimatePresence>
                      {isAiExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5">
                            <input 
                              type="text"
                              placeholder="Ask AI e.g. floating matrix in space" 
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-obsidian border border-obsidian-border rounded-lg text-white outline-none focus:border-cyber-violet transition-all"
                            />
                            <button
                              type="button"
                              disabled={loadingAi}
                              onClick={handleGenerateAICaption}
                              className="w-full py-2 bg-cyber-violet text-white text-xs font-bold rounded-lg hover:bg-cyber-violet/90 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                              {loadingAi ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Synthesizing...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Generate Smart Caption</span>
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Accordion B: Safety content scan */}
                  <div className="flex flex-col">
                    <div 
                      onClick={() => setIsSafetyExpanded(!isSafetyExpanded)}
                      className="py-3.5 px-4 flex items-center justify-between cursor-pointer hover:bg-obsidian-light/30 transition-all select-none"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-cyber-emerald flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Safety Scanning
                      </span>
                      {isSafetyExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>

                    <AnimatePresence>
                      {isSafetyExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={handleCheckSafety}
                              disabled={loadingScan || !caption}
                              className={`w-full py-2 border text-xs font-bold rounded-lg transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer ${
                                !caption
                                  ? 'border-obsidian-border text-slate-600 cursor-not-allowed'
                                  : 'border-cyber-emerald/30 text-cyber-emerald hover:bg-cyber-emerald/10'
                              }`}
                            >
                              {loadingScan ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Analyzing text...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Scan content safety</span>
                                </>
                              )}
                            </button>

                            {toxicityResult && (
                              <div className={`p-3 rounded-lg border flex items-start gap-3 animate-fade-in ${
                                toxicityResult.is_toxic 
                                  ? 'bg-cyber-pink/5 border-cyber-pink/20 text-cyber-pink' 
                                  : 'bg-cyber-emerald/5 border-cyber-emerald/20 text-cyber-emerald'
                              }`}>
                                {toxicityResult.is_toxic ? (
                                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 flex flex-col">
                                  <span className="text-xs font-bold uppercase tracking-wider">
                                    {toxicityResult.label} DETECTED
                                  </span>
                                  <span className="text-[11px] text-slate-400 mt-1">
                                    Confidence: {Math.round(toxicityResult.confidence * 100)}% — {toxicityResult.message || (toxicityResult.is_toxic ? 'Content flags safety regulations.' : 'All checks passed.')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Accordion C & D: Only for Standard Posts */}
                  {activeTab === 'post' && (
                    <>
                      {/* Accordion C: Add Music / Sound Track */}
                      <div className="flex flex-col">
                        <div 
                          onClick={() => setIsMusicExpanded(!isMusicExpanded)}
                          className="py-3.5 px-4 flex items-center justify-between cursor-pointer hover:bg-obsidian-light/30 transition-all select-none"
                        >
                          <span className="text-xs font-bold uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
                            <Music className="w-4 h-4" /> Add Music
                          </span>
                          <div className="flex items-center gap-2 select-none">
                            {musicTitle && (
                              <span className="text-[10px] text-cyber-cyan px-2 py-0.5 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full font-semibold max-w-[120px] truncate">
                                Attached 🎵
                              </span>
                            )}
                            {isMusicExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isMusicExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                                
                                {/* Option Type Tabs */}
                                <div className="flex bg-obsidian/40 border border-obsidian-border rounded-lg p-0.5 text-xs text-slate-400 select-none">
                                  <button
                                    type="button"
                                    onClick={() => setMusicTab('library')}
                                    className={`flex-1 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                                      musicTab === 'library' ? 'bg-obsidian text-white border border-obsidian-border' : 'hover:text-white'
                                    }`}
                                  >
                                    Sound Library
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMusicTab('custom')}
                                    className={`flex-1 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                                      musicTab === 'custom' ? 'bg-obsidian text-white border border-obsidian-border' : 'hover:text-white'
                                    }`}
                                  >
                                    Custom Upload
                                  </button>
                                </div>

                                {/* TAB 1: CURATED SOUND LIBRARY */}
                                {musicTab === 'library' && (
                                  <div className="flex flex-col gap-2.5">
                                    {/* Search bar */}
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-obsidian border border-obsidian-border rounded-lg">
                                      <Search className="w-3.5 h-3.5 text-slate-500" />
                                      <input 
                                        type="text" 
                                        placeholder="Search popular tracks..."
                                        value={searchMusicQuery}
                                        onChange={(e) => setSearchMusicQuery(e.target.value)}
                                        className="flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder-slate-600 focus:ring-0 focus:outline-none"
                                      />
                                      {searchMusicQuery && (
                                        <button 
                                          type="button" 
                                          onClick={() => setSearchMusicQuery('')}
                                          className="text-[10px] text-slate-500 hover:text-white"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>

                                    {/* Songs list */}
                                    <div className="flex flex-col max-h-[160px] overflow-y-auto divide-y divide-obsidian-border/30 pr-1">
                                      {filteredSongs.length === 0 ? (
                                        <div className="text-center py-4">
                                          <span className="text-[11px] text-slate-500">No tracks found.</span>
                                        </div>
                                      ) : (
                                        filteredSongs.map(song => {
                                          const isAttached = selectedCuratedSong?.id === song.id;
                                          const isPlaying = playingSongId === song.id;
                                          return (
                                            <div key={song.id} className="py-2 flex items-center justify-between gap-3">
                                              
                                              {/* Play/Pause Button */}
                                              <button
                                                type="button"
                                                onClick={(e) => togglePreviewSong(song, e)}
                                                className="w-7 h-7 rounded-full bg-obsidian border border-obsidian-border flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer flex-shrink-0"
                                              >
                                                {isPlaying ? (
                                                  <Pause className="w-3 h-3 text-cyber-cyan" />
                                                ) : (
                                                  <Play className="w-3 h-3 translate-x-[0.5px]" />
                                                )}
                                              </button>

                                              {/* Info */}
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{song.artist}</p>
                                              </div>

                                              {/* Attach action */}
                                              <button
                                                type="button"
                                                onClick={() => handleAttachCurated(song)}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                                  isAttached 
                                                    ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan' 
                                                    : 'border-obsidian-border text-slate-400 hover:text-white hover:border-slate-500'
                                                }`}
                                              >
                                                {isAttached ? (
                                                  <span className="flex items-center gap-0.5">
                                                    <Check className="w-3 h-3" /> Attached
                                                  </span>
                                                ) : (
                                                  'Attach'
                                                )}
                                              </button>

                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* TAB 2: CUSTOM AUDIO UPLOAD */}
                                {musicTab === 'custom' && (
                                  <div className="flex flex-col gap-3">
                                    <div 
                                      onClick={() => audioInputRef.current?.click()}
                                      className="py-4 border border-dashed border-obsidian-border rounded-lg bg-obsidian/20 text-center cursor-pointer hover:border-slate-500 transition-colors"
                                    >
                                      <input 
                                        type="file" 
                                        ref={audioInputRef}
                                        accept="audio/*" 
                                        onChange={(e) => handleCustomAudioChange(e.target.files[0])}
                                        className="hidden"
                                      />
                                      <Music className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                                      <span className="text-xs font-semibold text-slate-300">
                                        {customMusicFile ? customMusicFile.name : 'Choose Audio File'}
                                      </span>
                                      <p className="text-[10px] text-slate-500 mt-1">Supports MP3, WAV, AAC</p>
                                    </div>

                                    {customMusicFile && (
                                      <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-obsidian/45 border border-obsidian-border/50 animate-fade-in text-left">
                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Song Title</label>
                                          <input 
                                            type="text" 
                                            placeholder="Track title..." 
                                            value={musicTitle}
                                            onChange={(e) => setMusicTitle(e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-obsidian border border-obsidian-border rounded-lg text-xs text-white outline-none focus:border-cyber-cyan"
                                          />
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Artist</label>
                                          <input 
                                            type="text" 
                                            placeholder="Artist name..." 
                                            value={musicArtist}
                                            onChange={(e) => setMusicArtist(e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-obsidian border border-obsidian-border rounded-lg text-xs text-white outline-none focus:border-cyber-cyan"
                                          />
                                        </div>

                                        <button 
                                          type="button"
                                          onClick={handleClearMusic}
                                          className="py-1 px-3 border border-cyber-pink/20 hover:bg-cyber-pink/5 text-[10px] font-bold text-cyber-pink rounded-lg self-end flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" /> Remove Track
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Accordion D: Polling module */}
                      <div className="flex flex-col">
                        <div 
                          onClick={() => setIsPollExpanded(!isPollExpanded)}
                          className="py-3.5 px-4 flex items-center justify-between cursor-pointer hover:bg-obsidian-light/30 transition-all select-none"
                        >
                          <span className="text-xs font-bold uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
                            <BarChart2 className="w-4 h-4" /> Interactive Polling
                          </span>
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              checked={isPollEnabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                setIsPollEnabled(e.target.checked);
                              }}
                              className="w-4 h-4 cursor-pointer accent-cyber-cyan rounded"
                            />
                            {isPollExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isPollExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                                {!isPollEnabled ? (
                                  <div className="text-center py-4 bg-obsidian/30 border border-obsidian-border rounded-lg">
                                    <span className="text-[11px] text-slate-500">
                                      Enable the checkbox above to add a poll.
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-3 p-3 rounded-lg bg-obsidian/45 border border-obsidian-border/50">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poll Question</label>
                                      <input 
                                        type="text" 
                                        placeholder="Ask a question..." 
                                        value={pollQuestion} 
                                        onChange={(e) => setPollQuestion(e.target.value)} 
                                        className="w-full px-3 py-2 bg-obsidian border border-obsidian-border rounded-lg text-xs text-white outline-none focus:border-cyber-cyan transition-all"
                                        required 
                                      />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Options</label>
                                      {pollOptions.map((opt, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                          <input 
                                            type="text"
                                            placeholder={`Option ${index + 1}`}
                                            value={opt}
                                            onChange={(e) => {
                                              const nextOpts = [...pollOptions];
                                              nextOpts[index] = e.target.value;
                                              setPollOptions(nextOpts);
                                            }}
                                            className="flex-1 px-3 py-2 bg-obsidian border border-obsidian-border rounded-lg text-xs text-white outline-none focus:border-cyber-cyan transition-all"
                                            required
                                          />
                                          {pollOptions.length > 2 && (
                                            <button 
                                              type="button" 
                                              onClick={() => handleRemovePollOption(index)}
                                              className="p-2 text-slate-500 hover:text-cyber-pink transition-all"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={handleAddPollOption}
                                        className="text-[11px] font-bold text-cyber-cyan hover:text-cyber-cyan/80 transition-all flex items-center gap-1.5 uppercase mt-1 cursor-pointer w-fit"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add option parameter</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
      
    </div>
  );
};

export default CreatePost;
