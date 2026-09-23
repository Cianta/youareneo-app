import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep Forest Green System
        forest: {
          950: '#060E09',
          900: '#0D1A12',
          800: '#122218',
          700: '#1B3D27',
          650: '#1F4D30',
          600: '#2A6040',
          500: '#3A7D55',
          400: '#4F9E70',
          300: '#68BC8C',
          200: '#8FD4AE',
          100: '#C2EDD5',
          50:  '#E8F7EF',
        },
        // Anthracite System
        anth: {
          950: '#0A0A0A',
          900: '#111111',
          800: '#1A1A1A',
          750: '#202020',
          // Text-Stufen deutlich aufgehellt — dunkles Grau war kaum lesbar
          700: '#454545',
          600: '#5F5F5F',
          500: '#757575',
          400: '#8F8F8F',
          300: '#A8A8A8',
          200: '#C0C0C0',
          100: '#D6D6D6',
        },
        // Sacred Gold
        gold: {
          DEFAULT: '#C9A84C',
          bright: '#E2C97E',
          deep:   '#9A7A28',
          glow:   '#FFD878',
        },
        // Mint accent — primary brand action color
        mint: {
          DEFAULT: '#11CAA0',
          light:   '#d1ffdf',
          50:  '#edfff8',
          100: '#d1ffdf',
          200: '#a5ffc7',
          300: '#6ffba8',
          400: '#35ef86',
          500: '#11CAA0',
          600: '#0da88a',
          700: '#0a8a72',
          800: '#0a6e5c',
          900: '#0a5a4c',
        },
        // YOU ARE NEO brand mandala accents (verbatim from design system)
        mandala: {
          green:       '#4a8a3f',
          'green-deep':'#2f5c2c',
          'green-light':'#a3c79a',
          blue:        '#2244a8',
          'blue-deep': '#16306f',
          'blue-light':'#8aa1d4',
          ochre:       '#c89a4e',
          rust:        '#b04a3a',
        },
        // UI aliases — modern dark anthracite (charcoal, slightly cool)
        bg:      '#15171C',
        surface: '#1B1E24',
        panel:   '#1F2229',
        border:  '#2C313A',
        muted:   '#3C424E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'forest-fade': 'linear-gradient(135deg, #060E09 0%, #0D1A12 50%, #111C15 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, #C9A84C22 50%, transparent 100%)',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(74, 158, 112, 0.25), 0 0 40px rgba(74, 158, 112, 0.1)',
        'glow-gold':  '0 0 20px rgba(201, 168, 76, 0.3), 0 0 40px rgba(201, 168, 76, 0.12)',
        'glow-sm':    '0 0 8px rgba(74, 158, 112, 0.4)',
        'panel':      '0 4px 24px rgba(0,0,0,0.6)',
        'card':       '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':    'spin 12s linear infinite',
        'float':        'float 6s ease-in-out infinite',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'sacred-rotate':'spin 60s linear infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
