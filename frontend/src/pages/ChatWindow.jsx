import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Smile, CheckCircle2, Image, Paperclip, Loader2, Heart, Film, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import { getAvatarUrl } from '../utils/url';

const ALL_EMOJIS = [
  '❤️', '🙌', '🔥', '👏', '😂', '😍', '😢', '😮',
  '👍', '🎉', '✨', '💖', '😎', '🤔', '💯', '🙏',
  '🌟', '🚀', '👀', '🤣', '🤩', '🥰', '💔', '😭'
];

const ChatWindow = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { 
    messages, 
    activeRoom, 
    sendMessage, 
    connectWebSocket, 
    socket, 
    fetchActiveRoom, 
    fetchMessages,
    reactToMessage
  } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();

  const [inputVal, setInputVal] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState('text'); // 'image', 'file', etc.
  const [isUploading, setIsUploading] = useState(false);

  // Reaction & Emoji picker states
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [heartOverlayMessageId, setHeartOverlayMessageId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sandbox fallback threads
  const defaultMessages = [
    { id: 1, sender_username: "alexa_travels", content: "Hey! Did you see the sunrises reel I uploaded today? Greece is unbelievable!", created_at: "10:30 AM" },
    { id: 2, sender_username: "cyber_pioneer", content: "Yes! Double-tapped it immediately, the brand colors render so beautifully.", created_at: "10:31 AM" },
    { id: 3, sender_username: "alexa_travels", content: "Thank you! I'm planning to post more vertical reels from our beach house tomorrow.", created_at: "10:32 AM" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadChatData = async () => {
      await fetchActiveRoom(roomId);
      await fetchMessages(roomId);
      useAuthStore.getState().fetchUnreadCounts();
    };
    loadChatData();
    connectWebSocket(roomId);

    // Poll active room for online status updates periodically
    const pollInterval = setInterval(() => {
      useChatStore.getState().fetchActiveRoom(roomId);
    }, 20000);

    return () => clearInterval(pollInterval);
  }, [roomId, isAuthenticated]);

  const handleEmojiClick = (emoji) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = input.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setInputVal(before + emoji + after);
      
      // Reset cursor position after state updates
      setTimeout(() => {
        input.focus();
        input.selectionStart = input.selectionEnd = start + emoji.length;
      }, 0);
    } else {
      setInputVal(prev => prev + emoji);
    }
  };

  const handleDoubleClick = (messageId) => {
    reactToMessage(messageId, '❤️');
    setHeartOverlayMessageId(messageId);
    setTimeout(() => {
      setHeartOverlayMessageId(null);
    }, 600);
  };



  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileType('image');
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileType('file');
    setPreviewUrl(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() && !selectedFile) return;
    
    setIsUploading(true);
    try {
      await sendMessage(inputVal.trim(), selectedFile, fileType);
      setInputVal('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileType('text');
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsUploading(false);
    }
  };

  const otherMember = activeRoom?.members?.find(m => m.username !== user?.username);

  const getOnlineStatusText = () => {
    if (activeRoom?.is_group) return "Group Room";
    if (!otherMember) return "";
    if (otherMember.is_online) return "Active now";
    if (!otherMember.last_activity) return "Offline";
    try {
      const now = new Date();
      const lastActive = new Date(otherMember.last_activity);
      const diffMs = now - lastActive;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Active now";
      if (diffMins < 60) return `Active ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Active ${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Active ${diffDays}d ago`;
    } catch {
      return "Offline";
    }
  };

  const chatTitle = activeRoom
    ? (activeRoom.is_group ? activeRoom.title : (otherMember?.username || 'Chat'))
    : 'alexa_travels';

  const chatAvatar = activeRoom
    ? (activeRoom.is_group ? getAvatarUrl(activeRoom.avatar) : getAvatarUrl(otherMember?.avatar))
    : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80";

  const activeMsgs = messages.length > 0 ? messages : (activeRoom ? [] : defaultMessages);
  const myUsername = user?.username || 'you';

  return (
    <div className="min-h-screen bg-obsidian flex flex-col justify-between select-none">
      
      {/* Top Header */}
      <div className="px-5 py-3.5 bg-obsidian-card/80 border-b border-obsidian-border flex items-center justify-between z-10 sticky top-0 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/chats')}
            className="text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <img 
              src={chatAvatar} 
              alt={chatTitle} 
              className="w-10 h-10 rounded-full object-cover border border-obsidian-border" 
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs md:text-sm font-bold text-white">{chatTitle}</span>
                {!activeRoom?.is_group && <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-white" />}
              </div>
              {getOnlineStatusText() === "Active now" ? (
                <span className="text-[10px] text-cyber-emerald font-bold tracking-wide mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-emerald shadow-[0_0_8px_#10B981] animate-pulse"></span>
                  Active now
                </span>
              ) : getOnlineStatusText() ? (
                <span className="text-[10px] text-slate-500 font-bold tracking-wide mt-0.5">
                  {getOnlineStatusText()}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-slate-400">
          <button className="hover:text-white cursor-pointer"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages scrolling container */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 max-w-3xl mx-auto w-full">
        {activeMsgs.map((m) => {
          const isSelf = m.sender_username === myUsername || m.sender_username === "cyber_pioneer" || m.sender_username === "you";
          
          // Parse customized share post layout
          const isPostShare = m.content && m.content.startsWith('[POST_SHARE] |');
          const isReelShare = m.content && m.content.startsWith('[REEL_SHARE] |');
          let sharedPostData = null;
          if (isPostShare) {
            const parts = m.content.split(' | ');
            sharedPostData = {
              username: parts[1] || '',
              caption: parts[2] || '',
              mediaUrl: parts[3] || ''
            };
          } else if (isReelShare) {
            const parts = m.content.split(' | ');
            sharedPostData = {
              username: parts[1] || '',
              caption: parts[2] || '',
              mediaUrl: parts[3] || '',
              reelId: parts[4] || '',
              isReel: true
            };
          }

          return (
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={m.id}
              className={`flex flex-col max-w-[75%] relative ${isSelf ? 'align-self-end ml-auto items-end' : 'align-self-start mr-auto items-start'}`}
              onMouseEnter={() => setHoveredMessageId(m.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {/* Floating Reaction Bar on Hover */}
              <AnimatePresence>
                {hoveredMessageId === m.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className={`absolute -top-7 ${isSelf ? 'right-0' : 'left-0'} flex items-center gap-1.5 bg-obsidian-card/95 border border-obsidian-border px-2.5 py-1 rounded-full shadow-glass z-20 backdrop-blur-md`}
                  >
                    {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => {
                      const userReaction = m.reactions?.find(r => r.username === myUsername)?.reaction;
                      const isSelected = userReaction === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            reactToMessage(m.id, emoji);
                            setHoveredMessageId(null);
                          }}
                          className={`text-sm hover:scale-130 transition-transform p-0.5 rounded cursor-pointer duration-100 ${isSelected ? 'bg-[#E1306C]/20 rounded-full' : ''}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="text-[8px] text-slate-500 font-bold mb-1 uppercase tracking-wider px-1">
                {isSelf ? "You" : m.sender_username}
              </span>
              
              <div 
                onDoubleClick={() => handleDoubleClick(m.id)}
                className={`px-4 py-3 rounded-2xl text-xs md:text-sm leading-relaxed flex flex-col gap-2 relative ${
                  isSelf 
                    ? 'bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] text-white rounded-tr-none shadow-md font-medium' 
                    : 'bg-obsidian-light/50 border border-obsidian-border text-slate-200 rounded-tl-none font-medium'
                }`}
              >
                {/* Popping Heart Animation */}
                <AnimatePresence>
                  {heartOverlayMessageId === m.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.55 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                    >
                      <Heart className="w-12 h-12 text-red-500 fill-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Render Post / Reel Share Card */}
                {(isPostShare || isReelShare) && sharedPostData && (
                  <div 
                    onClick={() => {
                      if (sharedPostData.isReel) {
                        navigate(`/reels?reel=${sharedPostData.reelId}`);
                      } else {
                        navigate(`/profile/${sharedPostData.username}`);
                      }
                    }}
                    className="mb-1 rounded-xl overflow-hidden max-w-xs border border-white/10 bg-black/35 hover:scale-[1.01] transition-transform duration-200 cursor-pointer shadow-glass flex flex-col group relative"
                  >
                    <div className="flex items-center gap-2 p-2 border-b border-white/5 bg-white/5">
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-black text-white uppercase">
                        {sharedPostData.username?.[0] || '?'}
                      </div>
                      <span className="text-[10px] font-bold text-white">@{sharedPostData.username}</span>
                      {sharedPostData.isReel ? (
                        <span className="text-[8px] text-amber-300 font-bold ml-auto uppercase tracking-wide bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded animate-pulse flex items-center gap-1">
                          <Film className="w-2.5 h-2.5 text-amber-400" /> Shared Reel
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-400 font-bold ml-auto uppercase tracking-wide bg-cyber-pink/20 border border-cyber-pink/30 px-1.5 py-0.5 rounded animate-pulse">Shared Post</span>
                      )}
                    </div>
                    {sharedPostData.mediaUrl && (
                      <div className="relative max-h-48 overflow-hidden bg-black flex items-center justify-center">
                        {sharedPostData.isReel ? (
                          <>
                            <video 
                              src={getAvatarUrl(sharedPostData.mediaUrl)} 
                              muted 
                              loop 
                              playsInline 
                              autoPlay 
                              className="max-h-48 w-full object-cover"
                            />
                            {/* Overlay Play Icon on Hover */}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/35 transition-colors">
                              <div className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shadow-md">
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <img 
                            src={getAvatarUrl(sharedPostData.mediaUrl)} 
                            alt="Shared Post" 
                            className="max-h-40 w-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    {sharedPostData.caption && (
                      <p className="text-[10px] p-2 text-slate-300 leading-normal line-clamp-2 m-0 border-t border-white/5">
                        {sharedPostData.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* Render Image */}
                {!isPostShare && !isReelShare && m.media_type === 'image' && m.media_file && (
                  <div className="mb-1 rounded-xl overflow-hidden max-w-xs md:max-w-md border border-white/10 shadow-glass">
                    <img 
                      src={getAvatarUrl(m.media_file)} 
                      alt="Shared media" 
                      className="max-h-60 w-full object-cover hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
                      onClick={() => window.open(getAvatarUrl(m.media_file), '_blank')}
                    />
                  </div>
                )}

                {/* Render File */}
                {!isPostShare && !isReelShare && m.media_type === 'file' && m.media_file && (
                  <a 
                    href={getAvatarUrl(m.media_file)}
                    target="_blank" 
                    rel="noreferrer"
                    className={`flex items-center gap-2.5 p-2 rounded-xl border no-underline ${
                      isSelf 
                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/15' 
                        : 'bg-obsidian border-obsidian-border text-slate-200 hover:bg-obsidian-light'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-black/10 border border-white/5">
                      <Paperclip className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold truncate max-w-[150px] md:max-w-[200px]">
                        {m.media_file.split('/').pop()}
                      </span>
                      <span className="text-[9px] opacity-70 font-semibold tracking-wide">Download File</span>
                    </div>
                  </a>
                )}

                {/* Regular text content */}
                {!isPostShare && !isReelShare && m.content && (
                  <span>{m.content}</span>
                )}

                {/* Reaction Badges */}
                {m.reactions && m.reactions.length > 0 && (
                  <div 
                    className={`absolute -bottom-2.5 ${isSelf ? 'right-4' : 'left-4'} flex items-center gap-1 bg-[#1a1a1a]/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-obsidian-border text-[9px] shadow-glass select-none pointer-events-auto cursor-pointer hover:scale-105 transition-transform z-10`}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const myReaction = m.reactions.find(r => r.username === myUsername)?.reaction;
                      if (myReaction) {
                        reactToMessage(m.id, myReaction); // Toggle off if clicked
                      } else {
                        reactToMessage(m.id, '❤️');
                      }
                    }}
                  >
                    <span>{Array.from(new Set(m.reactions.map(r => r.reaction))).join('')}</span>
                    {m.reactions.length > 1 && <span className="text-slate-400 font-black ml-0.5">{m.reactions.length}</span>}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[8px] text-slate-600">{formatTime(m.created_at)}</span>
                {isSelf && <span className="text-[8px] text-slate-500 font-bold">• Seen</span>}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* File/Image Preview Overlay above input bar */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-3 bg-[#121212] border-t border-obsidian-border flex items-center justify-between gap-4 max-w-3xl mx-auto w-full rounded-t-2xl shadow-glass"
          >
            <div className="flex items-center gap-3">
              {fileType === 'image' && previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Upload preview" 
                  className="w-12 h-12 rounded-lg object-cover border border-obsidian-border"
                />
              ) : (
                <div className="p-3 bg-obsidian rounded-lg border border-obsidian-border text-cyber-pink">
                  <Paperclip className="w-5 h-5" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white truncate max-w-[200px] md:max-w-sm">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {fileType}
                </span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setFileType('text');
                if (imageInputRef.current) imageInputRef.current.value = '';
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1.5 rounded-full bg-obsidian hover:bg-[#262626] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold px-1.5 py-0.5">✕</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="p-4 border-t border-obsidian-border bg-obsidian-card sticky bottom-0 z-10">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3">
          {/* File Selection Triggers */}
          <div className="flex items-center gap-2 mr-1">
            <button 
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-obsidian border border-obsidian-border text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Send Image"
            >
              <Image className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-obsidian border border-obsidian-border text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Send File"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden inputs */}
          <input 
            type="file" 
            ref={imageInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />

          <div className="flex-1 relative flex items-center">
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Message..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-obsidian border border-obsidian-border rounded-xl text-white outline-none focus:border-cyber-pink text-xs md:text-sm transition-colors"
            />
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-4 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Curated Emoji Picker Popover */}
            <AnimatePresence>
              {showEmojiPicker && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 bottom-16 bg-obsidian-card/95 border border-obsidian-border rounded-2xl p-3 shadow-glass z-50 backdrop-blur-2xl w-64 flex flex-col gap-2"
                  >
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                      Quick Emojis
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {ALL_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="text-lg hover:scale-125 transition-transform duration-150 p-1 rounded hover:bg-white/5 active:scale-95 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="submit"
            disabled={(!inputVal.trim() && !selectedFile) || isUploading}
            className="p-3 bg-cyber-pink hover:bg-cyber-pink/85 disabled:opacity-40 disabled:hover:bg-cyber-pink text-white rounded-xl cursor-pointer transition-colors flex items-center justify-center min-w-[44px]"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 rotate-45" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
