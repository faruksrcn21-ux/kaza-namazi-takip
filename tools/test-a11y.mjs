// Erişilebilirlik denetimi (NFR-06: WCAG 2.2 AA) — axe-core ile 4 ekran.
// "serious" / "critical" ihlal varsa başarısız olur.
// Önkoşul: `npm run build && npm run preview` (localhost:4173).
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { readFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const AXE = readFileSync(join(dirname(require.resolve('axe-core')), 'axe.min.js'), 'utf8')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:4173/'
const PORT = 9229
const PROFILE = join(process.env.TEMP, 'kaza-a11y-' + process.pid)
const VERBOSE = process.argv.includes('--ayrinti')

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
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error('JS hatasi: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result.value
}
const waitReady = async () => {
  for (let i = 0; i < 60; i++) {
    try { if (await evaluate(`document.readyState === 'complete' && !!document.getElementById('root')?.children.length`)) return } catch {}
    await sleep(250)
  }
  throw new Error('Sayfa hazir olmadi')
}
const go = async () => { await send('Page.navigate', { url: URL }); await sleep(300); await waitReady(); await sleep(500) }
const clickTab = (label) =>
  evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Ana gezinme"] button')).find(b => b.textContent.includes(${JSON.stringify(label)}))?.click(); true`)

const audit = async (screen) => {
  await evaluate(`document.fonts.ready.then(() => true)`)
  // Animasyonlar (fade-in) bitmeden kontrast yanlış ölçülmesin
  await sleep(700)
  // Kontrast ölçülebilsin diye cam/gradyan yüzeyler, tonlarının AÇIK ucunun düz rengine çevrilir
  // (açık zemin = açık renkli metin için en kötü durum). Gradyan metin (background-clip) ölçüm dışı.
  await evaluate(`(() => {
    if (document.getElementById('a11y-flatten')) return true;
    const st = document.createElement('style'); st.id = 'a11y-flatten';
    st.textContent = \`
      * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; animation: none !important; transition: none !important; }
      .islamic-pattern, body { background-image: none !important; background-color: #08070d !important; }
      .islamic-card { background: #161322 !important; }
      .islamic-card-emerald { background: #0b2a24 !important; }
      .islamic-card-violet { background: #1d1236 !important; }
      .blur-\[140px\], .blur-\[130px\], .blur-\[120px\], .blur-\[110px\], .mihrab-glow { display: none !important; }
    \`;
    document.head.appendChild(st);
    return true })()`)
  const res = await evaluate(`(async () => {
    if (!window.axe) { ${AXE}; }
    const r = await axe.run({ exclude: [['.text-brand-gradient']] }, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      resultTypes: ['violations', 'incomplete']
    });
    window.__axeStats = { passes: r.passes.length, incomplete: r.incomplete.map(v => v.id + ':' + v.nodes.length), ornek: r.incomplete.flatMap(v => v.nodes.slice(0, 20).map(n => (n.any[0]?.data?.messageKey || n.any[0]?.message || '?') + ' | ' + n.html.slice(0, 70))) };
    return r.violations.map(v => ({
      id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.map(n => ({ target: n.target.join(' '), summary: n.failureSummary, html: n.html.slice(0, 140) }))
    }));
  })()`)
  if (VERBOSE) console.log(`[${screen}] istatistik:`, JSON.stringify(await evaluate('window.__axeStats')))
  return res.map((v) => ({ ...v, screen }))
}

const all = []
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
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })

  // 1) Kurulum ekranı (boş cihaz)
  await go()
  await evaluate(`localStorage.clear(); true`)
  await go()
  all.push(...(await audit('Kurulum')))

  // 2) Dolu kullanıcı: geçmiş + konum + bildirim ayarı
  await evaluate(`(() => {
    localStorage.setItem('kaza-namazi-takip-onboarding-v1', 'true');
    localStorage.setItem('kaza-namazi-takip-baslangic-v1', '1000');
    localStorage.setItem('kaza-namazi-takip-v1', JSON.stringify({sabah:120,ogle:100,ikindi:90,aksam:80,yatsi:70,vitir:60}));
    localStorage.setItem('kaza-namazi-takip-profil-v1', JSON.stringify({gender:'male', birthDate:'1990-03-15', pubertyAge: 12}));
    localStorage.setItem('kaza-namazi-takip-konum-v1', JSON.stringify({source:'city',city:'Konya',lat:37.87,lon:32.48}));
    const d = new Date(), k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('kaza-namazi-takip-gecmis-v1', JSON.stringify({[k]: {kaza:{sabah:2,ogle:1}}}));
    return true })()`)
  await go()
  all.push(...(await audit('Takip')))
  await clickTab('Özet'); await sleep(400)
  all.push(...(await audit('Özet')))
  await clickTab('Ayarlar'); await sleep(400)
  all.push(...(await audit('Ayarlar')))
} catch (err) {
  console.error('HATA', err?.message || err)
  process.exitCode = 1
} finally {
  const blocking = all.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  for (const v of all) {
    console.log(`${v.impact === 'serious' || v.impact === 'critical' ? 'FAIL' : 'WARN'}  [${v.screen}] ${v.id} (${v.impact}) — ${v.help} · ${v.nodes.length} öğe`)
    if (VERBOSE) for (const n of v.nodes.slice(0, 12)) console.log(`        ${n.target}\n          ${n.summary?.split('\n').slice(1, 2).join(' ').trim()}\n          ${n.html}`)
  }
  console.log(`\n=== ${blocking.length === 0 ? 'ERISILEBILIRLIK: ciddi/kritik ihlal yok' : `${blocking.length} ciddi/kritik ihlal turu`} (toplam ${all.length} bulgu) ===`)
  if (blocking.length) process.exitCode = 1
  try { ws?.close() } catch {}
  try { chrome.kill() } catch {}
  await sleep(800)
  try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  process.exit(process.exitCode || 0)
}
