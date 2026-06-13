/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A0B',
          surface: '#111113',
          card: '#1A1A1E',
          hover: '#222228',
        },
        border: {
          subtle: '#2A2A30',
          DEFAULT: '#3A3A42',
        },
        gold: {
          DEFAULT: '#EAB308',
          light: '#FCD34D',
          dark: '#CA8A04',
        },
        content: {
          primary: '#F1F1F3',
          secondary: '#C1C1C8',
          muted: '#8B8B96',
          disabled: '#4A4A52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        gold: '0 0 20px rgba(234,179,8,0.4), 0 0 40px rgba(234,179,8,0.15)',
        'gold-sm': '0 0 10px rgba(234,179,8,0.3)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
        modal: '0 24px 64px rgba(0,0,0,0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
