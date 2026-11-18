/**
 * BİLDİRİM SERVİSİ — uygulamadaki TEK bildirim noktası (Faz 3, TD-07)
 *
 * - İzin yalnızca kullanıcı bir düğmeye bastığında istenir (FR-BLD-01).
 * - Gösterim önce service worker üzerinden yapılır: Android Chrome
 *   `new Notification()` kurucusunu desteklemez ("Illegal constructor").
 *   SW yoksa (geliştirme modu, eski tarayıcı) sayfa içi API'ye düşülür.
 * - Bildirime dokununca: public/sw-notifications.js uygulamayı öne getirir ve
 *   { type: NOTIFICATION_CLICK_MESSAGE, data } mesajını gönderir.
 */

export const NOTIFICATION_CLICK_MESSAGE = 'kaza-notification-click'
const ICON = '/icons/icon-192.png'

export const isNotificationSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

/** 'unsupported' | 'default' | 'granted' | 'denied' */
export const getNotificationPermission = () =>
  isNotificationSupported() ? Notification.permission : 'unsupported'

/** Kullanıcı hareketi içinde çağrılmalı. Sonuç izni döner. */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))])

/**
 * Bildirim gösterir. İzin yoksa sessizce false döner.
 * @param {string} title
 * @param {object} [opts] - { body, tag, data, onClick }  (onClick yalnız SW'siz yolda)
 */
export async function showAppNotification(title, opts = {}) {
  if (getNotificationPermission() !== 'granted') return false
  const options = {
    body: opts.body,
    tag: opts.tag, // aynı tag → aynı bildirim (çoklu sekmede tekrar olmaz)
    data: opts.data || {},
    icon: ICON,
    badge: ICON,
    lang: 'tr'
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await withTimeout(navigator.serviceWorker.ready, 2500)
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options)
        return true
      }
    }
  } catch {
    /* sayfa içi yola düş */
  }

  try {
    const n = new Notification(title, options)
    n.onclick = () => {
      window.focus()
      n.close()
      opts.onClick?.(options.data)
    }
    return true
  } catch {
    return false
  }
}
