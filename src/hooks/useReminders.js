import { useEffect, useRef } from 'react'
import { calculatePrayerTimes } from '../utils/prayerTimes'
import { buildReminderEvents, dueEvents, reminderText } from '../utils/reminders'
import { getNotificationPermission, showAppNotification } from '../utils/notifications'

const TICK_MS = 20 * 1000

export const hasCoords = (location) =>
  !!location && Number.isFinite(location.lat) && Number.isFinite(location.lon)

/**
 * Dün + bugün + yarın vakitleri. Dün dahil: "dünün" teheccüdü bu sabahın erken saatidir.
 */
export function daysAround(location, offsets, date = new Date(), span = [-1, 0, 1]) {
  if (!hasCoords(location)) return []
  return span.map((d) => {
    const x = new Date(date)
    x.setDate(x.getDate() + d)
    try {
      return calculatePrayerTimes({ lat: location.lat, lon: location.lon }, x, offsets)
    } catch {
      return null
    }
  })
}

/** Ayarlardaki önizleme ve .ics için: şu andan itibaren olaylar. */
export function upcomingEvents(location, offsets, settings, now = new Date()) {
  return buildReminderEvents(daysAround(location, offsets, now), settings).filter(
    (e) => e.at.getTime() > now.getTime()
  )
}

/**
 * Uygulama açıkken (veya arka planda canlıyken) vakit hatırlatması gösterir.
 * Her 20 sn'de ve sekme görünür olduğunda "son kontrolden bu yana zamanı gelen"
 * olaylara bakar. Uzun uykudan dönüşte yalnızca son 10 dk içindekiler gösterilir.
 * Aynı olay tag'i ile gösterildiği için birden çok sekmede tekrar etmez.
 */
export function useReminders({ location, offsets, settings, counts, onNotificationClick }) {
  const countsRef = useRef(counts)
  countsRef.current = counts
  const clickRef = useRef(onNotificationClick)
  clickRef.current = onNotificationClick

  const active = !!settings?.enabled && hasCoords(location)

  useEffect(() => {
    if (!active) return undefined
    let since = Date.now()

    const tick = () => {
      const now = Date.now()
      if (getNotificationPermission() !== 'granted') {
        since = now
        return
      }
      const events = buildReminderEvents(daysAround(location, offsets, new Date(now)), settings)
      const due = dueEvents(events, since, now)
      since = now
      for (const e of due) {
        const { title, body } = reminderText(e, { remaining: countsRef.current?.[e.id] })
        showAppNotification(title, {
          body,
          tag: e.key,
          data: { prayerId: e.kind === 'vakit' ? e.id : null, key: e.key },
          onClick: (data) => clickRef.current?.(data)
        })
      }
    }

    const timer = setInterval(tick, TICK_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active, location, offsets, settings])
}
