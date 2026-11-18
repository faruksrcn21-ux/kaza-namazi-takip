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
        // ══════════════════════════════════════════════════════════
        // RENK SİSTEMİ (K-16) — Yeşil + Mor, iki net rol
        //   primary (yeşil) : eda & ilerleme — kılındı butonları, ilerleme,
        //                     grafik, olumlu durumlar
        //   accent  (mor)   : kimlik & yapı — aktif sekme/seçim, kilit,
        //                     rozet, ikon zeminleri, çerçeveler, +borç
        //   İmza gradyanı (yeşil→mor) yalnızca öne çıkan yerlerde.
        //   Ton değiştirmek için yalnızca bu iki skalayı düzenle.
        // ══════════════════════════════════════════════════════════
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065'
        },
        // Koyu yüzeyler — hafif mor tonlu; yeşili öne çıkarır, moru bütünleştirir
        surface: {
          950: '#08070d',
          900: '#100e18',
          850: '#161322',
          800: '#1e1a2e',
          750: '#28233c',
          700: '#342e4d'
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
        brandShimmer: {
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
        },
        lockGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(139, 92, 246, 0), 0 0 0 0 rgba(167, 139, 250, 0)',
            borderColor: 'rgba(139, 92, 246, 0.3)'
          },
          '50%': {
            boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.18), 0 0 24px 6px rgba(167, 139, 250, 0.35)',
            borderColor: 'rgba(196, 181, 253, 0.9)'
          }
        },
        lockShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' }
        }
      },
      animation: {
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'brand-shimmer': 'brandShimmer 3s ease infinite',
        'ambient-glow': 'ambientGlow 6s ease-in-out infinite',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        'lock-glow': 'lockGlow 1.2s ease-in-out 3',
        'lock-shake': 'lockShake 0.5s ease-in-out 2'
      }
    }
  },
  plugins: []
}
