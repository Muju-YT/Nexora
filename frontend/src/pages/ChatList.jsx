import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, CheckCircle2, User, Users, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '../components/GlowCard';
import CyberButton from '../components/CyberButton';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { rooms, fetchRooms } = useChatStore();

  useEffect(() => {
    fetchRooms();

    const pollInterval = setInterval(() => {
      fetchRooms();
    }, 20000);

    return () => clearInterval(pollInterval);
  }, []);

  const getAvatarUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
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

  const roomsList = Array.isArray(rooms) ? rooms : (rooms?.results || []);
  
  const activeContacts = roomsList
    .filter(room => !room.is_group)
    .map(room => {
      const otherMember = room.members?.find(m => m.username !== user?.username);
      if (!otherMember) return null;
      return {
        username: otherMember.username,
        avatar: getAvatarUrl(otherMember.avatar),
        online: otherMember.is_online
      };
    })
    .filter(contact => contact && contact.online);

  const mockRooms = roomsList.map(room => {
    const otherMember = room.members?.find(m => m.username !== user?.username);
    const title = room.is_group ? room.title : (otherMember?.username || 'Chat');
    const avatar = room.is_group ? getAvatarUrl(room.avatar) : getAvatarUrl(otherMember?.avatar);
    const last_msg = room.last_message ? room.last_message.content : "No messages yet";
    const time = room.last_message ? formatTime(room.last_message.created_at) : "";
    const unread = room.unread_count || 0;
    const online = !room.is_group && otherMember ? otherMember.is_online : false;

    return {
      id: room.id,
      title,
      avatar,
      last_msg,
      time,
      unread,
      is_group: room.is_group,
      online
    };
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 select-none">
      
      {/* Top Header Deck */}
      <div className="flex justify-between items-center bg-obsidian-card p-4 rounded-2xl border border-obsidian-border shadow-glass">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-obsidian-light text-slate-400 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Messages</h2>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">@{user?.username || 'you'}</p>
          </div>
        </div>
        
        <button
          onClick={() => alert("Searching for users to start a chat...")}
          className="p-2.5 rounded-xl bg-obsidian-light hover:bg-[#262626] border border-obsidian-border text-white cursor-pointer transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Online/Active Contacts Stories Row */}
      {activeContacts.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Active Now</span>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {activeContacts.map((contact, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
                onClick={() => alert(`Starting direct conversation with @${contact.username}`)}
              >
                <div className="relative">
                  <div className={`p-[1.5px] rounded-full border border-obsidian-border ${contact.online ? 'border-cyber-emerald' : ''}`}>
                    <img 
                      src={contact.avatar} 
                      alt={contact.username} 
                      className="w-12 h-12 rounded-full object-cover" 
                    />
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-cyber-emerald border-2 border-obsidian" />
                  )}
                </div>
                <span className="text-[9px] font-bold text-slate-400 max-w-[65px] truncate">
                  {contact.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
        <input 
          type="text" 
          placeholder="Search creators..."
          onClick={() => navigate('/search')}
          className="w-full pl-11 pr-4 py-3 bg-obsidian-card border border-obsidian-border rounded-xl text-xs md:text-sm text-white outline-none focus:border-cyber-pink transition-colors cursor-pointer"
          readOnly
        />
      </div>

      {/* Thread list */}
      <div className="flex flex-col gap-3">
        {mockRooms.length > 0 ? (
          mockRooms.map((room) => (
            <motion.div
              key={room.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`/chat/${room.id}`)}
              className="cursor-pointer"
            >
              <GlowCard hoverable={false} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Room Avatar */}
                  <div className="relative flex-shrink-0">
                    {room.avatar ? (
                      <img src={room.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-obsidian-border" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-700 border border-obsidian-border flex items-center justify-center text-white">
                        <Users className="w-5 h-5" />
                      </div>
                    )}

                    {room.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-cyber-emerald border-2 border-obsidian" />
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs md:text-sm font-bold text-white truncate">{room.title}</span>
                        {!room.is_group && <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-white" />}
                      </div>
                      <span className="text-[9px] text-slate-500 font-semibold">{room.time}</span>
                    </div>
                    <span className={`text-xs truncate mt-1 ${room.unread > 0 ? 'text-white font-bold' : 'text-slate-400'}`}>
                      {room.last_msg}
                    </span>
                  </div>
                </div>

                {/* Unread badge */}
                {room.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#E1306C] flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                    {room.unread}
                  </div>
                )}
              </GlowCard>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 border border-dashed border-obsidian-border rounded-2xl bg-obsidian-card/40 flex flex-col items-center gap-3">
            <MessageSquare className="w-7 h-7 text-slate-600 animate-bounce" />
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">No messages yet.</span>
            <span className="text-[10px] text-slate-500 max-w-[250px] mx-auto leading-relaxed">
              Find creators in Search and message them directly!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
