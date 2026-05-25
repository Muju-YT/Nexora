import { create } from 'zustand';
import api from '../services/api';

const useChatStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: [],
  socket: null,
  typingStatus: {},
  onlineUsers: [],

  fetchRooms: async () => {
    try {
      const res = await api.get('/chats/rooms/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      set({ rooms: data });
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  },

  setActiveRoom: (room) => {
    set({ activeRoom: room, messages: [] });
    get().fetchMessages(room.id);
    get().connectWebSocket(room.id);
  },

  fetchActiveRoom: async (roomId) => {
    try {
      const res = await api.get(`/chats/rooms/${roomId}/`);
      set({ activeRoom: res.data });
    } catch (err) {
      console.error('Failed to fetch active room', err);
    }
  },

  fetchMessages: async (roomId) => {
    try {
      const res = await api.get(`/chats/rooms/${roomId}/messages/`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      set({ messages: data });
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  },

  connectWebSocket: (roomId) => {
    // Close existing socket if open
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.close();
    }

    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${roomId}/`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`WebSocket connected to room: ${roomId}`);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_message') {
        const username = localStorage.getItem('username') || 'cyber_pioneer';
        if (data.sender === username) {
          return;
        }

        const newMsg = {
          id: Date.now(), // Local virtual ID
          room: roomId,
          sender_username: data.sender,
          sender_avatar: null,
          content: data.message,
          media_file: data.media_url,
          media_type: data.media_type || 'text',
          reply_to: data.reply_to,
          seen_by_usernames: [],
          created_at: new Date().toISOString()
        };
        set((state) => ({ messages: [...state.messages, newMsg] }));
      } else if (data.type === 'typing') {
        set((state) => ({
          typingStatus: {
            ...state.typingStatus,
            [data.sender]: data.is_typing
          }
        }));
      } else if (data.type === 'reaction') {
        set((state) => {
          const updatedMessages = state.messages.map((m) => {
            if (m.id === data.message_id) {
              const currentReactions = m.reactions || [];
              let newReactions;
              if (data.is_removed) {
                newReactions = currentReactions.filter(r => r.username !== data.user);
              } else {
                const existingIdx = currentReactions.findIndex(r => r.username === data.user);
                if (existingIdx > -1) {
                  newReactions = [...currentReactions];
                  newReactions[existingIdx] = { ...newReactions[existingIdx], reaction: data.reaction };
                } else {
                  newReactions = [...currentReactions, { username: data.user, reaction: data.reaction }];
                }
              }
              return { ...m, reactions: newReactions };
            }
            return m;
          });
          return { messages: updatedMessages };
        });
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    set({ socket });
  },

  sendMessage: async (content, file = null, mediaType = 'text', replyTo = null) => {
    const activeRoom = get().activeRoom;
    const username = localStorage.getItem('username') || 'cyber_pioneer';

    if (!activeRoom) {
      const newMsg = {
        id: Date.now(),
        sender_username: username,
        content: content,
        created_at: new Date().toISOString()
      };
      set((state) => ({ messages: [...state.messages, newMsg] }));
      return;
    }

    const roomId = activeRoom.id;
    let savedMsg = null;

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('media_type', mediaType);
        formData.append('media_file', file);
        if (replyTo) {
          formData.append('reply_to', replyTo);
        }
        res = await api.post(`/chats/rooms/${roomId}/messages/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        res = await api.post(`/chats/rooms/${roomId}/messages/`, {
          content: content,
          media_type: mediaType,
          reply_to: replyTo
        });
      }
      savedMsg = res.data;
      set((state) => ({ messages: [...state.messages, savedMsg] }));
    } catch (err) {
      console.error('Failed to save message to backend via HTTP', err);
    }

    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN && savedMsg) {
      socket.send(JSON.stringify({
        type: 'chat_message',
        message: content,
        sender: username,
        media_url: savedMsg.media_file || '',
        media_type: mediaType,
        reply_to: replyTo
      }));
    }
  },

  setTyping: (isTyping) => {
    const socket = get().socket;
    const username = localStorage.getItem('username') || 'cyber_pioneer';
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing',
        sender: username,
        is_typing: isTyping
      }));
    }
  },

  reactToMessage: async (messageId, reactionEmoji) => {
    const activeRoom = get().activeRoom;
    const username = localStorage.getItem('username') || 'cyber_pioneer';
    if (!activeRoom) return;

    const roomId = activeRoom.id;
    let isRemoved = false;
    let updatedMsg = null;

    try {
      const res = await api.post(`/chats/rooms/${roomId}/messages/${messageId}/react/`, {
        reaction: reactionEmoji
      });
      isRemoved = res.data.is_removed;
      updatedMsg = res.data.message;

      // Update locally
      set((state) => {
        const updatedMessages = state.messages.map((m) => {
          if (m.id === messageId) {
            return { ...m, reactions: updatedMsg.reactions };
          }
          return m;
        });
        return { messages: updatedMessages };
      });
    } catch (err) {
      console.error('Failed to react to message', err);
    }

    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN && updatedMsg) {
      socket.send(JSON.stringify({
        type: 'reaction',
        message_id: messageId,
        user: username,
        reaction: reactionEmoji,
        is_removed: isRemoved
      }));
    }
  }
}));

export default useChatStore;
