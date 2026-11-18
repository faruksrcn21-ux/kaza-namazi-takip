import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  SunnahTimes,
  Madhab
} from 'adhan'

export { STORAGE_KEY_PRAYER_OFFSETS } from '../constants/storage'
export const KUSLUK_OFFSET_MIN = 50
export const EVVABIN_OFFSET_MIN = 20
export const VITIR_OFFSET_MIN = 30

const DEFAULT_OFFSETS = {
  sabah: 0,
  ogle: 0,
  ikindi: 0,
  aksam: 0,
  yatsi: 0,
  vitir: 0
}

export const normalizeOffsets = (raw) => {
  const out = { ...DEFAULT_OFFSETS }
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(DEFAULT_OFFSETS)) {
      const v = raw[key]
      out[key] = Number.isFinite(v) ? Math.max(-30, Math.min(30, Math.round(v))) : 0
    }
  }
  return out
}

const shiftMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000)

const fmtTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--:--'
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  }).format(date)
}

/**
 * Verilen konum + tarih için Diyanet (Turkey) vakitlerini hesaplar.
 * @param {{lat:number, lon:number}} coords
 * @param {Date} date
 * @param {Object} offsets - vakit başına dakika sapması
 * @returns {Object|null} vakit satırları + nafile (teheccüd/kuşluk/evvâbin)
 */
export const calculatePrayerTimes = (coords, date = new Date(), offsets = {}) => {
  if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) {
    return null
  }
  const safe = normalizeOffsets(offsets)
  const coordinates = new Coordinates(coords.lat, coords.lon)
  const params = CalculationMethod.Turkey()
  params.madhab = Madhab.Hanafi

  const times = new PrayerTimes(coordinates, date, params)
  const sunnah = new SunnahTimes(times)

  const rows = [
    { id: 'sabah', name: 'Sabah', time: shiftMinutes(times.fajr, safe.sabah), offset: safe.sabah },
    { id: 'ogle', name: 'Öğle', time: shiftMinutes(times.dhuhr, safe.ogle), offset: safe.ogle },
    {
      id: 'ikindi',
      name: 'İkindi',
      time: shiftMinutes(times.asr, safe.ikindi),
      offset: safe.ikindi
    },
    {
      id: 'aksam',
      name: 'Akşam',
      time: shiftMinutes(times.maghrib, safe.aksam),
      offset: safe.aksam
    },
    { id: 'yatsi', name: 'Yatsı', time: shiftMinutes(times.isha, safe.yatsi), offset: safe.yatsi },
    {
      id: 'vitir',
      name: 'Vitir',
      time: shiftMinutes(shiftMinutes(times.isha, VITIR_OFFSET_MIN), safe.vitir),
      offset: safe.vitir,
      note: `Yatsı +${VITIR_OFFSET_MIN} dk`
    }
  ]

  return {
    dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    rows: rows.map((r) => ({ ...r, text: fmtTime(r.time) })),
    nafile: [
      {
        id: 'teheccud',
        name: 'Teheccüd',
        time: sunnah.lastThirdOfTheNight,
        text: fmtTime(sunnah.lastThirdOfTheNight),
        note: 'Gecenin son üçte biri'
      },
      {
        id: 'kusluk',
        name: 'Kuşluk (Duhâ)',
        time: shiftMinutes(times.sunrise, KUSLUK_OFFSET_MIN),
        text: fmtTime(shiftMinutes(times.sunrise, KUSLUK_OFFSET_MIN)),
        note: `Güneş doğuşu +${KUSLUK_OFFSET_MIN} dk`
      },
      {
        id: 'evvabin',
        name: 'Evvâbin',
        time: shiftMinutes(times.maghrib, EVVABIN_OFFSET_MIN),
        text: fmtTime(shiftMinutes(times.maghrib, EVVABIN_OFFSET_MIN)),
        note: `Akşam +${EVVABIN_OFFSET_MIN} dk`
      }
    ]
  }
}
