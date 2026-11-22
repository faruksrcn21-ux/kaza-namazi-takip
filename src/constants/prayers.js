import { Sunrise, Sun, CloudSun, Sunset, Moon, Star } from 'lucide-react'

// Her vaktin kimliği, adı, ikonu ve renkleri.
// Simgeler (K-38): gün ışığı renkleri — Sabah yeşil, Öğle altın, İkindi turuncu,
//   Akşam gün batımı pembesi, Yatsı mor, Vitir altın (canlı sürümdeki gibi).
// Sayılar (K-39): sade/nötr — tüm vakitlerde aynı renk (PrayerCard).
// accentFrom/accentTo: ikon zemini
export const PRAYERS = [
  {
    id: 'sabah',
    name: 'Sabah',
    icon: Sunrise,
    isVitir: false,
    accentFrom: 'from-primary-800/50',
    accentTo: 'to-primary-950/40',
    borderColor: 'border-primary-500/25',
    iconColor: 'text-primary-300',
    bgBadge: 'bg-primary-500/10 text-primary-300 border-primary-500/20'
  },
  {
    id: 'ogle',
    name: 'Öğle',
    icon: Sun,
    isVitir: false,
    accentFrom: 'from-gold-900/50',
    accentTo: 'to-gold-800/30',
    borderColor: 'border-gold-500/25',
    iconColor: 'text-gold-400',
    bgBadge: 'bg-primary-500/10 text-primary-300 border-primary-500/20'
  },
  {
    id: 'ikindi',
    name: 'İkindi',
    icon: CloudSun,
    isVitir: false,
    accentFrom: 'from-gold-950/50',
    accentTo: 'to-orange-900/40',
    borderColor: 'border-orange-500/25',
    iconColor: 'text-orange-400',
    bgBadge: 'bg-accent-500/10 text-accent-300 border-accent-500/20'
  },
  {
    id: 'aksam',
    name: 'Akşam',
    icon: Sunset,
    isVitir: false,
    accentFrom: 'from-rose-950/50',
    accentTo: 'to-accent-900/40',
    borderColor: 'border-rose-500/25',
    iconColor: 'text-rose-400',
    bgBadge: 'bg-accent-500/10 text-accent-300 border-accent-500/20'
  },
  {
    id: 'yatsi',
    name: 'Yatsı',
    icon: Moon,
    isVitir: false,
    accentFrom: 'from-accent-950/50',
    accentTo: 'to-accent-900/40',
    borderColor: 'border-accent-500/25',
    iconColor: 'text-accent-300',
    bgBadge: 'bg-accent-500/10 text-accent-300 border-accent-500/20'
  },
  {
    id: 'vitir',
    name: 'Vitir',
    icon: Star,
    isVitir: true,
    accentFrom: 'from-accent-950/50',
    accentTo: 'to-gold-900/40',
    borderColor: 'border-gold-500/30',
    iconColor: 'text-gold-300',
    bgBadge: 'bg-accent-500/15 text-accent-200 border-accent-400/30'
  }
]

// Depo anahtarları merkezi kayıttan gelir (src/constants/storage.js)
export {
  STORAGE_KEY,
  STORAGE_KEY_INITIAL_TOTAL,
  STORAGE_KEY_ONBOARDING,
  STORAGE_KEY_PROFILE,
  STORAGE_KEY_HISTORY
} from './storage'

export const createEmptyCounts = () =>
  PRAYERS.reduce((acc, prayer) => {
    acc[prayer.id] = 0
    return acc
  }, {})
