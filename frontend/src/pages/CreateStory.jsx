import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ImagePlus, Check, ChevronLeft, Type, Music,
  AlignCenter, AlignLeft, AlignRight, Search, Play, RotateCcw, Sliders,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import {
  TEXT_STYLES, TEXT_SIZE_VALUES, TEXT_SIZE_LABELS, SONG_LIBRARY, snapAngle,
} from '../constants/storyConstants';

/* ═══════════════════════════════════════════════════════════════════════════
   TEXT STICKER – draggable + rotatable overlay on the canvas
═══════════════════════════════════════════════════════════════════════════ */
const TextSticker = ({
  text, styleObj, sizeIdx, align,
  pos, rotation, selected,
  onPointerDown, onRotatePointerDown,
  onSelect, onDelete, onEdit,
}) => {
  const fontSize = TEXT_SIZE_VALUES[sizeIdx] ?? 28;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
        zIndex: 25,
        // min dimensions so it's easy to grab
        minWidth: 40,
        minHeight: 28,
      }}
      onPointerDown={onPointerDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* ── The text itself ── */}
      <div
        className={styleObj.className}
        style={{
          fontSize,
          textAlign: align,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxWidth: '65vw',
          lineHeight: 1.25,
          ...styleObj.style,
        }}
      >
        {text}
      </div>

      {/* ── Selection handles (only when selected) ── */}
      {selected && (
        <>
          {/* Dashed border */}
          <div style={{
            position: 'absolute', inset: -9,
            border: '1.5px dashed rgba(255,255,255,0.75)',
            borderRadius: 6, pointerEvents: 'none',
          }} />

          {/* Connector line to rotate handle */}
          <div style={{
            position: 'absolute', left: '50%', top: -9,
            width: 1, height: 28,
            background: 'rgba(255,255,255,0.55)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }} />

          {/* Rotate handle – white circle above center */}
          <div
            onPointerDown={onRotatePointerDown}
            style={{
              position: 'absolute', left: '50%', top: -42,
              transform: 'translateX(-50%)',
              width: 28, height: 28, borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'grab', zIndex: 30,
              touchAction: 'none',
            }}
          >
            <RotateCcw style={{ width: 13, height: 13, color: '#111' }} />
          </div>

          {/* Delete – top-left */}
          <div
            onPointerDown={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              position: 'absolute', top: -11, left: -11,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.75)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 30,
            }}
          >
            <X style={{ width: 11, height: 11, color: 'white' }} />
          </div>

          {/* Edit – top-right */}
          <div
            onPointerDown={(e) => { e.stopPropagation(); onEdit(); }}
            style={{
              position: 'absolute', top: -11, right: -11,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.75)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 30,
            }}
          >
            <Type style={{ width: 11, height: 11, color: 'white' }} />
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MUSIC STICKER – draggable + rotatable overlay on the canvas
═══════════════════════════════════════════════════════════════════════════ */
const MusicSticker = ({
  songName, songArtist,
  pos, rotation, selected,
  onPointerDown, onRotatePointerDown,
  onSelect, onDelete,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
        zIndex: 25,
        minWidth: 180,
      }}
      onPointerDown={onPointerDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* ── Music Badge ── */}
      <div className="flex items-center gap-2.5 bg-black/65 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2.5 max-w-[220px]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#833ab4] to-[#fcb045] flex items-center justify-center flex-shrink-0">
          <Music className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white text-[11px] font-bold truncate leading-tight">{songName}</span>
          <span className="text-white/60 text-[10px] truncate leading-tight">{songArtist}</span>
        </div>
        <div className="flex gap-[3px] items-end h-4 flex-shrink-0">
          {[3,5,4,6,3].map((h, i) => (
            <motion.div key={i}
              animate={{ height: [`${h*2}px`, `${(h+3)*2}px`, `${h*2}px`] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1, ease: 'easeInOut' }}
              className="w-[3px] bg-[#fcb045] rounded-full" style={{ height: `${h*2}px` }}
            />
          ))}
        </div>
      </div>

      {/* ── Selection handles (only when selected) ── */}
      {selected && (
        <>
          {/* Dashed border */}
          <div style={{
            position: 'absolute', inset: -9,
            border: '1.5px dashed rgba(255,255,255,0.75)',
            borderRadius: 16, pointerEvents: 'none',
          }} />

          {/* Connector line to rotate handle */}
          <div style={{
            position: 'absolute', left: '50%', top: -9,
            width: 1, height: 28,
            background: 'rgba(255,255,255,0.55)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }} />

          {/* Rotate handle – white circle above center */}
          <div
            onPointerDown={onRotatePointerDown}
            style={{
              position: 'absolute', left: '50%', top: -42,
              transform: 'translateX(-50%)',
              width: 28, height: 28, borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'grab', zIndex: 30,
              touchAction: 'none',
            }}
            data-rotate-handle
          >
            <RotateCcw style={{ width: 13, height: 13, color: '#111' }} />
          </div>

          {/* Delete – top-left */}
          <div
            onPointerDown={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              position: 'absolute', top: -11, left: -11,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.75)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 30,
            }}
          >
            <X style={{ width: 11, height: 11, color: 'white' }} />
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const CreateStory = () => {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();

  /* refs */
  const fileInputRef   = useRef(null);
  const canvasRef      = useRef(null);    // the media container div
  const stickerRef     = useRef(null);    // the TextSticker root div
  const rotateRef      = useRef(null);    // the rotate handle div
  const textInputRef   = useRef(null);
  const musicStickerRef = useRef(null);   // the MusicSticker root div

  /* ── media step ── */
  const [step, setStep]               = useState('pick'); // pick | editor
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [isDragging, setIsDragging]   = useState(false);

  /* ── media adjustments ── */
  const [mediaScale, setMediaScale]   = useState(1.0);
  const [mediaX, setMediaX]           = useState(0.0);
  const [mediaY, setMediaY]           = useState(0.0);
  const [mediaFit, setMediaFit]       = useState('contain');
  const [showResizeTool, setShowResizeTool] = useState(false);

  /* ── text sticker ── */
  const [showTextTool, setShowTextTool] = useState(false);
  const [textValue, setTextValue]     = useState('');
  const [textStyleIdx, setTextStyleIdx] = useState(0);
  const [textSizeIdx, setTextSizeIdx] = useState(2);
  const [textAlign, setTextAlign]     = useState('center');
  const [stickerPos, setStickerPos]   = useState({ x: 50, y: 45 }); // %
  const [stickerRot, setStickerRot]   = useState(0);                 // degrees
  const [stickerSel, setStickerSel]   = useState(false);

  /* ── music tool & sticker ── */
  const [showMusicTool, setShowMusicTool] = useState(false);
  const [songQuery, setSongQuery]     = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [musicPos, setMusicPos]       = useState({ x: 50, y: 75 });
  const [musicRot, setMusicRot]       = useState(0);
  const [musicSel, setMusicSel]       = useState(false);

  /* ── upload ── */
  const [isPosting, setIsPosting]     = useState(false);
  const [posted, setPosted]           = useState(false);

  const myAvatarUrl = user?.profile?.avatar
    ? (user.profile.avatar.startsWith('http') ? user.profile.avatar : `http://127.0.0.1:8000${user.profile.avatar}`)
    : null;
  const myUsername  = user?.username || 'You';
  const myInitial   = myUsername[0]?.toUpperCase() || '?';

  const textStyleObj = TEXT_STYLES[textStyleIdx] ?? TEXT_STYLES[0];

  /* focus text input when panel opens */
  useEffect(() => {
    if (showTextTool) setTimeout(() => textInputRef.current?.focus(), 80);
  }, [showTextTool]);

  /* ── File handling ─────────────────────────────────────────────────────── */
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Only images and videos are supported.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('editor');
  }, []);

  const handleInputChange = (e) => handleFileSelect(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };
  const handleBack = () => {
    setSelectedFile(null); setPreviewUrl(null);
    setTextValue(''); setSelectedSong(null);
    setStickerSel(false); setStickerRot(0); setStickerPos({ x: 50, y: 45 });
    setMusicSel(false); setMusicRot(0); setMusicPos({ x: 50, y: 75 });
    setMediaScale(1.0); setMediaX(0.0); setMediaY(0.0); setMediaFit('contain');
    setShowTextTool(false); setShowMusicTool(false); setShowResizeTool(false);
    setStep('pick');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Sticker DRAG handler ──────────────────────────────────────────────── */
  const handleStickerPointerDown = useCallback((e) => {
    // If the rotate handle fired this, ignore (it has its own handler)
    if (e.target.closest('[data-rotate-handle]')) return;
    if (e.button !== undefined && e.button !== 0) return; // mouse: left only
    e.preventDefault();
    e.stopPropagation();
    setStickerSel(true);
    setMusicSel(false);

    const canvas  = canvasRef.current;
    const sticker = stickerRef.current;
    if (!canvas || !sticker) return;

    const canvasRect  = canvas.getBoundingClientRect();
    const stickerRect = sticker.getBoundingClientRect();

    // Offset: distance from pointer to sticker center (so it doesn't jump)
    const offsetX = e.clientX - (stickerRect.left + stickerRect.width  / 2);
    const offsetY = e.clientY - (stickerRect.top  + stickerRect.height / 2);

    const onMove = (ev) => {
      const newCX = ev.clientX - offsetX;
      const newCY = ev.clientY - offsetY;
      setStickerPos({
        x: Math.max(4, Math.min(96, ((newCX - canvasRect.left) / canvasRect.width)  * 100)),
        y: Math.max(4, Math.min(96, ((newCY - canvasRect.top)  / canvasRect.height) * 100)),
      });
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, []);

  /* ── Sticker ROTATE handler ────────────────────────────────────────────── */
  const handleRotatePointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const sticker = stickerRef.current;
    if (!sticker) return;
    const rect    = sticker.getBoundingClientRect();
    const cx      = rect.left + rect.width  / 2;
    const cy      = rect.top  + rect.height / 2;

    const onMove = (ev) => {
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      // atan2 gives angle from +x axis; +90° so 0 = pointing up
      const raw = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      setStickerRot(snapAngle(raw));
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, []);

  /* ── Music Sticker DRAG handler ────────────────────────────────────────── */
  const handleMusicPointerDown = useCallback((e) => {
    if (e.target.closest('[data-rotate-handle]')) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setMusicSel(true);
    setStickerSel(false);

    const canvas  = canvasRef.current;
    const sticker = musicStickerRef.current;
    if (!canvas || !sticker) return;

    const canvasRect  = canvas.getBoundingClientRect();
    const stickerRect = sticker.getBoundingClientRect();

    const offsetX = e.clientX - (stickerRect.left + stickerRect.width  / 2);
    const offsetY = e.clientY - (stickerRect.top  + stickerRect.height / 2);

    const onMove = (ev) => {
      const newCX = ev.clientX - offsetX;
      const newCY = ev.clientY - offsetY;
      setMusicPos({
        x: Math.max(4, Math.min(96, ((newCX - canvasRect.left) / canvasRect.width)  * 100)),
        y: Math.max(4, Math.min(96, ((newCY - canvasRect.top)  / canvasRect.height) * 100)),
      });
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, []);

  /* ── Music Sticker ROTATE handler ──────────────────────────────────────── */
  const handleMusicRotatePointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const sticker = musicStickerRef.current;
    if (!sticker) return;
    const rect    = sticker.getBoundingClientRect();
    const cx      = rect.left + rect.width  / 2;
    const cy      = rect.top  + rect.height / 2;

    const onMove = (ev) => {
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      const raw = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      setMusicRot(snapAngle(raw));
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, []);

  /* ── Media Background PAN handler ──────────────────────────────────────── */
  const handleMediaPointerDown = useCallback((e) => {
    // Only drag media if click was directly on the background canvas, not a sticker or active overlay/panel
    if (e.target.closest('[data-sticker]') || e.target.closest('button') || e.target.closest('[data-panel]')) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = mediaX;
    const initialY = mediaY;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      // Convert pixel translation to percentage of the canvas dimension
      setMediaX(initialX + (dx / canvasRect.width) * 100);
      setMediaY(initialY + (dy / canvasRect.height) * 100);
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, [mediaX, mediaY]);

  /* ── Post ──────────────────────────────────────────────────────────────── */
  const handlePost = async () => {
    if (!selectedFile || isPosting) return;
    setIsPosting(true);
    const fd = new FormData();
    fd.append('media', selectedFile);
    fd.append('media_scale', mediaScale);
    fd.append('media_x', mediaX);
    fd.append('media_y', mediaY);
    fd.append('media_fit', mediaFit);

    if (textValue.trim()) {
      fd.append('text_overlay',  textValue.trim());
      fd.append('text_x',        stickerPos.x);
      fd.append('text_y',        stickerPos.y);
      fd.append('text_rotation', stickerRot);
      fd.append('text_style_id', textStyleObj.id);
      fd.append('text_size_idx', textSizeIdx);
    }
    if (selectedSong) {
      fd.append('song_name',      selectedSong.name);
      fd.append('song_artist',    selectedSong.artist);
      fd.append('music_x',        musicPos.x);
      fd.append('music_y',        musicPos.y);
      fd.append('music_rotation', musicRot);
    }
    try {
      await api.post('/stories/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosted(true);
      setTimeout(() => navigate('/'), 1400);
    } catch (err) {
      console.error('Failed to post story', err);
      alert('Failed to share story. Please try again.');
      setIsPosting(false);
    }
  };

  const filteredSongs = SONG_LIBRARY.filter(s =>
    s.name.toLowerCase().includes(songQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(songQuery.toLowerCase())
  );

  /* ══════════════════════════════════════════════════════════════════════════
     SUCCESS SCREEN
  ═══════════════════════════════════════════════════════════════════════════ */
  if (posted) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-5 forced-dark">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] flex items-center justify-center shadow-[0_0_40px_rgba(225,48,108,0.5)]"
        >
          <Check className="w-9 h-9 text-white stroke-[3]" />
        </motion.div>
        <p className="text-white font-bold text-lg">Story shared!</p>
        <p className="text-slate-400 text-sm">Visible to followers for 24 hours</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     STEP 1 – PICK MEDIA
  ═══════════════════════════════════════════════════════════════════════════ */
  if (step === 'pick') {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col forced-dark">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white font-bold text-sm">New story</span>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-sm aspect-[9/14] rounded-3xl border-2 border-dashed flex flex-col
              items-center justify-center gap-5 cursor-pointer transition-all duration-300 relative overflow-hidden
              ${isDragging ? 'border-[#E1306C] bg-[#E1306C]/10' : 'border-white/20 hover:border-white/40 bg-white/[0.03]'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#833ab4]/10 via-[#fd1d1d]/5 to-[#fcb045]/10 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] p-[2px]">
                <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Select photo or video</p>
                <p className="text-slate-500 text-xs mt-1">or drag and drop here</p>
              </div>
              <div className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-sm font-semibold">
                Select from gallery
              </div>
              <p className="text-slate-600 text-[11px] uppercase tracking-widest">JPG · PNG · MP4 · GIF</p>
            </div>
          </motion.div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleInputChange} />
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     STEP 2 – EDITOR
  ═══════════════════════════════════════════════════════════════════════════ */
  const anyPanelOpen = showTextTool || showMusicTool || showResizeTool;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center forced-dark overflow-hidden select-none">

      {/* ── Blurred viewport background duplication ── */}
      {previewUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {selectedFile?.type?.startsWith('video/') ? (
            <video src={previewUrl} autoPlay loop muted playsInline className="w-full h-full object-cover scale-110 blur-3xl opacity-35" />
          ) : (
            <img src={previewUrl} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-35" />
          )}
        </div>
      )}

      {/* ── Main Premium aspect-ratio Story Card ── */}
      <div
        ref={canvasRef}
        className="relative w-full h-full md:h-[92vh] md:max-h-[860px] md:w-auto md:aspect-[9/16] bg-black md:rounded-2xl md:shadow-2xl md:border md:border-white/10 flex items-center justify-center overflow-hidden"
        onPointerDown={handleMediaPointerDown}
        onClick={() => { setStickerSel(false); setMusicSel(false); }} // click canvas = deselect stickers
      >
        {/* Canvas underlay blurred background duplicate inside card */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none md:rounded-2xl">
          {selectedFile?.type?.startsWith('video/') ? (
            <video src={previewUrl} autoPlay loop muted playsInline className="w-full h-full object-cover scale-110 blur-xl opacity-40" />
          ) : (
            <img src={previewUrl} alt="" className="w-full h-full object-cover scale-110 blur-xl opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75 pointer-events-none" />
        </div>

        {/* Foreground containment media player */}
        {selectedFile?.type?.startsWith('video/') ? (
          <video
            src={previewUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full relative z-10 pointer-events-none select-none md:rounded-2xl"
            style={{
              objectFit: mediaFit,
              transform: `translate(${mediaX}%, ${mediaY}%) scale(${mediaScale})`,
              transition: 'transform 0.05s ease-out',
            }}
          />
        ) : (
          <img
            src={previewUrl}
            alt=""
            className="w-full h-full relative z-10 pointer-events-none select-none md:rounded-2xl"
            style={{
              objectFit: mediaFit,
              transform: `translate(${mediaX}%, ${mediaY}%) scale(${mediaScale})`,
              transition: 'transform 0.05s ease-out',
            }}
          />
        )}

        {/* Gradient overlay above media */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 z-15 pointer-events-none md:rounded-2xl" />

        {/* ── Top bar (inside canvas) ── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-4 pb-2 pointer-events-none">
          <button className="pointer-events-auto p-1.5 -ml-1 text-white" onClick={handleBack}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 mx-3">
            <div className="w-full h-[3px] bg-white/30 rounded-full">
              <div className="h-full bg-white rounded-full w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {myAvatarUrl
              ? <img src={myAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-white/60" />
              : <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#C13584] flex items-center justify-center text-xs font-black text-white">{myInitial}</div>
            }
            <span className="text-white text-xs font-bold drop-shadow">{myUsername}</span>
          </div>
        </div>

        {/* ── Right-side tool buttons ── */}
        {!anyPanelOpen && (
          <div className="absolute top-16 right-3 z-30 flex flex-col gap-3 pointer-events-auto">
            {[
              { icon: Type,    label: 'Text',   action: () => { setShowTextTool(true);  setShowMusicTool(false); setShowResizeTool(false); } },
              { icon: Music,   label: 'Music',  action: () => { setShowMusicTool(true); setShowTextTool(false);  setShowResizeTool(false); } },
              { icon: Sliders, label: 'Resize', action: () => { setShowResizeTool(true); setShowTextTool(false);  setShowMusicTool(false); } },
            ].map(({ icon: Icon, label, action }) => (
              <motion.button key={label} whileTap={{ scale: 0.88 }} onClick={action}
                className="w-10 h-10 rounded-full flex flex-col items-center justify-center gap-0.5 bg-black/45 text-white border border-white/20 hover:bg-black/65 backdrop-blur-sm transition-all animate-fade-in"
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-bold leading-none">{label}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* ── Draggable / rotatable text sticker on canvas ── */}
        {textValue.trim() && !showTextTool && (
          <div ref={stickerRef} data-sticker>
            <TextSticker
              text={textValue}
              styleObj={textStyleObj}
              sizeIdx={textSizeIdx}
              align={textAlign}
              pos={stickerPos}
              rotation={stickerRot}
              selected={stickerSel}
              onPointerDown={handleStickerPointerDown}
              onRotatePointerDown={handleRotatePointerDown}
              onSelect={() => { setStickerSel(true); setMusicSel(false); }}
              onDelete={() => { setTextValue(''); setStickerSel(false); }}
              onEdit={() => { setShowTextTool(true); setStickerSel(false); }}
            />
          </div>
        )}

        {/* ── Draggable / rotatable music sticker on canvas ── */}
        {selectedSong && !showMusicTool && (
          <div ref={musicStickerRef} data-sticker>
            <MusicSticker
              songName={selectedSong.name}
              songArtist={selectedSong.artist}
              pos={musicPos}
              rotation={musicRot}
              selected={musicSel}
              onPointerDown={handleMusicPointerDown}
              onRotatePointerDown={handleMusicRotatePointerDown}
              onSelect={() => { setMusicSel(true); setStickerSel(false); }}
              onDelete={() => { setSelectedSong(null); setMusicSel(false); }}
            />
          </div>
        )}

        {/* ── Bottom share bar ── */}
        {!anyPanelOpen && (
          <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-8 pt-3 pointer-events-auto">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handlePost} disabled={isPosting}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(225,48,108,0.4)]"
              >
                {isPosting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Sharing...</span></>
                  : 'Share to story'
                }
              </motion.button>
              <button onClick={() => navigate('/')}
                className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-white/40 text-[11px] mt-2.5 tracking-wide">Story disappears after 24 hours</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TEXT TOOL PANEL (slide in from right)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTextTool && (
          <motion.div
            key="text-panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="w-full md:w-80 bg-[#0a0a0a]/98 border-l border-white/10 flex flex-col z-40 absolute inset-y-0 right-0 md:relative h-full md:h-[92vh] md:max-h-[860px] md:rounded-2xl md:border md:border-white/10 md:ml-4"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <Type className="w-4 h-4" /> Add Text
              </span>
              <button onClick={() => setShowTextTool(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

              {/* Text input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#a8a8a8' }}>Your text</label>
                <textarea
                  ref={textInputRef}
                  value={textValue}
                  onChange={e => setTextValue(e.target.value)}
                  placeholder="Type something..."
                  maxLength={120}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder-slate-600 outline-none focus:border-white/30 resize-none"
                  style={{ color: '#ffffff' }}
                />
                <span className="text-[10px] text-right" style={{ color: '#64748b' }}>{textValue.length}/120</span>
              </div>

              {/* Style presets */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#a8a8a8' }}>Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {TEXT_STYLES.map((s, i) => (
                    <button key={s.id} onClick={() => setTextStyleIdx(i)}
                      className={`py-2.5 px-1 rounded-xl border transition-all ${textStyleIdx === i ? 'border-white/60 bg-white/10' : 'border-white/10 hover:border-white/25'}`}
                    >
                      <span className={`${s.className} text-xs`} style={{ fontSize: 12, ...s.style }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#a8a8a8' }}>Size</label>
                <div className="flex gap-2 items-end">
                  {TEXT_SIZE_LABELS.map((lbl, i) => (
                    <button key={i} onClick={() => setTextSizeIdx(i)}
                      className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center transition-all ${textSizeIdx === i ? 'border-white/60 bg-white/10' : 'border-white/10 hover:border-white/20'}`}
                    >
                      <span className="font-bold" style={{ fontSize: [10, 12, 14, 17, 21][i], color: '#ffffff' }}>A</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#a8a8a8' }}>Align</label>
                <div className="flex gap-2">
                  {[
                    { id: 'left', icon: AlignLeft },
                    { id: 'center', icon: AlignCenter },
                    { id: 'right', icon: AlignRight },
                  ].map(({ id, icon: Icon }) => (
                    <button key={id} onClick={() => setTextAlign(id)}
                      className={`flex-1 py-2 rounded-xl border flex items-center justify-center transition-all ${textAlign === id ? 'border-white/60 bg-white/10 text-white' : 'border-white/10 text-slate-500'}`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              {textValue.trim() && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex justify-center items-center min-h-[72px] overflow-hidden">
                  <span
                    className={textStyleObj.className}
                    style={{ fontSize: TEXT_SIZE_VALUES[textSizeIdx], textAlign: textAlign, wordBreak: 'break-word', color: '#ffffff', ...textStyleObj.style }}
                  >
                    {textValue}
                  </span>
                </div>
              )}

              {/* Rotation hint */}
              <div className="rounded-xl bg-white/3 border border-white/8 p-3 flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  After pressing <span className="text-white font-bold">Done</span>, tap the text on the canvas to select it. Drag to move, use the <span className="text-white font-bold">⟳ handle</span> above to rotate freely.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => { setShowTextTool(false); setStickerSel(true); }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#833ab4] to-[#E1306C] text-sm font-bold"
                style={{ color: '#ffffff' }}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          RESIZE TOOL PANEL (slide in from right)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showResizeTool && (
          <motion.div
            key="resize-panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="w-full md:w-80 bg-[#0a0a0a]/98 border-l border-white/10 flex flex-col z-40 absolute inset-y-0 right-0 md:relative h-full md:h-[92vh] md:max-h-[860px] md:rounded-2xl md:border md:border-white/10 md:ml-4"
            data-panel
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Resize & Fit
              </span>
              <button onClick={() => setShowResizeTool(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#a8a8a8]">Aspect Fit Mode</label>
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                  <button onClick={() => setMediaFit('contain')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mediaFit === 'contain' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Fit (Contain)</button>
                  <button onClick={() => setMediaFit('cover')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mediaFit === 'cover' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Fill (Cover)</button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#a8a8a8]">Scale / Zoom</label>
                  <span className="text-xs text-white/80 font-mono font-semibold">{mediaScale.toFixed(2)}x</span>
                </div>
                <input type="range" min="0.5" max="3.0" step="0.05" value={mediaScale} onChange={(e) => setMediaScale(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E1306C]" />
              </div>
              <button onClick={() => { setMediaScale(1.0); setMediaX(0.0); setMediaY(0.0); setMediaFit('contain'); }} className="py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> Reset Layout & Position
              </button>
            </div>
            <div className="p-4 border-t border-white/10">
              <button onClick={() => setShowResizeTool(false)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#833ab4] to-[#E1306C] text-sm font-bold text-[#ffffff] shadow-lg">Save Layout</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MUSIC TOOL PANEL
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showMusicTool && (
          <motion.div
            key="music-panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="w-full md:w-80 bg-[#0a0a0a]/98 border-l border-white/10 flex flex-col z-40 absolute inset-y-0 right-0 md:relative h-full md:h-[92vh] md:max-h-[860px] md:rounded-2xl md:border md:border-white/10 md:ml-4"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <Music className="w-4 h-4" /> Add Music
              </span>
              <button onClick={() => setShowMusicTool(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <input
                  value={songQuery} onChange={e => setSongQuery(e.target.value)}
                  placeholder="Search songs, artists..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder-slate-600"
                  style={{ color: '#ffffff' }}
                />
                {songQuery && <button onClick={() => setSongQuery('')} className="text-slate-500"><X className="w-3.5 h-3.5" /></button>}
              </div>
            </div>

            {selectedSong && (
              <div className="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-r from-[#833ab4]/20 to-[#fcb045]/10 border border-white/15 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#833ab4] to-[#fcb045] flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate" style={{ color: '#ffffff' }}>{selectedSong.name}</p>
                  <p className="text-slate-400 text-[11px] truncate" style={{ color: '#a8a8a8' }}>{selectedSong.artist}</p>
                </div>
                <div className="flex gap-[3px] items-end h-4">
                  {[3,5,4,6,3].map((h, i) => (
                    <motion.div key={i}
                      animate={{ height: [`${h*2}px`, `${(h+3)*2}px`, `${h*2}px`] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1, ease: 'easeInOut' }}
                      className="w-[3px] bg-[#fcb045] rounded-full" style={{ height: `${h*2}px` }}
                    />
                  ))}
                </div>
                <button onClick={() => setSelectedSong(null)} className="text-slate-500 ml-1"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {filteredSongs.map(song => (
                <motion.button key={song.id} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSong(song)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left mb-1
                    ${selectedSong?.id === song.id ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                    {song.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: '#ffffff' }}>{song.name}</p>
                    <p className="text-[11px] truncate" style={{ color: '#a8a8a8' }}>{song.artist}</p>
                  </div>
                  {selectedSong?.id === song.id
                    ? <div className="flex gap-[3px] items-end h-4">
                        {[3,5,4,6,3].map((h,i) => (
                          <motion.div key={i}
                            animate={{ height: [`${h*2}px`, `${(h+3)*2}px`, `${h*2}px`] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1, ease: 'easeInOut' }}
                            className="w-[3px] bg-[#E1306C] rounded-full" style={{ height: `${h*2}px` }}
                          />
                        ))}
                      </div>
                    : <Play className="w-4 h-4 text-slate-600" />
                  }
                </motion.button>
              ))}
            </div>

            <div className="p-4 border-t border-white/10">
              <button onClick={() => setShowMusicTool(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#833ab4] to-[#E1306C] text-sm font-bold"
                style={{ color: '#ffffff' }}
              >
                {selectedSong ? `Use "${selectedSong.name}"` : 'Done'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateStory;
