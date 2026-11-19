// Faz 5 uçtan uca testi: Bugün kartı, öneri, "bugün N kılındı", yükleme bandı, doğum günü tebriği (K-29).
// Önkoşul: `npm run build && npm run preview` (localhost:4173).
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ORIGIN = 'http://localhost:4173'
const URL = ORIGIN + '/'
const PORT = 9230
const PROFILE = join(process.env.TEMP, 'kaza-faz5-' + process.pid)
const DOWNLOADS = join(PROFILE + '-indirilen')
mkdirSync(DOWNLOADS, { recursive: true })

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
  '--disable-gpu', '--user-data-dir=' + PROFILE, 'about:blank'], { stdio: 'ignore' })

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
const text = () => evaluate(`document.body.textContent`)
const q = (sel, expr = 'textContent') => evaluate(`document.querySelector(${JSON.stringify(sel)})?.${expr} ?? null`)

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

  await go()
  await evaluate(`(() => {
    localStorage.clear();
    localStorage.setItem('kaza-namazi-takip-onboarding-v1', 'true');
    localStorage.setItem('kaza-namazi-takip-baslangic-v1', '500');
    localStorage.setItem('kaza-namazi-takip-v1', JSON.stringify({sabah:50,ogle:80,ikindi:200,aksam:60,yatsi:70,vitir:40}));
    localStorage.setItem('kaza-namazi-takip-profil-v1', JSON.stringify({gender:'male', birthDate:'1990-03-15', pubertyAge: 12}));
    return true })()`)
  await go()

  // ── Bugün kartı ──
  check('Bugun karti var', !!(await q('[data-testid="today-card"]', 'tagName')))
  check('Bugun kilinan 0', (await q('[data-testid="today-total"]')) === '0')
  const card = await q('[data-testid="today-card"]')
  check('Hicri tarih gosteriliyor', /\d{1,2} \S+ 14\d\d/.test(card), card.match(/\d{1,2} \S+ 14\d\d/)?.[0])
  check('Oneri: en cok borc = Ikindi', card.includes('İkindi') && card.includes('200 kaldı'))

  // Öneriye dokun → İkindi kartı vurgulanır
  await evaluate(`document.querySelector('[data-testid="today-card"] button').click(); true`)
  await sleep(400)
  check('Oneriye dokununca Ikindi karti vurgulandi', (await q('#vakit-ikindi', 'dataset.highlighted')) === 'true')

  // ── Kilidi aç, Sabah −1 → "bugün 1 kılındı" + Bugün kartı 1 ──
  await evaluate(`document.querySelector('[aria-label="Düzenleme kilidini aç"]').click(); true`)
  await sleep(300)
  await evaluate(`document.querySelector('[aria-label="Sabah kaza sayısını 1 azalt"]').click(); true`)
  await sleep(400)
  check('Kart alt yazisi: bugun 1 kilindi', ((await q('#vakit-sabah')) || '').includes('bugün 1 kılındı'))
  check('Diger kartlar: kalan kaza borcu', ((await q('#vakit-ogle')) || '').includes('kalan kaza borcu'))
  check('Bugun kilinan 1', (await q('[data-testid="today-total"]')) === '1')
  check('Allah kabul etsin', ((await q('[data-testid="today-card"]')) || '').includes('Allah kabul etsin'))

  // ── Yükleme bandı: kapat → yeniden açılışta da kapalı ──
  const hasInstall = (await text()).includes('Telefona Uygulama Olarak Yükle')
  check('Yukleme bandi gorunuyor', hasInstall)
  await evaluate(`document.querySelector('[aria-label="Yükleme önerisini kapat"]').click(); true`)
  await sleep(300)
  check('Kapatinca gizlendi', !(await text()).includes('Telefona Uygulama Olarak Yükle'))
  await go()
  check('Yeniden acilista kapali kaldi', !(await text()).includes('Telefona Uygulama Olarak Yükle'))

  // ── Doğum günü tebriği (K-29): söz artık gerçekten tutuluyor ──
  const t = await text()
  check('Dogum gunu karti var', t.includes('Takvim & Yaş Bilgisi'))
  check('Kartta tebrigi ac dugmesi', t.includes('Tebriği aç'))
  await send('Browser.setPermission', { permission: { name: 'notifications' }, setting: 'granted', origin: ORIGIN })
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tebriği aç')).click(); true`)
  await sleep(500)
  check('Dugmeyle acildi (kart: Tebrik acik)', !!(await q('[data-testid="birthday-greeting-on"]', 'tagName')))
  const rs = await evaluate(`JSON.parse(localStorage.getItem('kaza-namazi-takip-bildirim-v1') || '{}')`)
  check('Ayar kaydedildi (birthday: true)', rs.birthday === true)

  // Ayarlar: doğum günü bölümü + 10 yıllık takvim dosyası
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS })
  await evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Ana gezinme"] button')).find(b => b.textContent.includes('Ayarlar')).click(); true`)
  await sleep(500)
  check('Ayarlarda dogum gunu bolumu, anahtar acik',
    (await q('[data-testid="birthday-greeting"] [role="switch"]', 'getAttribute("aria-checked")')) === 'true')
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Doğum günlerimi takvime ekle')).click(); true`)
  await sleep(1500)
  const icsFile = readdirSync(DOWNLOADS).find((f) => f.startsWith('dogum-gunlerim') && f.endsWith('.ics'))
  const ics = icsFile ? readFileSync(join(DOWNLOADS, icsFile), 'utf8') : ''
  check('Dogum gunu takvim dosyasi: 10 Miladi + Hicri',
    (ics.match(/SUMMARY:Miladî doğum günüm/g) || []).length === 10 && (ics.match(/SUMMARY:Hicrî doğum günüm/g) || []).length >= 10,
    icsFile)

  // Gerçek tetiklenme: doğum günü = bugün, sayfa saati bugün 10:00
  const now = new Date()
  const bday = `1990-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const ten = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0).getTime()
  const { identifier: clock } = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => { const R = Date, O = ${ten} - ${Date.now()};
      class F extends R { constructor(...a) { if (a.length === 0) super(R.now() + O); else super(...a) } static now() { return R.now() + O } }
      window.Date = F })()`
  })
  await evaluate(`(async () => {
    localStorage.setItem('kaza-namazi-takip-profil-v1', JSON.stringify({gender:'male', birthDate:'${bday}', pubertyAge: 12}));
    localStorage.removeItem('kaza-namazi-takip-dogum-gunu-gonderilen');
    const reg = await navigator.serviceWorker.ready; (await reg.getNotifications()).forEach(n => n.close());
    return true })()`)
  await go()
  let notes = []
  for (let i = 0; i < 10 && !notes.length; i++) {
    await sleep(500)
    notes = await evaluate(`navigator.serviceWorker.ready.then(r => r.getNotifications()).then(l => l.map(n => n.title + ' | ' + n.body))`)
  }
  check('Dogum gununde tebrik bildirimi geldi', notes.some((n) => n.startsWith('Miladî Doğum Gününüz Kutlu Olsun!')), JSON.stringify(notes))
  check('Tebrikte dogru yas', notes.some((n) => n.includes(`${now.getFullYear() - 1990}. yaşınız`)))
  check('Gonderim kaydedildi', (await evaluate(`localStorage.getItem('kaza-namazi-takip-dogum-gunu-gonderilen')`))?.includes(`miladi-${now.getFullYear()}`))
  await evaluate(`navigator.serviceWorker.ready.then(r => r.getNotifications()).then(l => { l.forEach(n => n.close()); return true })`)
  await go()
  await sleep(2500)
  const again = await evaluate(`navigator.serviceWorker.ready.then(r => r.getNotifications()).then(l => l.length)`)
  check('Yeniden acilista ikinci kez gelmedi', again === 0, again)
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: clock })

  // ── Borç bitince öneri ──
  await evaluate(`localStorage.setItem('kaza-namazi-takip-v1', JSON.stringify({sabah:0,ogle:0,ikindi:0,aksam:0,yatsi:0,vitir:0})); true`)
  await go()
  check('Borc yokken: Borc kalmadi', ((await q('[data-testid="today-card"]')) || '').includes('Borç kalmadı'))
} catch (err) {
  console.error('HATA', err?.message || err)
  process.exitCode = 1
} finally {
  const passed = results.filter((r) => r.pass).length
  console.log(`\n=== ${passed}/${results.length} test gecti ===`)
  try { ws?.close() } catch {}
  try { chrome.kill() } catch {}
  await sleep(800)
  try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  try { rmSync(DOWNLOADS, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  process.exit(process.exitCode || 0)
}
