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
          950: 'rgb(var(--rgb-forest-950) / <alpha-value>)',
          900: 'rgb(var(--rgb-forest-900) / <alpha-value>)',
          800: 'rgb(var(--rgb-forest-800) / <alpha-value>)',
          700: 'rgb(var(--rgb-forest-700) / <alpha-value>)',
          650: 'rgb(var(--rgb-forest-650) / <alpha-value>)',
          600: 'rgb(var(--rgb-forest-600) / <alpha-value>)',
          500: 'rgb(var(--rgb-forest-500) / <alpha-value>)',
          400: 'rgb(var(--rgb-forest-400) / <alpha-value>)',
          300: 'rgb(var(--rgb-forest-300) / <alpha-value>)',
          200: 'rgb(var(--rgb-forest-200) / <alpha-value>)',
          100: 'rgb(var(--rgb-forest-100) / <alpha-value>)',
          50: 'rgb(var(--rgb-forest-50) / <alpha-value>)',
        },
        // Anthracite System
        anth: {
          950: 'rgb(var(--rgb-anth-950) / <alpha-value>)',
          900: 'rgb(var(--rgb-anth-900) / <alpha-value>)',
          800: 'rgb(var(--rgb-anth-800) / <alpha-value>)',
          750: 'rgb(var(--rgb-anth-750) / <alpha-value>)',
          // Text-Stufen deutlich aufgehellt — dunkles Grau war kaum lesbar
          700: 'rgb(var(--rgb-anth-700) / <alpha-value>)',
          600: 'rgb(var(--rgb-anth-600) / <alpha-value>)',
          500: 'rgb(var(--rgb-anth-500) / <alpha-value>)',
          400: 'rgb(var(--rgb-anth-400) / <alpha-value>)',
          300: 'rgb(var(--rgb-anth-300) / <alpha-value>)',
          200: 'rgb(var(--rgb-anth-200) / <alpha-value>)',
          100: 'rgb(var(--rgb-anth-100) / <alpha-value>)',
        },
        // Sacred Gold
        gold: {
          DEFAULT: 'rgb(var(--rgb-gold-default) / <alpha-value>)',
          bright: 'rgb(var(--rgb-gold-bright) / <alpha-value>)',
          deep: 'rgb(var(--rgb-gold-deep) / <alpha-value>)',
          glow: 'rgb(var(--rgb-gold-glow) / <alpha-value>)',
        },
        // Mint accent — primary brand action color
        mint: {
          DEFAULT: 'rgb(var(--rgb-mint-default) / <alpha-value>)',
          light: 'rgb(var(--rgb-mint-light) / <alpha-value>)',
          50: 'rgb(var(--rgb-mint-50) / <alpha-value>)',
          100: 'rgb(var(--rgb-mint-100) / <alpha-value>)',
          200: 'rgb(var(--rgb-mint-200) / <alpha-value>)',
          300: 'rgb(var(--rgb-mint-300) / <alpha-value>)',
          400: 'rgb(var(--rgb-mint-400) / <alpha-value>)',
          500: 'rgb(var(--rgb-mint-500) / <alpha-value>)',
          600: 'rgb(var(--rgb-mint-600) / <alpha-value>)',
          700: 'rgb(var(--rgb-mint-700) / <alpha-value>)',
          800: 'rgb(var(--rgb-mint-800) / <alpha-value>)',
          900: 'rgb(var(--rgb-mint-900) / <alpha-value>)',
        },
        // YOU ARE NEO brand mandala accents (verbatim from design system)
        mandala: {
          green: 'rgb(var(--rgb-mandala-green) / <alpha-value>)',
          'green-deep': 'rgb(var(--rgb-mandala-green-deep) / <alpha-value>)',
          'green-light': 'rgb(var(--rgb-mandala-green-light) / <alpha-value>)',
          blue: 'rgb(var(--rgb-mandala-blue) / <alpha-value>)',
          'blue-deep': 'rgb(var(--rgb-mandala-blue-deep) / <alpha-value>)',
          'blue-light': 'rgb(var(--rgb-mandala-blue-light) / <alpha-value>)',
          ochre: 'rgb(var(--rgb-mandala-ochre) / <alpha-value>)',
          rust: 'rgb(var(--rgb-mandala-rust) / <alpha-value>)',
        },
        // UI aliases — modern dark anthracite (charcoal, slightly cool)
        bg: 'rgb(var(--rgb-bg) / <alpha-value>)',
        surface: 'rgb(var(--rgb-surface) / <alpha-value>)',
        panel: 'rgb(var(--rgb-panel) / <alpha-value>)',
        border: 'rgb(var(--rgb-border) / <alpha-value>)',
        muted: 'rgb(var(--rgb-muted) / <alpha-value>)',
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
