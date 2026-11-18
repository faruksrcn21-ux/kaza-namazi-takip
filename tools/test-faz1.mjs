import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { rmSync } from 'node:fs'
import { join } from 'node:path'

// Her çalıştırma kendi temiz profilini kullanır: eski build'in service worker'ı
// testi ortasında sayfayı yeniden yükleyip kararsızlaştırmasın (TD-04).
const PROFILE = join(process.env.TEMP, 'kaza-chrome-faz1-' + process.pid)

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:4173/'
const PORT = 9225

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--user-data-dir=' + PROFILE,
  'about:blank'
], { stdio: 'ignore' })

let ws, msgId = 0
const pending = new Map()
function send(method, params = {}) {
  const id = ++msgId
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((res, rej) => pending.set(id, { res, rej }))
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true })
  if (r.exceptionDetails) throw new Error('JS hatasi: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result.value
}

const results = []
function check(name, pass, detail) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ->  ' + detail : ''}`)
  if (!pass) process.exitCode = 1
}

const clickTab = (label) =>
  evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Ana gezinme"] button')).find(b => b.textContent.includes(${JSON.stringify(label)}))?.click(); true`)

const seedHistory = () => {
  const today = new Date()
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const h = {}
  for (let i = 9; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const k = key(d)
    h[k] = {
      date: k,
      kaza: { sabah: 2, ogle: 1, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 },
      bulk: { sabah: 1, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 },
      kalan: { sabah: 50, ogle: 50, ikindi: 50, aksam: 50, yatsi: 50, vitir: 0 },
      kalanGunSonu: { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 },
      toplamKaza: 3, toplamBulk: 1, toplamKalan: 250, toplamKalanGunSonu: 0,
    }
  }
  return h
}

try {
  let target = null
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/json/new?${encodeURIComponent(URL)}`, { method: 'PUT' })
      target = await res.json()
      break
    } catch { await sleep(250) }
  }
  if (!target) throw new Error('Chrome hedef sekmesi acilamadi')
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result)
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
    localStorage.setItem('kaza-namazi-takip-gecmis-v1', JSON.stringify({}));
    return true;
  })()`)
  await send('Page.reload')
  await sleep(1800)

  await clickTab('Özet')
  await sleep(700)
  const emptyText = await evaluate(`document.body.innerText`)
  check('Bos durumda kayit-yok karti', emptyText.includes('Henüz kayıt yok'))

  const seeded = seedHistory()
  await evaluate(`localStorage.setItem('kaza-namazi-takip-gecmis-v1', ${JSON.stringify(JSON.stringify(seeded))}); true`)
  await send('Page.reload')
  await sleep(1800)
  await clickTab('Özet')
  await sleep(700)

  const bodyText = await evaluate(`document.body.textContent || ''`)
  const bodyLow = bodyText.toLocaleLowerCase('tr')
  check('Periyot secici var', bodyText.includes('Günlük') && bodyText.includes('Haftalık') && bodyText.includes('Aylık'))

  const svgInfo = await evaluate(`(() => {
    const svg = document.querySelector('[data-testid="bar-chart"]');
    if (!svg) return { yok: true };
    const html = svg.outerHTML;
    const bars = svg.querySelectorAll('[data-bar]').length;
    const stops = Array.from(svg.querySelectorAll('stop')).map(s => s.getAttribute('stop-color')).join(',');
    return { bars, stops, morVar: /c084fc|a855f7|purple|violet/i.test(html) };
  })()`)
  check('Grafik 7 sutun', svgInfo.bars === 7, `sutun: ${svgInfo.bars}`)
  check('TEK RENK mor yok', svgInfo.morVar === false, `stops: ${svgInfo.stops}`)
  check('Lejant tek kalem', bodyText.includes('Kılınan kaza') && !bodyText.includes('Toplu eklenen'))
  check('Vakit dagilimi var', bodyText.includes('Vakit dağılımı') && bodyText.includes('Sabah'))
  check('Karsilastirma karti', bodyLow.includes('karşılaştırma'))
  check('Tahmini bitis karti', bodyLow.includes('tahmini'))

  await evaluate(`Array.from(document.querySelectorAll('[role="tab"]')).find(b => b.textContent.includes('Haftalık'))?.click(); true`)
  await sleep(600)
  const weekBars = await evaluate(`document.querySelector('[data-testid="bar-chart"]')?.querySelectorAll('[data-bar]').length ?? -1`)
  check('Haftalik 4 sutun', weekBars === 4, `sutun: ${weekBars}`)
  const weekMor = await evaluate(`/c084fc|a855f7|purple|violet/i.test(document.querySelector('[data-testid="bar-chart"]')?.outerHTML || '')`)
  check('Haftalik TEK RENK', weekMor === false)

  await evaluate(`Array.from(document.querySelectorAll('[role="tab"]')).find(b => b.textContent.includes('Aylık'))?.click(); true`)
  await sleep(600)
  const monthBars = await evaluate(`document.querySelector('[data-testid="bar-chart"]')?.querySelectorAll('[data-bar]').length ?? -1`)
  check('Aylik 6 sutun', monthBars === 6, `sutun: ${monthBars}`)
  const monthMor = await evaluate(`/c084fc|a855f7|purple|violet/i.test(document.querySelector('[data-testid="bar-chart"]')?.outerHTML || '')`)
  check('Aylik TEK RENK', monthMor === false)

  await clickTab('Ayarlar')
  await sleep(700)
  const settingsText = await evaluate(`document.body.textContent || ''`)
  check('Ayarlar konum', settingsText.includes('Konum'))
  check('Ayarlar vakit placeholder', settingsText.includes('Vakit Hesabı'))
  check('Ayarlar bildirim placeholder', settingsText.includes('Bildirimler'))
  check('Ayarlar sifirlama', settingsText.includes('Tüm verileri ve geçmişi sıfırla'))
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

