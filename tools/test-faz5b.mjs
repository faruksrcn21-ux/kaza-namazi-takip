// Faz 5 (2. tur) uçtan uca testi: günlük hedef, ilerleme paylaşımı, açık tema.
// Önkoşul: `npm run build && npm run preview` (localhost:4173).
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:4173/'
const PORT = 9232
const WORK = join(process.env.TEMP, 'kaza-faz5b-' + process.pid)
const DOWNLOADS = join(WORK, 'indirilen')
mkdirSync(DOWNLOADS, { recursive: true })
const KEEP = process.argv.find((a) => a.startsWith('--kart='))?.slice(7) // paylaşım resmini incelemek için kopyala

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
  '--disable-gpu', '--user-data-dir=' + join(WORK, 'profil'), 'about:blank'], { stdio: 'ignore' })

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
const waitReady = async () => {
  for (let i = 0; i < 60; i++) {
    try { if (await evaluate(`document.readyState === 'complete' && !!document.getElementById('root')?.children.length`)) return } catch {}
    await sleep(250)
  }
  throw new Error('Sayfa hazir olmadi')
}
const go = async () => { await send('Page.navigate', { url: URL }); await sleep(300); await waitReady(); await sleep(400) }
const q = (sel, expr = 'textContent') => evaluate(`document.querySelector(${JSON.stringify(sel)})?.${expr} ?? null`)
const tab = (label) => evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Ana gezinme"] button')).find(b => b.textContent.includes(${JSON.stringify(label)})).click(), true`)
const radio = (group, label) => evaluate(`Array.from(document.querySelectorAll('[role="radiogroup"][aria-label="${group}"] [role="radio"]')).find(b => b.textContent.trim() === ${JSON.stringify(label)}).click(), true`)
// JPEG boyutu: SOF0/SOF2 işaretçisinden (FFC0/FFC2) yükseklik +5, genişlik +7
const jpegSize = (buf) => {
  for (let i = 2; i < buf.length - 9; ) {
    if (buf[i] !== 0xff) { i++; continue }
    const m = buf[i + 1]
    if (m === 0xc0 || m === 0xc2) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return { w: 0, h: 0 }
}

try {
  let target
  for (let i = 0; i < 40 && !target; i++) {
    try { target = await (await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: 'PUT' })).json() } catch { await sleep(250) }
  }
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result) }
  }
  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS })

  await go()
  await evaluate(`(() => {
    localStorage.clear();
    localStorage.setItem('kaza-namazi-takip-onboarding-v1', 'true');
    localStorage.setItem('kaza-namazi-takip-baslangic-v1', '1000');
    localStorage.setItem('kaza-namazi-takip-v1', JSON.stringify({sabah:100,ogle:100,ikindi:100,aksam:100,yatsi:100,vitir:100}));
    const d = new Date(), k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('kaza-namazi-takip-gecmis-v1', JSON.stringify({[k]: {kaza:{sabah:3,ogle:1}}}));
    return true })()`)
  await go()

  // ── Günlük hedef ──
  check('Hedef kapaliyken Bugun kartinda oran yok', !((await q('[data-testid="today-card"]')) || '').includes(' / '))
  await tab('Ayarlar'); await sleep(400)
  check('Ayarlarda hedef bolumu', !!(await q('[data-testid="goal-settings"]', 'tagName')))
  await radio('Günlük hedef', '6'); await sleep(300)
  check('Hedef kaydedildi (6)', (await evaluate(`localStorage.getItem('kaza-namazi-takip-hedef-v1')`)) === '6')
  const preview = await q('[data-testid="goal-preview"]')
  check('Hedefle bitis onizlemesi (600/6 = 100 gun)', preview.includes('Her gün 6 vakit') && preview.includes('3 ay'), preview)
  await tab('Takip'); await sleep(400)
  const today = await q('[data-testid="today-card"]')
  check('Bugun karti: 4 / 6 ve hedefe 2 kaldi', today.includes('/ 6') && today.includes('Hedefe 2 kaldı'))
  check('Hedef cubugu', (await q('[aria-label="Günlük hedef"][role="progressbar"]', 'getAttribute("aria-valuenow")')) === '4')
  await tab('Özet'); await sleep(400)
  check('Ozet: hedefle bitis satiri', ((await q('[data-testid="goal-finish"]')) || '').includes('Hedefinle (6/gün)'))
  check('Ozet grafigi: hedef cizgisi', !!(await q('[data-testid="goal-line"]', 'tagName')))

  // ── Paylaşım resmi (masaüstünde indirme) ──
  await evaluate(`document.querySelector('[data-testid="share-progress"] button').click(), true`)
  let png = null
  for (let i = 0; i < 20 && !png; i++) { await sleep(300); png = readdirSync(DOWNLOADS).find((f) => f.endsWith('.jpg')) }
  check('Ilerleme karti indi', !!png, png)
  if (png) {
    const buf = readFileSync(join(DOWNLOADS, png))
    const { w, h } = jpegSize(buf)
    check('Kart 1080x1350 JPEG', buf[0] === 0xff && buf[1] === 0xd8 && w === 1080 && h === 1350, `${w}x${h}`)
    const kb = Math.round(buf.length / 1024)
    check('Kart paylasima uygun boyutta (40–400 KB)', kb > 40 && kb < 400, `${kb} KB`)
    if (KEEP) (await import('node:fs')).copyFileSync(join(DOWNLOADS, png), KEEP)
  }

  // ── K-34: +1/+5 yeni borçtur — yüzdenin paydası da büyür; geri alınınca geri iner ──
  await tab('Takip'); await sleep(400)
  const pct = () => evaluate(`(document.body.textContent.match(/%(\\d+)\\s*tamamlandı/) || [])[1] || null`)
  const initial = () => evaluate(`Number(localStorage.getItem('kaza-namazi-takip-baslangic-v1'))`)
  // Başlangıç: 1000 borç, kalan 600 → %40
  check('Baslangic yuzdesi %40', (await pct()) === '40', await pct())
  await evaluate(`document.querySelector('[aria-label="Düzenleme kilidini aç"]').click(), true`); await sleep(300)
  await evaluate(`document.querySelector('[aria-label="Sabah kaza sayısını 5 artır"]').click(), true`); await sleep(400)
  check('+5 sonrasi baslangic borcu 1005', (await initial()) === 1005, await initial())
  // Kılınan 400 değişmedi: 400/1005 = %39,8 → %39 (eskiden payda 1000 kalır, %39,5 → yuvarlamayla %40 gösterirdi)
  check('+5 sonrasi yuzde %39 (kilinan oranı korunur)', (await pct()) === '39', await pct())
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Geri Al').click(), true`); await sleep(400)
  check('Geri alinca baslangic borcu 1000', (await initial()) === 1000, await initial())
  check('Geri alinca yuzde %40', (await pct()) === '40', await pct())
  // Özet: eklenen borç "kılınan" sayılmaz — bugün 4 kılındı, +5 eklenip geri alındı
  await evaluate(`document.querySelector('[aria-label="Öğle kaza sayısını 5 artır"]').click(), true`); await sleep(400)
  await tab('Özet'); await sleep(400)
  const total = await q('[aria-label="Dönem grafiği"] strong') // başlıktaki "Toplam N"
  check('Ozet toplami yalniz kilinan (4, eklenen 5 sayilmaz)', total === '4', total)

  // ── Tema ──
  // Varsayılan: Sistem (K-33) — telefon koyuysa koyu, açıksa açık
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }); await sleep(300)
  check('Varsayilan (sistem koyu) -> koyu', (await evaluate(`document.documentElement.dataset.theme`)) === 'dark')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] }); await sleep(300)
  check('Varsayilan (sistem acik) -> acik', (await evaluate(`document.documentElement.dataset.theme`)) === 'light')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }); await sleep(300)
  check('Varsayilan cihaza yazilmadi (secim yapilana kadar)', (await evaluate(`localStorage.getItem('kaza-namazi-takip-tema')`)) === null)
  await tab('Ayarlar'); await sleep(400)
  check('Ayarlarda secili tema: Sistem', ((await q('[data-testid="theme-settings"] [role="radio"][aria-checked="true"]')) || '').trim() === 'Sistem')
  await radio('Tema', 'Açık'); await sleep(300)
  check('Acik secilince uygulandi', (await evaluate(`document.documentElement.dataset.theme`)) === 'light')
  check('Meta theme-color acik', (await q('meta[name="theme-color"]', 'getAttribute("content")')) === '#f4efe4')
  check('Zemin acik', (await evaluate(`getComputedStyle(document.body).backgroundColor`)) === 'rgb(244, 239, 228)')
  // Yeniden açılış: React'ten önce (satır içi betik) uygulanmalı
  await send('Page.navigate', { url: URL })
  let early = null
  for (let i = 0; i < 40 && !early; i++) {
    try { early = await evaluate(`document.documentElement.dataset.theme || null`) } catch {}
    if (!early) await sleep(25)
  }
  check('Yeniden acilista acik tema ilk anda uygulandi', early === 'light', early)
  await waitReady()
  await tab('Ayarlar'); await sleep(400)
  await radio('Tema', 'Sistem'); await sleep(300)
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }); await sleep(300)
  check('Sistem (telefon koyu) -> koyu', (await evaluate(`document.documentElement.dataset.theme`)) === 'dark')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] }); await sleep(300)
  check('Sistem (telefon acik) -> canli olarak acik', (await evaluate(`document.documentElement.dataset.theme`)) === 'light')
  await radio('Tema', 'Koyu'); await sleep(300)
  check('Koyuya donus', (await evaluate(`document.documentElement.dataset.theme`)) === 'dark')
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
