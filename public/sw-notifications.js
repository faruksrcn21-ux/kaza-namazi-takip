/* Kaza Namazı Takip — bildirim tıklama işleyicisi.
 * vite-plugin-pwa (generateSW) tarafından üretilen service worker'a
 * workbox.importScripts ile eklenir (vite.config.js).
 * Bildirime dokununca açık uygulama penceresi öne gelir ve hangi vakit için
 * olduğu mesajla iletilir; pencere yoksa ?vakit=<id> ile yeni pencere açılır.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus()
          client.postMessage({ type: 'kaza-notification-click', data })
          return
        }
      }
      const url = new URL('/', self.location.origin)
      if (data.prayerId) url.searchParams.set('vakit', data.prayerId)
      await self.clients.openWindow(url.href)
    })()
  )
})
