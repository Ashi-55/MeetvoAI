import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--page-bg)',
        background: 'var(--page-bg)',
        surface: 'var(--card-bg)',
        surface2: 'var(--panel-bg)',
        surface3: 'var(--surface-strong)',
        border: 'var(--border-color)',
        border2: 'var(--border-strong)',
        text: 'var(--text-primary)',
        text2: 'var(--text-secondary)',
        text3: 'var(--text-muted)',
        brand: '#5B5EF7',
        brand2: '#4B4EE8',
        teal: '#00C2A8',
        'teal-dark': '#00A892',
        'dark-gradient-start': '#0B1020',
        'dark-gradient-end': '#111827',
        green: '#22C55E',
        amber: '#F59E0B',
        red: '#EF4444',
        blue: '#5B5EF7',
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;

