/** @type {import('tailwindcss').Config} */
// Design tokens del sistema: dashboard oscuro cálido con glassmorphism.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0E0A08',
        surface: {
          DEFAULT: '#1E1511',
          from: '#1E1511',
          to: '#140E0B',
          2: '#2A1D16',
          3: '#38271D', // hover de surface-2
        },
        border: 'rgba(255,255,255,0.06)',
        primary: {
          DEFAULT: '#FF7A2F',
          from: '#FF7A2F',
          to: '#F05A14',
        },
        success: '#5EE6A8',
        danger: '#F87171',
        text: '#F5EEE8',
        muted: '#A3948A',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        kpi: ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 36px
        'kpi-lg': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 40px
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'surface-grad': 'linear-gradient(160deg, #1E1511 0%, #140E0B 100%)',
        'primary-grad': 'linear-gradient(135deg, #FF7A2F 0%, #F05A14 100%)',
        'promo-grad': 'linear-gradient(140deg, #FF8A45 0%, #F05A14 55%, #B93C08 100%)',
      },
      boxShadow: {
        card: '0 18px 40px -18px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.03)',
        primary: '0 10px 28px -8px rgba(240,90,20,0.55)',
        success: '0 0 22px rgba(94,230,168,0.45)',
        float: '0 20px 50px -12px rgba(0,0,0,0.8)',
      },
      transitionDuration: {
        DEFAULT: '180ms',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 200ms ease-out both',
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
