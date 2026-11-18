import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { rmSync } from 'node:fs'
import { join } from 'node:path'

// Her çalıştırma kendi temiz profilini kullanır: eski build'in service worker'ı
// testi ortasında sayfayı yeniden yükleyip kararsızlaştırmasın (TD-04).
const PROFILE = join(process.env.TEMP, 'kaza-chrome-faz2-' + process.pid)

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:4173/'
const PORT = 9226

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--user-data-dir=' + PROFILE,
  'about:blank'
], { stdio: 'ignore' })

let ws, msgId = 0
const pending = new Map()
const send = (method, params = {}) => {
  const id = ++msgId
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((res, rej) => pending.set(id, { res, rej }))
}
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true })
  if (r.exceptionDetails) throw new Error('JS: ' + (r.exceptionDetails.exception?.description || 'hata'))
  return r.result.value
}
const results = []
const check = (name, pass, detail) => {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ->  ' + detail : ''}`)
  if (!pass) process.exitCode = 1
}
const clickTab = (label) =>
  evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Ana gezinme"] button')).find(b => b.textContent.includes(${JSON.stringify(label)}))?.click(); true`)
const bodyText = () => evaluate(`document.body.textContent || ''`)

try {
  let target = null
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/json/new?${encodeURIComponent(URL)}`, { method: 'PUT' })
      target = await res.json()
      break
    } catch { await sleep(250) }
  }
  if (!target) throw new Error('hedef yok')
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? rej(new Error('cdp')) : res(msg.result)
    }
  }
  await send('Page.enable')
  await send('Network.enable')
  await send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] }) // harici font ağdan bağımsız: anında yedek fonta düş
  await send('Runtime.enable')
  await sleep(1200)

  // Servis worker bayat bundle servis edebilir; once tumunu temizle.
  await evaluate(`(async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    return true;
  })()`)
  await send('Network.clearBrowserCache')
  await send('Network.enable')
  await send('Network.setCacheDisabled', { cacheDisabled: true })

  await evaluate(`(() => {
    localStorage.clear();
    localStorage.setItem('kaza-namazi-takip-onboarding-v1', 'true');
    localStorage.setItem('kaza-namazi-takip-baslangic-v1', '100');
    localStorage.setItem('kaza-namazi-takip-v1', JSON.stringify({sabah:10,ogle:10,ikindi:10,aksam:10,yatsi:10,vitir:0}));
    localStorage.setItem('kaza-namazi-takip-konum-v1', JSON.stringify({source:'city',city:'İstanbul',lat:41.01,lon:28.98}));
    return true;
  })()`)
  await send('Page.reload')
  await sleep(1800)

  await clickTab('Ayarlar')
  await sleep(800)
  let text = await bodyText()
  check('Vakit hesabi basligi', text.includes('Vakit'))
  check('Diyanet etiketi', text.includes('Diyanet'))
  for (const v of ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'Vitir']) {
    check(`Vakit satiri: ${v}`, text.includes(v))
  }
  for (const n of ['Teheccüd', 'Kuşluk', 'Evvâbin']) {
    check(`Nafile satiri: ${n}`, text.includes(n))
  }
  const times = await evaluate(`(document.body.textContent.match(/\\d{2}:\\d{2}/g) || []).length`)
  check('Saat formati (en az 8)', times >= 8, `bulunan: ${times}`)
  const sliders = await evaluate(`document.querySelectorAll('input[type="range"]').length`)
  check('Sapma slider 6 adet', sliders === 6, `bulunan: ${sliders}`)

  const before = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('li'));
    const r = rows.find(li => li.textContent.includes('Sabah') && /\\d{2}:\\d{2}/.test(li.textContent));
    return r ? r.textContent.match(/\\d{2}:\\d{2}/)[0] : null;
  })()`)
  await evaluate(`(() => {
    const s = document.querySelector('input[aria-label="Sabah vakit sapması (dakika)"]');
    if (!s) return false;
    s.focus();
    const proto = window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) { desc.set.call(s, '5'); }
    s.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
  await sleep(600)
  const offsets = await evaluate(`localStorage.getItem('kaza-namazi-takip-vakit-sapma-v1')`)
  let offOk = false
  try { offOk = JSON.parse(offsets)?.sabah === 5 } catch {}
  check('Sapma localStorage yazildi', offOk, String(offsets).slice(0, 80))
  const after = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('li'));
    const r = rows.find(li => li.textContent.includes('Sabah') && /\\d{2}:\\d{2}/.test(li.textContent));
    return r ? r.textContent.match(/\\d{2}:\\d{2}/)[0] : null;
  })()`)
  check('Sapma saati degistirdi (+5)', !!before && !!after && before !== after, `${before} -> ${after}`)

  await evaluate(`localStorage.setItem('kaza-namazi-takip-konum-v1', JSON.stringify({source:'manual',city:null,lat:39.93,lon:32.86})); true`)
  await send('Page.reload')
  await sleep(1800)
  await clickTab('Ayarlar')
  await sleep(700)
  text = await bodyText()
  check('Manuel konum gosterimi', text.includes('Manuel:'))
  check('Manuel konumda vakit var', /Sabah/.test(text) && /\d{2}:\d{2}/.test(text))

  await evaluate(`localStorage.removeItem('kaza-namazi-takip-konum-v1'); true`)
  await send('Page.reload')
  await sleep(1800)
  await clickTab('Ayarlar')
  await sleep(700)
  text = await bodyText()
  const noLocLow = text.toLocaleLowerCase('tr')
  check('Konumsuz uyari', noLocLow.includes('konum se'))
} catch (err) {
  console.error('HATA', err && err.message ? err.message : err)
  process.exitCode = 1
} finally {
  const passed = results.filter((r) => r.pass).length
  console.log(`\n=== ${passed}/${results.length} test gecti ===`)
  try { chrome.kill() } catch {}
  await sleep(800)
  try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  await sleep(500)
  process.exit(process.exitCode || 0)
}
