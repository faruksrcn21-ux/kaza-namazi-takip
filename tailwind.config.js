/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#07080c',
          900: '#0f111a',
          850: '#151826',
          800: '#1d2236',
          750: '#262d47',
          700: '#323b5c'
        },
        // Derin Saray Yeşili (Emerald Imperial)
        imperial: {
          900: '#022c22',
          800: '#064e3b',
          700: '#047857',
          600: '#059669',
          500: '#10b981',
          400: '#34d399',
          300: '#6ee7b7'
        },
        // Kraliyet Moru (Royal Velvet Violet)
        velvet: {
          900: '#2e1065',
          800: '#3b0764',
          700: '#581c87',
          600: '#7e22ce',
          500: '#9333ea',
          400: '#a855f7',
          300: '#c084fc'
        },
        // İslami Altın / Pirinç Vurgusu (Imperial Gold)
        gold: {
          900: '#78350f',
          800: '#92400e',
          700: '#b45309',
          600: '#d97706',
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
          200: '#fef08a'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Amiri', 'serif']
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        goldShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        ambientGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'gold-shimmer': 'goldShimmer 3s ease infinite',
        'ambient-glow': 'ambientGlow 6s ease-in-out infinite',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)'
      }
    }
  },
  plugins: []
}
