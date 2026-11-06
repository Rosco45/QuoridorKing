/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          dark: '#1e1b18',
          wood: '#2c2523',
          slot: '#141210',
          tile: '#3d3430',
          tileHover: '#4e433e',
        },
        player1: {
          DEFAULT: '#38bdf8', // Cyan / Sky blue
          glow: 'rgba(56, 189, 248, 0.4)',
          dark: '#0284c7',
        },
        player2: {
          DEFAULT: '#f97316', // Amber / Orange
          glow: 'rgba(249, 115, 22, 0.4)',
          dark: '#c2410c',
        }
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pop-in': 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
