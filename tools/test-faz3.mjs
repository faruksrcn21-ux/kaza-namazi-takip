// Faz 3 uçtan uca testi: bildirim izni/ayarları, deneme bildirimi, .ics, bildirimden açılış,
// gömülü fontlar (TD-10). Önkoşul: `npm run build && npm run preview` (localhost:4173).
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://localhost:4173'
const URL = ORIGIN + '/'
const PORT = 9228
const WORK = join(process.env.TEMP, 'kaza-faz3-' + process.pid)
const DOWNLOADS = join(WORK, 'indirilen')
mkdirSync(DOWNLOADS, { recursive: true })

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--user-data-dir=' + join(WORK, 'profil'), 'about:blank'], { stdio: 'ignore' })

let ws, msgId = 0
const pending = new Map()
const requests = []
const send = (method, params = {}) => {
  const id = ++msgId
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((res, rej) => pending.set(id, { res, rej }))
}
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
  if (r.exceptionDetails) throw new Error('JS hatasi: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result.value
}
const results = []
const check = (name, pass, detail) => {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? '  ->  ' + detail : ''}`)
  if (!pass) process.exitCode = 1
}
const waitReady = async (ms = 15000) => {
  for (let i = 0; i < ms / 250; i++) {
    try {
      if (await evaluate(`document.readyState === 'complete' && !!document.getElementById('root')?.children.length`)) return true
    } catch { /* gezinme sırasında bağlam değişebilir */ }
    await sleep(250)
  }
  throw new Error('Sayfa hazir olmadi')
}
const go = async (url) => { await send('Page.navigate', { url }); await sleep(300); await waitReady(); await sleep(300) }
const text = () => evaluate(`document.body.textContent`)
const clickTab = (label) =>
  evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Ana gezinme"] button')).find(b => b.textContent.includes(${JSON.stringify(label)}))?.click(); true`)
const clickButton = (label, root = 'document') =>
  evaluate(`(() => { const b = Array.from(${root}.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(label)} || b.getAttribute('aria-label') === ${JSON.stringify(label)}); if (b) b.click(); return !!b })()`)
const stored = () => evaluate(`JSON.parse(localStorage.getItem('kaza-namazi-takip-bildirim-v1') || 'null')`)
const setPermission = (setting) =>
  send('Browser.setPermission', { permission: { name: 'notifications' }, setting, origin: ORIGIN })

try {
  let target
  for (let i = 0; i < 40 && !target; i++) {
    try { target = await (await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: 'PUT' })).json() } catch { await sleep(250) }
  }
  if (!target) throw new Error('Chrome acilamadi')
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result) }
    else if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url)
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
  await send('Network.setCacheDisabled', { cacheDisabled: true })
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS })
  await setPermission('granted')

  // ── Kurulum: konumlu (Konya) mevcut kullanıcı ──
  await go(URL)
  await evaluate(`(() => {
    localStorage.clear();
    localStorage.setItem('kaza-namazi-takip-onboarding-v1', 'true');
    localStorage.setItem('kaza-namazi-takip-baslangic-v1', '600');
    localStorage.setItem('kaza-namazi-takip-v1', JSON.stringify({sabah:100,ogle:100,ikindi:100,aksam:100,yatsi:100,vitir:100}));
    localStorage.setItem('kaza-namazi-takip-konum-v1', JSON.stringify({source:'city',city:'Konya',lat:37.87,lon:32.48}));
    return true })()`)
  requests.length = 0
  const t0 = Date.now()
  await go(URL)
  const loadMs = Date.now() - t0

  // ── 1) Gömülü fontlar (TD-10) ──
  check('Google Fonts istegi yok', !requests.some((u) => /fonts\.(googleapis|gstatic)\.com/.test(u)), requests.filter((u) => /fonts\./.test(u)).length)
  check('Sayfa hizli acildi (< 5 sn)', loadMs < 5000, `${loadMs} ms`)
  const fontOk = await evaluate(`document.fonts.ready.then(() => document.fonts.check('700 16px "Plus Jakarta Sans"'))`)
  check('Plus Jakarta Sans yerel yuklendi', fontOk === true)
  check('Font dosyasi uygulamadan geldi', requests.some((u) => u.startsWith(ORIGIN) && u.includes('plus-jakarta-sans') && u.endsWith('.woff2')))

  // ── 2) Ayarlar → hatırlatmaları aç ──
  await clickTab('Ayarlar'); await sleep(600)
  check('Bildirim bolumu var', await evaluate(`!!document.querySelector('[data-testid="notification-settings"]')`))
  check('Baslangicta kapali', (await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked')`)) === 'false')
  await evaluate(`document.querySelector('[role="switch"]').click(); true`); await sleep(600)
  check('Anahtar acildi', (await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked')`)) === 'true')
  check('Ayar kaydedildi (enabled)', (await stored())?.enabled === true)
  const status = await evaluate(`document.querySelector('[data-testid="notification-status"]')?.textContent || ''`)
  check('Siradaki vakit gosteriliyor', /Sıradaki: .+ · \d{2}:\d{2}/.test(status), status)

  // ── 3) Vakit seçimi ve "dk önce" ──
  await evaluate(`Array.from(document.querySelectorAll('[data-testid="notification-settings"] button[aria-pressed]')).find(b => b.textContent.startsWith('Teheccüd'))?.click(); true`)
  await sleep(300)
  await evaluate(`Array.from(document.querySelectorAll('[role="radio"]')).find(b => b.textContent === '10 dk önce')?.click(); true`)
  await sleep(300)
  const s = await stored()
  check('Teheccud secildi', s?.targets?.teheccud === true)
  check('10 dk once kaydedildi', s?.leadMinutes === 10)

  // ── 4) Deneme bildirimi ──
  await clickButton('Deneme bildirimi gönder'); await sleep(1500)
  const shown = await evaluate(`(async () => {
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 3000))]);
    if (!reg) return { sw: false };
    const list = await reg.getNotifications();
    return { sw: true, titles: list.map(n => n.title) };
  })()`)
  const msg = await text()
  check('Deneme bildirimi gonderildi mesaji', msg.includes('Deneme bildirimi gönderildi'))
  check('Bildirim service worker uzerinden gosterildi', shown.sw && shown.titles.includes('Deneme bildirimi'), JSON.stringify(shown))

  // ── 5) Takvim dosyası (.ics) ──
  await clickButton('Takvim dosyasını indir (.ics)'); await sleep(1500)
  const icsFiles = readdirSync(DOWNLOADS).filter((f) => f.endsWith('.ics'))
  check('ics dosyasi indi', icsFiles.length === 1, icsFiles.join(','))
  const ics = icsFiles[0] ? readFileSync(join(DOWNLOADS, icsFiles[0]), 'utf8') : ''
  const vevents = (ics.match(/BEGIN:VEVENT/g) || []).length
  check('ics: 7 gun x 6 vakit civari etkinlik', vevents >= 36 && vevents <= 42, vevents)
  check('ics: CRLF + alarm 10 dk once', ics.includes('\r\n') && ics.includes('TRIGGER:-PT10M'))
  check('ics: Teheccud etkinligi var', ics.includes('SUMMARY:Teheccüd vakti (nafile)'))

  // ── 6) Bildirimden açılış: ?vakit=ogle → Takip + kart vurgusu ──
  await go(URL + '?vakit=ogle')
  const hl = await evaluate(`({ hl: document.getElementById('vakit-ogle')?.dataset.highlighted, url: location.search })`)
  check('Bildirimden acilista Ogle karti vurgulandi', hl.hl === 'true', JSON.stringify(hl))
  check('URL parametresi temizlendi', hl.url === '')
  const swFile = await evaluate(`fetch('/sw-notifications.js').then(r => r.ok)`)
  const swImport = await evaluate(`fetch('/sw.js').then(r => r.text()).then(t => t.includes('sw-notifications.js'))`)
  check('SW tiklama isleyicisi yayinda ve ice aktarildi', swFile && swImport)

  // ── 6b) Zamanlayıcı gerçekten tetikleniyor mu? Sayfa saatini Konya öğlesinden 25 sn önceye al ──
  // Öğle vakti uygulamadan bağımsız olarak burada adhan ile hesaplanır (Diyanet/Turkey + Hanefi).
  const params = CalculationMethod.Turkey()
  params.madhab = Madhab.Hanafi
  const dhuhr = new PrayerTimes(new Coordinates(37.87, 32.48), new Date('2026-11-19T09:00:00Z'), params).dhuhr
  const offsetMs = dhuhr.getTime() - 25 * 1000 - Date.now()
  const { identifier: clockScript } = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      const Real = Date, OFFSET = ${offsetMs};
      class FakeDate extends Real {
        constructor(...a) { if (a.length === 0) super(Real.now() + OFFSET); else super(...a) }
        static now() { return Real.now() + OFFSET }
      }
      window.Date = FakeDate;
    })()`
  })
  await evaluate(`(async () => {
    const reg = await navigator.serviceWorker.ready;
    (await reg.getNotifications()).forEach(n => n.close());
    const s = JSON.parse(localStorage.getItem('kaza-namazi-takip-bildirim-v1'));
    localStorage.setItem('kaza-namazi-takip-bildirim-v1', JSON.stringify({ ...s, enabled: true, leadMinutes: 0 }));
    return true })()`)
  await go(URL)
  const pageNow = await evaluate(`new Date().toISOString()`)
  let fired = []
  for (let i = 0; i < 30 && !fired.length; i++) { // 25 sn bekleme + en fazla 20 sn tick
    await sleep(2000)
    fired = await evaluate(`navigator.serviceWorker.ready.then(r => r.getNotifications()).then(l => l.map(n => ({ t: n.title, b: n.body, d: n.data })))`)
  }
  const ogle = fired.find((n) => n.t === 'Öğle vakti girdi')
  check('Vakit girince bildirim geldi (Ogle)', !!ogle, `sayfa saati ${pageNow} · ${JSON.stringify(fired)}`)
  check('Bildirimde kalan borc ve vakit verisi', !!ogle && ogle.b.includes('Kalan Öğle kazan: 100') && ogle.d?.prayerId === 'ogle')
  check('Tek bildirim (tekrar yok)', fired.filter((n) => n.t === 'Öğle vakti girdi').length === 1)
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: clockScript })

  // ── 7) İzin reddedilirse ──
  await setPermission('denied')
  await go(URL)
  await clickTab('Ayarlar'); await sleep(600)
  const denied = await evaluate(`({ st: document.querySelector('[data-testid="notification-status"]')?.textContent || '', dis: document.querySelector('[role="switch"]').disabled })`)
  check('Izin reddinde aciklama gosterilir', denied.st.includes('Bildirim izni kapalı'), denied.st)
  check('Izin reddinde anahtar devre disi', denied.dis === true)
  check('Izin reddinde takvim secenegi hala var', (await text()).includes('Takvim dosyasını indir'))
} catch (err) {
  console.error('HATA', err?.message || err)
  process.exitCode = 1
} finally {
  const passed = results.filter((r) => r.pass).length
  console.log(`\n=== ${passed}/${results.length} test gecti ===`)
  try { ws?.close() } catch {}
  try { chrome.kill() } catch {}
  await sleep(800)
  try { rmSync(WORK, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  process.exit(process.exitCode || 0)
}
