// Shared story constants — used by both CreateStory and StoriesViewer

export const TEXT_STYLES = [
  {
    id: 'classic',
    label: 'Classic',
    className: 'font-bold text-white',
    style: { textShadow: '0 2px 8px rgba(0,0,0,0.8)', color: '#ffffff' },
  },
  {
    id: 'neon',
    label: 'Neon',
    className: 'font-black text-[#E1306C]',
    style: { textShadow: '0 0 12px #E1306C, 0 0 24px #E1306C88' },
  },
  {
    id: 'pill',
    label: 'Pill',
    className: 'font-bold text-white',
    style: { background: 'rgba(0,0,0,0.65)', padding: '4px 14px', borderRadius: 999, color: '#ffffff' },
  },
  {
    id: 'solid',
    label: 'Solid',
    className: 'font-bold text-black',
    style: { background: 'white', padding: '4px 14px', borderRadius: 8 },
  },
  {
    id: 'outline',
    label: 'Outline',
    className: 'font-black text-white',
    style: { textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000', color: '#ffffff' },
  },
  {
    id: 'gradient',
    label: 'Gradient',
    className: 'font-black',
    style: {
      background: 'linear-gradient(90deg,#FCAF45,#E1306C,#C13584)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
  },
];

// px sizes for canvas (in rem-ish values, kept as numeric for inline styles)
export const TEXT_SIZE_VALUES = [14, 20, 28, 40, 56]; // px
export const TEXT_SIZE_LABELS = ['S', 'M', 'L', 'XL', 'XXL'];

export const SONG_LIBRARY = [
  { id: 1,  name: 'Blinding Lights',      artist: 'The Weeknd',      emoji: '🌃' },
  { id: 2,  name: 'As It Was',            artist: 'Harry Styles',    emoji: '🌊' },
  { id: 3,  name: 'Flowers',              artist: 'Miley Cyrus',     emoji: '🌸' },
  { id: 4,  name: 'Cruel Summer',         artist: 'Taylor Swift',    emoji: '☀️' },
  { id: 5,  name: 'Levitating',           artist: 'Dua Lipa',        emoji: '🪐' },
  { id: 6,  name: 'Stay',                 artist: 'Justin Bieber',   emoji: '💫' },
  { id: 7,  name: 'Heat Waves',           artist: 'Glass Animals',   emoji: '🌊' },
  { id: 8,  name: 'Peaches',              artist: 'Justin Bieber',   emoji: '🍑' },
  { id: 9,  name: 'Good 4 U',             artist: 'Olivia Rodrigo',  emoji: '💚' },
  { id: 10, name: 'Bad Guy',              artist: 'Billie Eilish',   emoji: '🖤' },
  { id: 11, name: 'Dynamite',             artist: 'BTS',             emoji: '💥' },
  { id: 12, name: 'Permission to Dance',  artist: 'BTS',             emoji: '💃' },
  { id: 13, name: 'Shape of You',         artist: 'Ed Sheeran',      emoji: '❤️' },
  { id: 14, name: 'Starboy',              artist: 'The Weeknd',      emoji: '⭐' },
];

/** Snaps angle to nearest 0 / 90 / 180 / 270 if within threshold degrees */
export const snapAngle = (angle, threshold = 8) => {
  const n = ((angle % 360) + 360) % 360;
  const snaps = [0, 90, 180, 270, 360];
  const closest = snaps.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
  return Math.abs(closest - n) < threshold ? closest % 360 : angle;
};
