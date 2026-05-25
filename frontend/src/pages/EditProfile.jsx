import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, CheckCircle2, Camera, MapPin, Briefcase, X, ZoomIn, Sliders, RefreshCw, Move } from 'lucide-react';
import CyberInput from '../components/CyberInput';
import CyberButton from '../components/CyberButton';
import GlowCard from '../components/GlowCard';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [profession, setProfession] = useState('');
  const [locationText, setLocationText] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Profile image cropper states
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

  // AI assistant states
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiInterests, setAiInterests] = useState('');

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return `http://127.0.0.1:8000${avatar}`;
  };

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/auth/me/');
        const profile = res.data.profile || {};
        setProfession(profile.profession || '');
        setLocationText(profile.location || '');
        setBio(profile.bio || '');
        if (profile.avatar) {
          setAvatarPreview(getAvatarUrl(profile.avatar));
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentProfile();
  }, []);

  const constrainOffsets = (x, y, currentZoom, size) => {
    const viewportSize = 256;
    const scaledW = size.width * currentZoom;
    const scaledH = size.height * currentZoom;
    
    const maxTranslateX = Math.max(0, (scaledW - viewportSize) / 2);
    const maxTranslateY = Math.max(0, (scaledH - viewportSize) / 2);
    
    return {
      x: Math.min(maxTranslateX, Math.max(-maxTranslateX, x)),
      y: Math.min(maxTranslateY, Math.max(-maxTranslateY, y))
    };
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (originalImageSrc) {
        URL.revokeObjectURL(originalImageSrc);
      }
      const src = URL.createObjectURL(file);
      setOriginalFile(file);
      setOriginalImageSrc(src);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImageSize({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
      setShowCropModal(true);
      e.target.value = ''; // Reset to allow re-selecting same file
    }
  };

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
    setOffset(prev => constrainOffsets(prev.x, prev.y, newZoom, imageSize));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    const constrained = constrainOffsets(nextX, nextY, zoom, imageSize);
    setOffset(constrained);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const nextX = e.touches[0].clientX - dragStart.x;
    const nextY = e.touches[0].clientY - dragStart.y;
    const constrained = constrainOffsets(nextX, nextY, zoom, imageSize);
    setOffset(constrained);
  };

  const handleApplyCrop = () => {
    if (!originalImageSrc) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      const scaleRatio = 400 / 256;
      
      let drawW, drawH;
      const aspect = img.naturalWidth / img.naturalHeight;
      if (aspect > 1) {
        drawH = 400;
        drawW = 400 * aspect;
      } else {
        drawW = 400;
        drawH = 400 / aspect;
      }
      
      // Translate to canvas center + scaled offset
      ctx.translate(200 + offset.x * scaleRatio, 200 + offset.y * scaleRatio);
      
      // Scale by zoom
      ctx.scale(zoom, zoom);
      
      // Draw image centered
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const fileExtension = originalFile.name.substring(originalFile.name.lastIndexOf('.')) || '.jpg';
          const croppedFile = new File([blob], `avatar_cropped${fileExtension}`, { type: blob.type });
          
          if (avatarPreview && avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
          }
          setAvatarFile(croppedFile);
          setAvatarPreview(URL.createObjectURL(blob));
          setShowCropModal(false);
        }
      }, originalFile.type || 'image/jpeg', 0.95);
    };
  };

  const handleGenerateAIBio = async () => {
    if (!profession) return alert("Please specify your profession first.");
    setLoadingAi(true);
    try {
      const interestsArray = aiInterests ? aiInterests.split(',').map(i => i.trim()) : [];
      const res = await api.post('/ai/bio/', { profession, interests: interestsArray });
      setBio(res.data.bio);
    } catch (err) {
      setBio(`Creative ${profession} exploring new digital frontiers and sharing standard moments. #passion`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('profession', profession);
      formData.append('location', locationText);
      formData.append('bio', bio);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.patch('/auth/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update global store auth user state
      setUser(res.data);
      alert("Profile updated successfully!");
      navigate('/profile');
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile details. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center text-slate-100">
        <div className="w-8 h-8 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 select-none">
      
      {/* Top action header bar */}
      <div className="flex items-center gap-3 mb-6 bg-obsidian-card p-4 rounded-2xl border border-obsidian-border shadow-glass">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 rounded-full hover:bg-obsidian-light text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Edit Profile</h2>
          <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Customize your personal identity card</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Avatar Image Picker Card */}
        <GlowCard hoverable={false} className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-2 border-cyber-pink p-0.5 overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-3xl font-black text-white">
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full cursor-pointer transition-opacity text-white">
              <Camera className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <span className="text-xs font-bold text-cyber-pink uppercase tracking-widest cursor-pointer relative">
            Change Profile Photo
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </span>
        </GlowCard>

        {/* AI Generator Helper */}
        <div className="p-4 rounded-2xl bg-cyber-pink/5 border border-cyber-pink/20 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyber-pink text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} /> Nexora AI Bio Assistant
          </div>
          <span className="text-[10px] text-slate-400 leading-relaxed">
            Provide key interests separated by commas to generate a beautiful, premium bio automatically.
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text"
              placeholder="e.g. photography, traveling, coding, coffee" 
              value={aiInterests}
              onChange={(e) => setAiInterests(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-obsidian border border-obsidian-border rounded-xl text-white outline-none focus:border-cyber-pink transition-colors"
            />
            <button
              type="button"
              disabled={loadingAi || !profession}
              onClick={handleGenerateAIBio}
              className="px-4 py-2.5 bg-cyber-pink hover:bg-cyber-pink/85 disabled:opacity-40 disabled:hover:bg-cyber-pink text-white text-[10px] font-black rounded-xl uppercase tracking-widest cursor-pointer transition-colors"
            >
              {loadingAi ? 'Synthesizing...' : 'Generate Bio'}
            </button>
          </div>
        </div>

        {/* Basic Fields */}
        <GlowCard hoverable={false} className="p-6 flex flex-col gap-5">
          <CyberInput 
            label="Profession" 
            placeholder="e.g. Travel Photographer" 
            value={profession} 
            onChange={(e) => setProfession(e.target.value)} 
            required
          />

          <CyberInput 
            label="Location" 
            placeholder="e.g. San Francisco, CA" 
            value={locationText} 
            onChange={(e) => setLocationText(e.target.value)} 
            required
          />

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Bio Description</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full h-32 p-3 bg-obsidian border border-obsidian-border rounded-xl outline-none text-white focus:border-cyber-pink text-xs md:text-sm transition-colors"
              required
            />
          </div>

          <CyberButton 
            type="submit" 
            variant="pink" 
            className="w-full mt-2 py-3"
            disabled={updating}
          >
            {updating ? 'Saving changes...' : 'Save Profile'}
          </CyberButton>
        </GlowCard>
      </form>

      {/* Profile Photo Cropper/Adjuster Modal */}
      {showCropModal && originalImageSrc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-obsidian-card border border-obsidian-border rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-fade-in select-none">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-obsidian-border bg-obsidian-card">
              <button 
                type="button" 
                onClick={() => setShowCropModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-obsidian-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[12px] font-black text-white uppercase tracking-widest">Adjust Photo</span>
              <button 
                type="button" 
                onClick={handleApplyCrop}
                className="text-xs font-black text-cyber-pink hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Viewport Interactive Area */}
            <div className="py-8 flex flex-col items-center justify-center bg-black/40 relative overflow-hidden select-none">
              <div 
                className="w-64 h-64 rounded-full border-2 border-white pointer-events-none relative shadow-[0_0_0_9999px_rgba(10,10,12,0.75),0_0_15px_rgba(219,39,119,0.3)] z-10"
              />
              <div 
                className="w-64 h-64 rounded-full absolute overflow-hidden bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img 
                  src={originalImageSrc} 
                  alt="Crop Preview" 
                  className="pointer-events-none select-none max-w-none origin-center"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    width: imageSize.width ? `${imageSize.width}px` : 'auto',
                    height: imageSize.height ? `${imageSize.height}px` : 'auto',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                  }}
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight } = e.target;
                    const viewportSize = 256;
                    const aspect = naturalWidth / naturalHeight;
                    let w, h;
                    if (aspect > 1) {
                      h = viewportSize;
                      w = viewportSize * aspect;
                    } else {
                      w = viewportSize;
                      h = viewportSize / aspect;
                    }
                    setImageSize({ width: w, height: h, naturalWidth, naturalHeight });
                  }}
                />
              </div>
            </div>

            {/* Controls panel */}
            <div className="px-6 py-4 flex flex-col gap-4 bg-obsidian-card border-t border-obsidian-border">
              <div className="flex items-center gap-3">
                <ZoomIn className="w-4 h-4 text-slate-400" />
                <input 
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="flex-1 accent-cyber-pink bg-obsidian h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-400 tracking-wider w-8 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  className="flex-1 py-2 bg-obsidian border border-obsidian-border text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="flex-1 py-2 bg-cyber-pink hover:bg-cyber-pink/85 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg cursor-pointer animate-pulse"
                  style={{ animationDuration: '3s' }}
                >
                  Save Photo
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;
