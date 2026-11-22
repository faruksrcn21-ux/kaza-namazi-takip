// GERÇEK GÜNCELLEME TESTİ (NFR-01): canlı sürüm (main) → yeni sürüm → geri dönüş.
// Aynı adres (origin) ve aynı tarayıcı profili kullanılır; service worker güncellemesi
// telefona kurulu uygulamadaki gibi gerçekleşir.
// Hazırlık (canlı sürümü ayrı klasörde derle):
//   git archive main | tar -x -C <klasör>
//   <klasör>
ode_modules → bu projenin node_modules'una bağlantı (junction), sonra orada `npx vite build`
//   (Bağlantıyı kaldırırken YALNIZ bağlantıyı sil: [System.IO.Directory]::Delete(yol) — rm -rf hedefi siler!)
// Kullanım: npm run build && node tools/test-guncelleme.mjs <klasör>
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const V2_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const V1_DIR = resolve(process.argv[2] || '')
const PORT = 4180
const URL = `http://localhost:${PORT}/`
const CDP = 9246
const PROFILE = join(process.env.TEMP, 'kaza-guncelleme-' + process.pid)
const V1_KEYS = ['kaza-namazi-takip-v1', 'kaza-namazi-takip-baslangic-v1', 'kaza-namazi-takip-onboarding-v1', 'kaza-namazi-takip-profil-v1']

const results = []
const check = (name, pass, detail) => {
  results.push(pass)
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? '  ->  ' + detail : ''}`)
  if (!pass) process.exitCode = 1
}

// ── Sunucu: aynı portta canlı ↔ yeni sürüm ──
let server = null
const startServer = async (dir) => {
  server = spawn(process.execPath, [join(dir, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: dir, stdio: 'ignore' })
  for (let i = 0; i < 80; i++) { try { if ((await fetch(URL)).ok) return } catch {} await sleep(250) }
  throw new Error('Sunucu açılmadı: ' + dir)
}
const stopServer = async () => {
  if (!server) return
  server.kill(); server = null
  for (let i = 0; i < 40; i++) { try { await fetch(URL); await sleep(250) } catch { return } }
}

// ── Chrome (tek profil, baştan sona) ──
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${CDP}`,
  '--no-first-run', '--disable-gpu', '--user-data-dir=' + PROFILE, 'about:blank'], { stdio: 'ignore' })
let ws, id = 0
const pending = new Map()
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res, rej) => pending.set(i, { res, rej })) }
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}
const ready = async () => {
  for (let i = 0; i < 60; i++) { try { if (await ev(`document.readyState==='complete' && !!document.getElementById('root')?.children.length`)) return } catch {} await sleep(250) }
  throw new Error('Sayfa hazır olmadı')
}
const reload = async () => { await send('Page.reload'); await sleep(400); await ready(); await sleep(500) }
const storage = () => ev(`Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]))`)
const isV2 = () => ev(`!!document.querySelector('[data-testid="today-card"]')`)
const shownTotal = () => ev(`(() => { const t = document.body.textContent.match(/Toplam Kalan Kaza Borcu\\s*([\\d.]+)/i); return t ? t[1] : null })()`)
const shownPct = () => ev(`(document.body.textContent.match(/%(\\d+)\\s*tamamlandı/) || [])[1] || null`)
const pressMinus = async (name, times = 1) => {
  for (let i = 0; i < times; i++) {
    const ok = await ev(`(() => { const b = document.querySelector('[aria-label="${name} kaza sayısını 1 azalt"]'); if (!b || b.disabled) return false; b.click(); return true })()`)
    if (!ok) return false
    await sleep(250)
  }
  return true
}
const unlock = () => ev(`(() => { const b = document.querySelector('[aria-label="Düzenleme kilidini aç"]'); if (b) b.click(); return true })()`)
// Sürüm değişimini bekle: SW yeni sürümü indirip devralana kadar yenile (telefonda: uygulamayı tekrar açmak)
const waitVersion = async (wantV2) => {
  for (let i = 0; i < 12; i++) {
    await reload()
    if ((await isV2()) === wantV2) return i + 1
    await sleep(1200)
  }
  return -1
}

try {
  let t
  for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://localhost:${CDP}/json/new?about:blank`, { method: 'PUT' })).json() } catch { await sleep(250) } }
  ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result) } }
  await send('Page.enable'); await send('Runtime.enable')

  // ═══ 1) CANLI SÜRÜM: kullanıcı verisi oluşur, service worker kurulur ═══
  await startServer(V1_DIR)
  await send('Page.navigate', { url: URL }); await ready()
  await ev(`(() => { localStorage.clear();
    localStorage.setItem('kaza-namazi-takip-onboarding-v1', 'true');
    localStorage.setItem('kaza-namazi-takip-baslangic-v1', '9000');
    localStorage.setItem('kaza-namazi-takip-v1', JSON.stringify({sabah:1240,ogle:1180,ikindi:1210,aksam:1195,yatsi:1230,vitir:1205}));
    localStorage.setItem('kaza-namazi-takip-profil-v1', JSON.stringify({gender:'female',birthDate:'1990-03-15',pubertyAge:12,hasStartedPrayer:false,avgHayzDays:6,birthCount:2,nifasDaysPerBirth:40}));
    return true })()`)
  await reload()
  check('Canli surum acildi (yeni surum degil)', (await isV2()) === false)
  await unlock()
  check('Canli surumde kullanici 3 Sabah kazasi kildi', await pressMinus('Sabah', 3))
  await sleep(400)
  const swV1 = await ev(`navigator.serviceWorker.ready.then(r => !!r.active)`)
  check('Canli surumun service worker\'i kurulu (telefondaki gibi)', swV1)
  const before = await storage()
  const totalV1 = await shownTotal(), pctV1 = await shownPct()
  console.log('      canli surum: kalan', totalV1, '· %', pctV1, '· sabah', JSON.parse(before['kaza-namazi-takip-v1']).sabah)

  // ═══ 2) GÜNCELLEME: aynı adreste yeni sürüm yayına alınır ═══
  await stopServer(); await startServer(V2_DIR)
  const opens = await waitVersion(true)
  check('Yeni surume gecildi (SW guncellemesi)', opens > 0, `${opens}. acilista`)
  const after = await storage()
  for (const k of V1_KEYS) check(`Veri birebir korundu: ${k}`, after[k] === before[k], after[k] === before[k] ? 'aynı' : `${before[k]} → ${after[k]}`)
  check('Surum etiketi eklendi (sema = 1), baska degisiklik yok', after['kaza-namazi-takip-sema'] === '1')
  check('Ekranda ayni kalan borc', (await shownTotal()) === totalV1, `${totalV1} → ${await shownTotal()}`)
  check('Ekranda ayni yuzde', (await shownPct()) === pctV1, `%${pctV1} → %${await shownPct()}`)
  check('Kurulum sihirbazi tekrar acilmadi', !(await ev(`document.body.textContent.includes('Kaza sayımı biliyorum')`)))
  check('Profil (dogum tarihi) yeni surumde kullaniliyor', await ev(`document.body.textContent.includes('Takvim & Yaş Bilgisi')`))

  // Yeni sürümde kullanım devam eder
  await unlock()
  check('Yeni surumde Ogle kazasi kilindi', await pressMinus('Öğle', 2))
  await sleep(400)
  const v2data = await storage()
  check('Yeni surum kaydi ayni anahtara yazdi', JSON.parse(v2data['kaza-namazi-takip-v1']).ogle === 1178)

  // ═══ 3) GERİ DÖNÜŞ: bir sorun çıkarsa canlı eski sürüme döndürülür ═══
  await stopServer(); await startServer(V1_DIR)
  const back = await waitVersion(false)
  check('Eski surume geri donuldu', back > 0, `${back}. acilista`)
  const rb = await storage()
  for (const k of V1_KEYS) check(`Geri donuste veri korundu: ${k}`, rb[k] === v2data[k])
  await unlock()
  check('Eski surum yeni surumun yazdigi veriyle calisiyor', await pressMinus('İkindi', 1))
  await sleep(300)
  const rb2 = await storage()
  check('Eski surum kaydi dogru', JSON.parse(rb2['kaza-namazi-takip-v1']).ikindi === 1209 && JSON.parse(rb2['kaza-namazi-takip-v1']).ogle === 1178)
} catch (err) {
  console.error('HATA', err?.message || err)
  process.exitCode = 1
} finally {
  console.log(`\n=== ${results.filter(Boolean).length}/${results.length} test gecti ===`)
  try { ws?.close() } catch {}
  await stopServer()
  try { chrome.kill() } catch {}
  await sleep(800)
  try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  process.exit(process.exitCode || 0)
}
