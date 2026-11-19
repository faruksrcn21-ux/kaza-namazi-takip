import { useEffect } from 'react'
import { STORAGE_KEY_BIRTHDAY_SENT } from '../constants/storage'
import { pendingBirthdayGreeting, rememberSent } from '../utils/birthdayGreeting'
import { getNotificationPermission, showAppNotification } from '../utils/notifications'

const readSent = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORAGE_KEY_BIRTHDAY_SENT) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/**
 * Doğum günü tebriği (K-29): uygulama açıkken / arka planda canlıyken,
 * doğum gününde 09:00'dan sonra bir kez. Dakikada bir ve sekme görünür
 * olunca kontrol eder. Kayıt, bildirim GÖSTERİLDİKTEN sonra yazılır.
 */
export function useBirthdayGreeting({ birthDate, enabled }) {
  useEffect(() => {
    if (!enabled || !birthDate) return undefined
    let busy = false

    const check = async () => {
      if (busy || getNotificationPermission() !== 'granted') return
      const sent = readSent()
      const due = pendingBirthdayGreeting({ birthDate, now: new Date(), sent })
      if (!due) return
      busy = true
      try {
        const ok = await showAppNotification(due.title, { body: due.body, tag: `dogum-gunu-${due.keys.join('-')}` })
        if (ok) {
          try {
            window.localStorage.setItem(STORAGE_KEY_BIRTHDAY_SENT, JSON.stringify(rememberSent(sent, due.keys)))
          } catch {
            /* depolanamazsa bir sonraki kontrolde tekrar dener */
          }
        }
      } finally {
        busy = false
      }
    }

    check()
    const timer = setInterval(check, 60 * 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [birthDate, enabled])
}
