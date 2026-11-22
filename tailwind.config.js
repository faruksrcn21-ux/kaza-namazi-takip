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
        //   Tonlar src/theme.css'te (koyu + açık tema); üretici: tools/gen-theme.py
        // ══════════════════════════════════════════════════════════
        primary: {
          50: 'rgb(var(--c-primary-50) / <alpha-value>)',
          100: 'rgb(var(--c-primary-100) / <alpha-value>)',
          200: 'rgb(var(--c-primary-200) / <alpha-value>)',
          300: 'rgb(var(--c-primary-300) / <alpha-value>)',
          400: 'rgb(var(--c-primary-400) / <alpha-value>)',
          500: 'rgb(var(--c-primary-500) / <alpha-value>)',
          600: 'rgb(var(--c-primary-600) / <alpha-value>)',
          700: 'rgb(var(--c-primary-700) / <alpha-value>)',
          800: 'rgb(var(--c-primary-800) / <alpha-value>)',
          900: 'rgb(var(--c-primary-900) / <alpha-value>)',
          950: 'rgb(var(--c-primary-950) / <alpha-value>)'
        },
        accent: {
          50: 'rgb(var(--c-accent-50) / <alpha-value>)',
          100: 'rgb(var(--c-accent-100) / <alpha-value>)',
          200: 'rgb(var(--c-accent-200) / <alpha-value>)',
          300: 'rgb(var(--c-accent-300) / <alpha-value>)',
          400: 'rgb(var(--c-accent-400) / <alpha-value>)',
          500: 'rgb(var(--c-accent-500) / <alpha-value>)',
          600: 'rgb(var(--c-accent-600) / <alpha-value>)',
          700: 'rgb(var(--c-accent-700) / <alpha-value>)',
          800: 'rgb(var(--c-accent-800) / <alpha-value>)',
          900: 'rgb(var(--c-accent-900) / <alpha-value>)',
          950: 'rgb(var(--c-accent-950) / <alpha-value>)'
        },
        // İkincil metin (NFR-06): zinc-500 koyu temada #8e8e98 (≥ 4,6:1), açıkta #5c5b67
        zinc: {
          50: 'rgb(var(--c-zinc-50) / <alpha-value>)',
          100: 'rgb(var(--c-zinc-100) / <alpha-value>)',
          200: 'rgb(var(--c-zinc-200) / <alpha-value>)',
          300: 'rgb(var(--c-zinc-300) / <alpha-value>)',
          400: 'rgb(var(--c-zinc-400) / <alpha-value>)',
          500: 'rgb(var(--c-zinc-500) / <alpha-value>)',
          600: 'rgb(var(--c-zinc-600) / <alpha-value>)',
          700: 'rgb(var(--c-zinc-700) / <alpha-value>)',
          800: 'rgb(var(--c-zinc-800) / <alpha-value>)',
          900: 'rgb(var(--c-zinc-900) / <alpha-value>)',
          950: 'rgb(var(--c-zinc-950) / <alpha-value>)'
        },
        rose: {
          50: 'rgb(var(--c-rose-50) / <alpha-value>)',
          100: 'rgb(var(--c-rose-100) / <alpha-value>)',
          200: 'rgb(var(--c-rose-200) / <alpha-value>)',
          300: 'rgb(var(--c-rose-300) / <alpha-value>)',
          400: 'rgb(var(--c-rose-400) / <alpha-value>)',
          500: 'rgb(var(--c-rose-500) / <alpha-value>)',
          600: 'rgb(var(--c-rose-600) / <alpha-value>)',
          700: 'rgb(var(--c-rose-700) / <alpha-value>)',
          800: 'rgb(var(--c-rose-800) / <alpha-value>)',
          900: 'rgb(var(--c-rose-900) / <alpha-value>)',
          950: 'rgb(var(--c-rose-950) / <alpha-value>)'
        },
        // Süs renkleri (K-38): altın = besmele/dua, Öğle/Vitir simgesi; turuncu = İkindi simgesi
        gold: {
          50: 'rgb(var(--c-gold-50) / <alpha-value>)',
          100: 'rgb(var(--c-gold-100) / <alpha-value>)',
          200: 'rgb(var(--c-gold-200) / <alpha-value>)',
          300: 'rgb(var(--c-gold-300) / <alpha-value>)',
          400: 'rgb(var(--c-gold-400) / <alpha-value>)',
          500: 'rgb(var(--c-gold-500) / <alpha-value>)',
          600: 'rgb(var(--c-gold-600) / <alpha-value>)',
          700: 'rgb(var(--c-gold-700) / <alpha-value>)',
          800: 'rgb(var(--c-gold-800) / <alpha-value>)',
          900: 'rgb(var(--c-gold-900) / <alpha-value>)',
          950: 'rgb(var(--c-gold-950) / <alpha-value>)'
        },
        orange: {
          50: 'rgb(var(--c-orange-50) / <alpha-value>)',
          100: 'rgb(var(--c-orange-100) / <alpha-value>)',
          200: 'rgb(var(--c-orange-200) / <alpha-value>)',
          300: 'rgb(var(--c-orange-300) / <alpha-value>)',
          400: 'rgb(var(--c-orange-400) / <alpha-value>)',
          500: 'rgb(var(--c-orange-500) / <alpha-value>)',
          600: 'rgb(var(--c-orange-600) / <alpha-value>)',
          700: 'rgb(var(--c-orange-700) / <alpha-value>)',
          800: 'rgb(var(--c-orange-800) / <alpha-value>)',
          900: 'rgb(var(--c-orange-900) / <alpha-value>)',
          950: 'rgb(var(--c-orange-950) / <alpha-value>)'
        },
        // Yüzeyler — koyu: mor tonlu gece; açık: mor tonlu kâğıt
        surface: {
          950: 'rgb(var(--c-surface-950) / <alpha-value>)',
          900: 'rgb(var(--c-surface-900) / <alpha-value>)',
          850: 'rgb(var(--c-surface-850) / <alpha-value>)',
          800: 'rgb(var(--c-surface-800) / <alpha-value>)',
          750: 'rgb(var(--c-surface-750) / <alpha-value>)',
          700: 'rgb(var(--c-surface-700) / <alpha-value>)'
        },
        // İnce çerçeve/örtüler (border-white/[0.06] vb.) açık temada koyu mürekkebe döner.
        // Gerçek beyaz gerektiğinde bg-[#fff] / text-[#fff] kullan.
        white: 'rgb(var(--c-white) / <alpha-value>)'
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
            boxShadow: '0 0 0 0 rgb(var(--c-accent-500) / 0), 0 0 0 0 rgb(var(--c-accent-400) / 0)',
            borderColor: 'rgb(var(--c-accent-500) / 0.3)'
          },
          '50%': {
            boxShadow: '0 0 0 4px rgb(var(--c-accent-500) / 0.18), 0 0 20px 4px rgb(var(--c-accent-400) / 0.28)',
            borderColor: 'rgb(var(--c-accent-300) / 0.9)'
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
