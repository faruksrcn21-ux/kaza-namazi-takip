import { buildBuckets, normalizeHistory, sortedDays, todayKey } from './history'
import { getHijriDate } from './hijriDate'
import { progressPercent } from './progress'
import { ACCENT, GOLD, PAGE, PRIMARY, SAND } from '../themeColors'

const rgba = (hex, a) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`

/**
 * İLERLEME KARTI PAYLAŞIMI (Faz 5 — FR-OZT-05, K-31)
 * Gizlilik: varsayılan olarak MUTLAK borç sayısı yok; yalnız yüzde ve
 * son dönem kılınanlar. Kalan borç yalnız kullanıcı isterse eklenir.
 */
export const SHARE_W = 1080
export const SHARE_H = 1350

export function buildShareData({ history: rawHistory = {}, totalRemaining = 0, initialTotal = 0, showRemaining = false, now = new Date() }) {
  const history = normalizeHistory(rawHistory)
  const percent = progressPercent(initialTotal, totalRemaining)
  const last7 = buildBuckets(history, 'day', 7)
  const weekTotal = last7.reduce((s, b) => s + (b.kaza || 0), 0)
  const today = history[todayKey(now)]
  const todayTotal = today ? Object.values(today.kaza || {}).reduce((s, n) => s + (n || 0), 0) : 0
  const dayCount = sortedDays(history).filter((d) => (d.toplamKaza || 0) > 0).length
  const hijri = getHijriDate(now)
  return {
    percent,
    todayTotal,
    weekTotal,
    dayCount,
    remaining: showRemaining ? Math.max(0, totalRemaining) : null,
    dateText: `${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}${hijri ? ` · ${hijri.formatted}` : ''}`
  }
}

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR')
const GREEN = PRIMARY[300]
const PURPLE = ACCENT[300]
const SANS = '"Plus Jakarta Sans", system-ui, sans-serif'
const SERIF = 'Amiri, serif'

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Kartı verilen 2D bağlama çizer (1080×1350). */
export function drawShareCard(ctx, data) {
  const W = SHARE_W
  const H = SHARE_H
  const cx = W / 2

  // Zemin: sıcak koyu + orman yeşili (üst) ve mor (alt) ışıma (K-35)
  ctx.fillStyle = PAGE
  ctx.fillRect(0, 0, W, H)
  let g = ctx.createRadialGradient(cx, 0, 0, cx, 0, 760)
  g.addColorStop(0, rgba(PRIMARY[800], 0.6))
  g.addColorStop(1, rgba(PRIMARY[800], 0))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  g = ctx.createRadialGradient(W, H, 0, W, H, 900)
  g.addColorStop(0, rgba(ACCENT[800], 0.4))
  g.addColorStop(1, rgba(ACCENT[800], 0))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // Besmele + başlık
  ctx.fillStyle = GOLD[300]
  ctx.font = `44px ${SERIF}`
  ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', cx, 120)
  const tg = ctx.createLinearGradient(cx - 300, 0, cx + 300, 0)
  tg.addColorStop(0, GREEN)
  tg.addColorStop(1, PURPLE)
  ctx.fillStyle = tg
  ctx.font = `800 64px ${SANS}`
  ctx.fillText('Kaza Namazı Takip', cx, 210)

  // İlerleme halkası
  const cy = 520
  const r = 220
  ctx.lineCap = 'round'
  ctx.lineWidth = 36
  ctx.strokeStyle = rgba(SAND[50], 0.08)
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  if (data.percent > 0) {
    const rg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    rg.addColorStop(0, PRIMARY[400])
    rg.addColorStop(1, ACCENT[500])
    ctx.strokeStyle = rg
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * data.percent) / 100)
    ctx.stroke()
  }
  ctx.fillStyle = SAND[50]
  ctx.font = `800 150px ${SANS}`
  ctx.fillText(`%${data.percent}`, cx, cy + 40)
  ctx.fillStyle = SAND[300]
  ctx.font = `600 40px ${SANS}`
  ctx.fillText('tamamlandı', cx, cy + 105)

  // İstatistik kutuları
  const stats = [
    ['Bugün', fmt(data.todayTotal)],
    ['Son 7 gün', fmt(data.weekTotal)],
    data.remaining != null ? ['Kalan', fmt(data.remaining)] : ['Kayıtlı gün', fmt(data.dayCount)]
  ]
  const boxW = 300
  const gap = 30
  const startX = cx - (boxW * 3 + gap * 2) / 2
  stats.forEach(([label, value], i) => {
    const x = startX + i * (boxW + gap)
    const y = 850
    roundRect(ctx, x, y, boxW, 190, 32)
    ctx.fillStyle = i === 2 ? rgba(ACCENT[500], 0.14) : rgba(PRIMARY[500], 0.14)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = i === 2 ? rgba(ACCENT[400], 0.35) : rgba(PRIMARY[400], 0.35)
    ctx.stroke()
    ctx.fillStyle = i === 2 ? ACCENT[200] : PRIMARY[200]
    ctx.font = `600 34px ${SANS}`
    ctx.fillText(label, x + boxW / 2, y + 68)
    ctx.fillStyle = SAND[50]
    ctx.font = `800 72px ${SANS}`
    ctx.fillText(value, x + boxW / 2, y + 152)
  })

  // Alt bilgi
  ctx.fillStyle = GOLD[300]
  ctx.font = `italic 46px ${SERIF}`
  ctx.fillText('Allah kabul etsin', cx, 1170)
  ctx.fillStyle = SAND[400]
  ctx.font = `500 32px ${SANS}`
  ctx.fillText(data.dateText, cx, 1250)
}

/** Fontlar yüklendikten sonra kartı JPEG Blob olarak üretir (PNG gradyanlarda ~1,3 MB tutuyordu). */
export async function createShareImage(data) {
  try {
    await Promise.all([
      document.fonts.load(`800 64px "Plus Jakarta Sans"`),
      document.fonts.load(`44px Amiri`, 'بِسْمِ'),
      document.fonts.load(`italic 46px Amiri`)
    ])
  } catch {
    /* yedek fontla devam */
  }
  const canvas = document.createElement('canvas')
  canvas.width = SHARE_W
  canvas.height = SHARE_H
  drawShareCard(canvas.getContext('2d'), data)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Resim oluşturulamadı'))), 'image/jpeg', 0.92)
  )
}
