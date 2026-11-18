// Faz 2.5 uçtan uca testi: migrasyon + yedekleme/geri yükleme + tek yerde sıfırlama.
// Önkoşul: `npm run build && npm run preview` (http://localhost:4173) çalışıyor olmalı.
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:4173/'
const PORT = 9227
const WORK = join(process.env.TEMP, 'kaza-faz25-' + process.pid)
const PROFILE = join(WORK, 'profil')
const DOWNLOADS = join(WORK, 'indirilen')
mkdirSync(DOWNLOADS, { recursive: true })

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--user-data-dir=' + PROFILE, 'about:blank'], { stdio: 'ignore' })

let ws, msgId = 0
const pending = new Map()
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
const text = () => evaluate(`document.body ? document.body.innerText : ''`)
const clickTab = (label) =>
  evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Ana gezinme"] button')).find(b => b.textContent.includes(${JSON.stringify(label)}))?.click(); true`)
const clickButton = (label) =>
  evaluate(`(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes(${JSON.stringify(label)})); if (b) b.click(); return !!b })()`)
// Sabit bekleme yerine: belge tamamlandı + React kökü çizildi (en fazla 15 sn)
const waitReady = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      if (await evaluate(`document.readyState === 'complete' && !!document.getElementById('root')?.children.length`)) return true
    } catch { /* gezinme sırasında bağlam değişebilir */ }
    await sleep(250)
  }
  throw new Error('Sayfa 15 sn icinde hazir olmadi')
}
const reload = async () => { await send('Page.reload'); await sleep(300); await waitReady(); await sleep(300) }
const setFile = async (path) => {
  const { root } = await send('DOM.getDocument', { depth: -1 })
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-testid="restore-input"]' })
  await send('DOM.setFileInputFiles', { nodeId, files: [path] })
  await sleep(700)
}
const ls = (obj) => `(() => { localStorage.clear(); ${Object.entries(obj).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(' ')} return true })()`

const LIVE_V1 = {
  'kaza-namazi-takip-onboarding-v1': 'true',
  'kaza-namazi-takip-baslangic-v1': '1000',
  'kaza-namazi-takip-v1': JSON.stringify({ sabah: 111, ogle: 100, ikindi: 90, aksam: 80, yatsi: 70, vitir: 60 })
}

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
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable')
  await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true })
  await send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] }) // harici font ağdan bağımsız: anında yedek fonta düş
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS })
  await send('Page.navigate', { url: URL })
  await sleep(300)
  await waitReady()

  // ── 1) Canlı v1 kullanıcısı: sürüm etiketi eklenir, veri aynı kalır ──
  await evaluate(ls(LIVE_V1))
  await reload()
  const after = await evaluate(`({ v: localStorage.getItem('kaza-namazi-takip-sema'), c: localStorage.getItem('kaza-namazi-takip-v1') })`)
  check('v1 verisine sema=1 yazildi', after.v === '1', after.v)
  check('v1 sayaclari degismedi', after.c === LIVE_V1['kaza-namazi-takip-v1'])
  check('Takip ekrani v1 veriyle acildi', (await text()).includes('111'))

  // ── 2) Sıfırlama artık Takip ekranında yok, Ayarlar'da var ──
  check('Takip ekraninda sifirlama yok', !(await text()).includes('Tüm verileri ve geçmişi sıfırla'))
  await clickTab('Ayarlar'); await sleep(600)
  let t = await text()
  check('Ayarlarda sifirlama var', t.includes('Tüm verileri ve geçmişi sıfırla'))
  check('Yedek uyarisi gorunuyor', t.includes('Henüz yedek alınmadı'))

  // ── 3) Yedeği indir ──
  await clickButton('Yedeği indir'); await sleep(1500)
  const files = readdirSync(DOWNLOADS).filter((f) => f.endsWith('.json'))
  check('Yedek dosyasi indi', files.length === 1, files.join(','))
  const backup = JSON.parse(readFileSync(join(DOWNLOADS, files[0]), 'utf8'))
  check('Yedekte sayaclar dogru', backup.data?.counts?.sabah === 111 && backup.app === 'kaza-namazi-takip')
  t = await text()
  check('Son yedek: bugun', t.includes('Son yedek: bugün'))

  // ── 4) Bozuk dosya reddedilir, veri değişmez ──
  const badPath = join(WORK, 'bozuk.json')
  writeFileSync(badPath, '{"app":"baska-uygulama"}')
  const before = await evaluate(`localStorage.getItem('kaza-namazi-takip-v1')`)
  await setFile(badPath)
  t = await text()
  check('Bozuk dosyada hata mesaji', t.includes('Kaza Namazı Takip yedeği değil'))
  check('Bozuk dosyada onay penceresi acilmadi', !(await evaluate(`!!document.querySelector('[role="dialog"]')`)))
  check('Bozuk dosyada veri ayni', (await evaluate(`localStorage.getItem('kaza-namazi-takip-v1')`)) === before)

  // ── 5) Yeni telefon: boş cihaz → kurulum ekranı → yedekten geri yükle ──
  await evaluate(`localStorage.clear(); true`)
  await reload()
  t = await text()
  check('Bos cihazda kurulum ekrani', t.includes('Kaza sayımı biliyorum'))
  check('Kurulumda geri yukle baglantisi', t.includes('Yedekten geri yükle'))
  const goodPath = join(WORK, 'yedek.json')
  writeFileSync(goodPath, JSON.stringify(backup))
  await setFile(goodPath)
  t = await text()
  check('Onay penceresinde ozet', t.includes('Yedeği geri yükle') && t.includes('511 vakit'), t.match(/Kalan borç\s*[\d.]+ vakit/)?.[0])
  await evaluate(`Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.trim() === 'Geri yükle').click(); true`)
  await sleep(500)
  await waitReady()
  await sleep(300)
  t = await evaluate(`document.body.textContent`) // innerText CSS uppercase uygular
  check('Geri yukleme sonrasi Takip ekrani', t.includes('Toplam Kalan Kaza Borcu') && t.includes('111'))
  check('Geri yukleme sonrasi sema=1', (await evaluate(`localStorage.getItem('kaza-namazi-takip-sema')`)) === '1')
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
