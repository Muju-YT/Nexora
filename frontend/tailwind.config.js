/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable toggling dark/light mode class-based
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#090A0F',
          card: '#121420',
          border: '#1F2235',
          light: '#1B1E30',
        },
        cyber: {
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          emerald: '#10B981',
          pink: '#EC4899',
          amber: '#F59E0B',
          glow: '#A855F7',
        }
      },
      boxShadow: {
        'neon-violet': '0 0 15px rgba(139, 92, 246, 0.35), 0 0 3px rgba(139, 92, 246, 0.5)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.35), 0 0 3px rgba(6, 182, 212, 0.5)',
        'neon-pink': '0 0 15px rgba(236, 72, 153, 0.35), 0 0 3px rgba(236, 72, 153, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(139, 92, 246, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
