/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        atelier: {
          canvas: '#0A0A0C',
          surface: '#131317',
          elevated: '#1A1A22',
          card: '#15151B',
          border: 'rgba(245, 242, 235, 0.08)',
          'border-hover': 'rgba(245, 242, 235, 0.16)',
        },
        hw: {
          sand: '#F5F2EB',
          stone: '#8E8B85',
          muted: '#65625D',
          rose: '#E05260',
          'rose-hover': '#EC6472',
          'rose-tint': 'rgba(224, 82, 96, 0.12)',
          champagne: '#E2B77A',
          'champagne-tint': 'rgba(226, 183, 122, 0.12)',
          emerald: '#10B981',
          cyan: '#00E5FF',
        }
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'subtle-pulse': 'subtlePulse 4s ease-in-out infinite',
      },
      keyframes: {
        subtlePulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
