import { useMemo, useState, useEffect } from 'react'
import { calculatePrayerTimes } from '../utils/prayerTimes'

/**
 * Vakit hesabı hook'u (Faz 2) — konuma göre Diyanet vakitleri.
 * Gece yarısı geçişinde otomatik yeniden hesaplar.
 */
export const usePrayerTimes = (location, offsets) => {
  const [todayKey, setTodayKey] = useState(() => new Date().toDateString())

  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 5, 0)
    const ms = midnight.getTime() - now.getTime()
    const timer = setTimeout(() => setTodayKey(new Date().toDateString()), ms)
    return () => clearTimeout(timer)
  }, [todayKey])

  return useMemo(() => {
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lon)) {
      return null
    }
    try {
      return calculatePrayerTimes(
        { lat: location.lat, lon: location.lon },
        new Date(),
        offsets
      )
    } catch {
      return null
    }
  }, [location?.lat, location?.lon, offsets, todayKey])
}
