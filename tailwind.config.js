/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#05070a',
          900: '#080b11',
          850: '#0b0f17',
          800: '#0f1420',
          750: '#131927',
          700: '#1a2030',
          650: '#222a3d',
          600: '#2c3548',
          500: '#3a4459',
          400: '#5a6478',
          300: '#7c8699',
          200: '#a8b1c2',
          100: '#cdd4e2',
        },
        emerald: {
          glow: '#00ffa3',
          DEFAULT: '#10e07a',
          deep: '#0a8f54',
        },
        amber: {
          glow: '#ffb627',
          DEFAULT: '#f59e0b',
          deep: '#b45309',
        },
        ruby: {
          glow: '#ff3b5c',
          DEFAULT: '#ef2b48',
          deep: '#a3132a',
        },
        azure: {
          glow: '#38d6ff',
          DEFAULT: '#1ea8e8',
          deep: '#0b6da0',
        },
      },
      boxShadow: {
        'glow-emerald': '0 0 18px -2px rgba(16,224,122,0.55)',
        'glow-amber': '0 0 18px -2px rgba(245,158,11,0.55)',
        'glow-ruby': '0 0 18px -2px rgba(239,43,72,0.55)',
        'glow-azure': '0 0 18px -2px rgba(30,168,232,0.55)',
        'inset-line': 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
      },
      keyframes: {
        pulseRuby: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,43,72,0.55)' },
          '50%': { boxShadow: '0 0 14px 2px rgba(239,43,72,0.0)' },
        },
        pulseEmerald: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16,224,122,0.45)' },
          '50%': { boxShadow: '0 0 12px 2px rgba(16,224,122,0.0)' },
        },
        tickerScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        flowDot: {
          '0%': { opacity: '0.2', transform: 'scaleX(0)' },
          '50%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'scaleX(1)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '94%': { opacity: '0.4' },
          '96%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        rowEnter: {
          '0%': { opacity: '0', transform: 'translateY(-6px)', backgroundColor: 'rgba(16,224,122,0.08)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        rowEnterRuby: {
          '0%': { opacity: '0', transform: 'translateY(-6px)', backgroundColor: 'rgba(239,43,72,0.10)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseRuby: 'pulseRuby 1.4s ease-in-out infinite',
        pulseEmerald: 'pulseEmerald 2s ease-in-out infinite',
        tickerScroll: 'tickerScroll 40s linear infinite',
        scanline: 'scanline 3s linear infinite',
        flicker: 'flicker 4s linear infinite',
        slideInRight: 'slideInRight 0.35s cubic-bezier(0.22,1,0.36,1)',
        rowEnter: 'rowEnter 0.6s ease-out',
        rowEnterRuby: 'rowEnterRuby 0.6s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        spinSlow: 'spinSlow 8s linear infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
