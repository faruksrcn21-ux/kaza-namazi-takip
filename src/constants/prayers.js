import { Sunrise, Sun, CloudSun, Sunset, Moon, Star } from 'lucide-react'

// Her vaktin kimliği, adı, ikonu ve renkleri.
// Renk akışı (K-16): gün boyunca YEŞİLDEN MORA —
//   Sabah/Öğle yeşil → İkindi geçiş (yeşil+mor) → Akşam/Yatsı/Vitir mor.
// accentFrom/accentTo: ikon zemini · numberColor: kalan borç rakamı
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
    numberColor: 'text-primary-300',
    bgBadge: 'bg-primary-500/10 text-primary-300 border-primary-500/20'
  },
  {
    id: 'ogle',
    name: 'Öğle',
    icon: Sun,
    isVitir: false,
    accentFrom: 'from-primary-800/45',
    accentTo: 'to-accent-950/40',
    borderColor: 'border-primary-500/20',
    iconColor: 'text-primary-300',
    numberColor: 'text-primary-200',
    bgBadge: 'bg-primary-500/10 text-primary-300 border-primary-500/20'
  },
  {
    id: 'ikindi',
    name: 'İkindi',
    icon: CloudSun,
    isVitir: false,
    accentFrom: 'from-primary-900/45',
    accentTo: 'to-accent-900/45',
    borderColor: 'border-primary-400/15',
    iconColor: 'text-primary-200',
    numberColor: 'text-brand-gradient',
    bgBadge: 'bg-accent-500/10 text-accent-300 border-accent-500/20'
  },
  {
    id: 'aksam',
    name: 'Akşam',
    icon: Sunset,
    isVitir: false,
    accentFrom: 'from-accent-800/45',
    accentTo: 'to-primary-950/40',
    borderColor: 'border-accent-500/20',
    iconColor: 'text-accent-300',
    numberColor: 'text-accent-200',
    bgBadge: 'bg-accent-500/10 text-accent-300 border-accent-500/20'
  },
  {
    id: 'yatsi',
    name: 'Yatsı',
    icon: Moon,
    isVitir: false,
    accentFrom: 'from-accent-800/50',
    accentTo: 'to-accent-950/45',
    borderColor: 'border-accent-500/25',
    iconColor: 'text-accent-300',
    numberColor: 'text-accent-300',
    bgBadge: 'bg-accent-500/10 text-accent-300 border-accent-500/20'
  },
  {
    id: 'vitir',
    name: 'Vitir',
    icon: Star,
    isVitir: true,
    accentFrom: 'from-accent-700/45',
    accentTo: 'to-accent-950/50',
    borderColor: 'border-accent-400/30',
    iconColor: 'text-accent-200',
    numberColor: 'text-accent-200',
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
