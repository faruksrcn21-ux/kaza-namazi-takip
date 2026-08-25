import { Sunrise, Sun, CloudSun, Sunset, Moon, Star } from 'lucide-react'

// Her vaktin kimliği, görünen adı, ikonu ve saray estetiğine uygun renk paleti.
// accentFrom/accentTo: İslami çini ve kadife tonlarında ikon arka planı.
export const PRAYERS = [
  {
    id: 'sabah',
    name: 'Sabah',
    icon: Sunrise,
    isVitir: false,
    accentFrom: 'from-emerald-900/40',
    accentTo: 'to-teal-800/40',
    borderColor: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  },
  {
    id: 'ogle',
    name: 'Öğle',
    icon: Sun,
    isVitir: false,
    accentFrom: 'from-amber-900/40',
    accentTo: 'to-yellow-800/40',
    borderColor: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    bgBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
  },
  {
    id: 'ikindi',
    name: 'İkindi',
    icon: CloudSun,
    isVitir: false,
    accentFrom: 'from-amber-950/50',
    accentTo: 'to-orange-900/40',
    borderColor: 'border-orange-500/20',
    iconColor: 'text-orange-400',
    bgBadge: 'bg-orange-500/10 text-orange-300 border-orange-500/20'
  },
  {
    id: 'aksam',
    name: 'Akşam',
    icon: Sunset,
    isVitir: false,
    accentFrom: 'from-rose-950/40',
    accentTo: 'to-purple-900/40',
    borderColor: 'border-rose-500/20',
    iconColor: 'text-rose-400',
    bgBadge: 'bg-rose-500/10 text-rose-300 border-rose-500/20'
  },
  {
    id: 'yatsi',
    name: 'Yatsı',
    icon: Moon,
    isVitir: false,
    accentFrom: 'from-purple-950/50',
    accentTo: 'to-indigo-900/40',
    borderColor: 'border-purple-500/20',
    iconColor: 'text-purple-300',
    bgBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
  },
  {
    id: 'vitir',
    name: 'Vitir',
    icon: Star,
    isVitir: true,
    accentFrom: 'from-violet-950/50',
    accentTo: 'to-amber-900/30',
    borderColor: 'border-amber-500/25',
    iconColor: 'text-amber-300',
    bgBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  }
]

export const STORAGE_KEY = 'kaza-namazi-takip-v1'
export const STORAGE_KEY_INITIAL_TOTAL = 'kaza-namazi-takip-baslangic-v1'
export const STORAGE_KEY_ONBOARDING = 'kaza-namazi-takip-onboarding-v1'
export const STORAGE_KEY_PROFILE = 'kaza-namazi-takip-profil-v1'

export const createEmptyCounts = () =>
  PRAYERS.reduce((acc, prayer) => {
    acc[prayer.id] = 0
    return acc
  }, {})
