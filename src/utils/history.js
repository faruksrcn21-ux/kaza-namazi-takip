import { PRAYERS } from '../constants/prayers'

// ────────────────────────────────────────────────
// Tarih yardımcıları — hepsi yerel saat diliminde
// ────────────────────────────────────────────────

/**
 * Bugünün tarihini "YYYY-MM-DD" biçiminde döner (yerel saat dilimi).
 * UTC değil — gece yarısı geçişi yerelde doğru yakalanmalı.
 */
export const todayKey = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * "YYYY-MM-DD" anahtarını yerel Date'e çevirir (saat 00:00).
 * Geçersiz anahtar için null döner.
 */
export const parseDateKey = (key) => {
  if (typeof key !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return null
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  if (Number.isNaN(date.getTime())) return null
  return date
}

/**
 * Belirli bir günün "n gün öncesi" anahtarını döner.
 * n=0 → bugün, n=1 → dün, ...
 */
export const shiftDays = (key, n) => {
  const date = parseDateKey(key)
  if (!date) return key
  date.setDate(date.getDate() - n)
  return todayKey(date)
}

/**
 * Tarih anahtarını Türkçe kısa etikete çevirir (grafik ekseni için).
 * Örn: "2026-10-19" → "19 Eki"
 */
export const formatDayLabel = (key) => {
  const date = parseDateKey(key)
  if (!date) return key
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}

/**
 * Tarih anahtarını Türkçe aylık etikete çevirir (aylık grafik için).
 * Örn: "2026-10" → "Eki 26"
 */
export const formatMonthLabel = (key) => {
  const date = parseDateKey(`${key}-01`)
  if (!date) return key
  return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
}

/**
 * Bir tarihin ait olduğu ISO haftasının başlangıç anahtarını (Pazartesi) döner.
 */
export const startOfWeekKey = (key) => {
  const date = parseDateKey(key)
  if (!date) return key
  const day = (date.getDay() + 6) % 7 // 0 = Pazartesi
  date.setDate(date.getDate() - day)
  return todayKey(date)
}

/**
 * Bir tarihin ait olduğu ayın anahtarını döner ("YYYY-MM").
 */
export const monthKey = (key) => (typeof key === 'string' ? key.slice(0, 7) : '')

// ────────────────────────────────────────────────
// Günlük kayıt şeması
// ────────────────────────────────────────────────

/**
 * Vakit sayıları için boş sayaç nesnesi.
 */
export const createEmptyCounts = () =>
  PRAYERS.reduce((acc, prayer) => {
    acc[prayer.id] = 0
    return acc
  }, {})

/**
 * Bir günün boş kayıt şablonu.
 *
 * @param {string} key - "YYYY-MM-DD"
 * @returns {Object} Günlük kayıt
 */
export const createEmptyDayRecord = (key) => ({
  date: key,
  // O gün yapılan (kalan borçtan düşülen) miktar — vakit bazlı
  kaza: createEmptyCounts(),
  // O gün toplu eklenen miktar — vakit bazlı, grafikte ayrı renkli katman
  bulk: createEmptyCounts(),
  // Gün içi anlık kalan borç görüntüsü (son sayaç hareketindeki değer)
  kalan: createEmptyCounts(),
  // Gün sonu kapanış kalan borcu (00:00'da yazılır)
  kalanGunSonu: createEmptyCounts(),
  toplamKaza: 0,
  toplamBulk: 0,
  toplamKalan: 0,
  toplamKalanGunSonu: 0
})

/**
 * İki sayaç nesnesini toplar (yeni nesne döner).
 */
export const sumCounts = (a = {}, b = {}) =>
  PRAYERS.reduce((acc, prayer) => {
    acc[prayer.id] = (a[prayer.id] || 0) + (b[prayer.id] || 0)
    return acc
  }, {})

/**
 * Sayaç nesnesindeki toplamı döner.
 */
export const totalOf = (counts = {}) =>
  Object.values(counts).reduce((sum, n) => sum + (n || 0), 0)

/**
 * Bir günün kaydını normalize eder — eksik alanları tamamlar.
 * Bozuk/eskimiş kayıtların çökmesini engeller.
 */
export const normalizeDayRecord = (key, raw) => {
  const base = createEmptyDayRecord(key)
  if (!raw || typeof raw !== 'object') return base
  const pick = (obj) =>
    PRAYERS.reduce((acc, prayer) => {
      const v = obj && obj[prayer.id]
      acc[prayer.id] = Number.isFinite(v) ? v : 0
      return acc
    }, {})
  const kaza = pick(raw.kaza)
  const bulk = pick(raw.bulk)
  const kalan = pick(raw.kalan)
  const kalanGunSonu = pick(raw.kalanGunSonu)
  return {
    date: key,
    kaza,
    bulk,
    kalan,
    kalanGunSonu,
    toplamKaza: totalOf(kaza),
    toplamBulk: totalOf(bulk),
    toplamKalan: totalOf(kalan),
    toplamKalanGunSonu: totalOf(kalanGunSonu)
  }
}

/**
 * Ham geçmiş nesnesini normalize edilmiş biçime çevirir.
 * @param {Object} raw - localStorage'dan gelen ham veri
 * @returns {Object} "YYYY-MM-DD" -> günlük kayıt
 */
export const normalizeHistory = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const result = {}
  for (const key of Object.keys(raw)) {
    if (!parseDateKey(key)) continue
    result[key] = normalizeDayRecord(key, raw[key])
  }
  return result
}

/**
 * Geçmiş nesnesinin tüm günlerini tarih sırasına göre döner.
 * @returns {Array<Object>} eskiden yeniye
 */
export const sortedDays = (history = {}) =>
  Object.keys(history)
    .sort()
    .map((key) => history[key])

// ────────────────────────────────────────────────
// Grafik/özet için toplulaştırma
// ────────────────────────────────────────────────

/**
 * Seçilen periyoda göre sütun verisi üretir.
 *
 * @param {Object} history   - normalize edilmiş geçmiş
 * @param {'day'|'week'|'month'} period
 * @param {number} bucketCount - kaç sütun gösterilecek
 * @returns {Array<{ key, label, kaza, bulk, kalan, toplam }>}
 */
export const buildBuckets = (history, period, bucketCount) => {
  const today = todayKey()
  const days = sortedDays(history)

  if (period === 'day') {
    // Son N gün — en yeni sağda
    const out = []
    for (let i = bucketCount - 1; i >= 0; i--) {
      const key = shiftDays(today, i)
      const rec = history[key]
      out.push({
        key,
        label: formatDayLabel(key),
        kaza: rec ? rec.toplamKaza : 0,
        bulk: rec ? rec.toplamBulk : 0,
        kalan: rec ? rec.toplamKalan : 0,
        toplam: rec ? rec.toplamKaza + rec.toplamBulk : 0
      })
    }
    return out
  }

  if (period === 'week') {
    // Son N ISO haftası (Pazartesi başlangıçlı)
    const weeks = []
    for (let i = bucketCount - 1; i >= 0; i--) {
      const startKey = shiftDays(startOfWeekKey(today), i * 7)
      weeks.push({ startKey, label: formatDayLabel(startKey) })
    }
    return weeks.map(({ startKey, label }) => {
      const endKey = shiftDays(startKey, -6)
      const inWeek = days.filter((d) => d.date >= startKey && d.date <= endKey)
      const kaza = inWeek.reduce((s, d) => s + d.toplamKaza, 0)
      const bulk = inWeek.reduce((s, d) => s + d.toplamBulk, 0)
      const kalan = inWeek.length ? inWeek[inWeek.length - 1].toplamKalan : 0
      return { key: startKey, label, kaza, bulk, kalan, toplam: kaza + bulk }
    })
  }

  // month — son N ay
  const months = []
  for (let i = bucketCount - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, label: formatMonthLabel(key) })
  }
  return months.map(({ key, label }) => {
    const inMonth = days.filter((d) => d.date.startsWith(key))
    const kaza = inMonth.reduce((s, d) => s + d.toplamKaza, 0)
    const bulk = inMonth.reduce((s, d) => s + d.toplamBulk, 0)
    const kalan = inMonth.length ? inMonth[inMonth.length - 1].toplamKalan : 0
    return { key, label, kaza, bulk, kalan, toplam: kaza + bulk }
  })
}

// ────────────────────────────────────────────────
// Faz 1 — karşılaştırma + tahmini bitiş
// ────────────────────────────────────────────────

export const PERIODS = {
  day: { bucketCount: 7, label: 'Günlük' },
  week: { bucketCount: 4, label: 'Haftalık' },
  month: { bucketCount: 6, label: 'Aylık' }
}

const bucketWindowSum = (history, period, bucketCount, offsetBuckets) => {
  const today = todayKey()
  const days = sortedDays(history)
  let startKey
  let endKey

  if (period === 'day') {
    startKey = shiftDays(today, offsetBuckets * bucketCount + bucketCount - 1)
    endKey = shiftDays(today, offsetBuckets * bucketCount)
  } else if (period === 'week') {
    const thisWeek = startOfWeekKey(today)
    startKey = shiftDays(thisWeek, offsetBuckets * bucketCount * 7 + (bucketCount - 1) * 7)
    endKey = shiftDays(shiftDays(thisWeek, offsetBuckets * bucketCount * 7), -6)
  } else {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (offsetBuckets * bucketCount + bucketCount - 1))
    startKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const e = new Date()
    e.setDate(1)
    e.setMonth(e.getMonth() - offsetBuckets * bucketCount + 1)
    e.setDate(e.getDate() - 1)
    endKey = todayKey(e)
  }

  const inWindow = days.filter((day) => day.date >= startKey && day.date <= endKey)
  const kaza = inWindow.reduce((s, day) => s + day.toplamKaza, 0)
  const bulk = inWindow.reduce((s, day) => s + day.toplamBulk, 0)
  return { kaza, bulk, toplam: kaza + bulk }
}

/**
 * Mevcut dönem ile önceki dönemi karşılaştırır.
 * @returns {{ simdiki, onceki, fark, yuzde, yon }}
 */
export const comparePeriods = (history, period, bucketCount) => {
  const simdiki = bucketWindowSum(history, period, bucketCount, 0).toplam
  const onceki = bucketWindowSum(history, period, bucketCount, 1).toplam
  const fark = simdiki - onceki
  let yuzde = null
  if (onceki > 0) yuzde = Math.round((fark / onceki) * 100)
  else if (simdiki > 0) yuzde = 100
  const yon = fark > 0 ? 'up' : fark < 0 ? 'down' : 'flat'
  return { simdiki, onceki, fark, yuzde, yon }
}

/**
 * Tahmini bitiş — son 7 günün ortalama hızı + en iyi gün.
 * @param {Object} history
 * @param {number} kalanBorc - anlık kalan toplam borç
 * @returns {{ gunlukHiz, enIyiGun, gunSayisi, tarih } | null}
 */
export const estimateFinish = (history, kalanBorc) => {
  const days = buildBuckets(history, 'day', 7)
  const toplam = days.reduce((s, b) => s + (b.kaza || 0), 0)
  const gunlukHiz = toplam / 7
  const enIyiGun = Math.max(0, ...days.map((b) => b.kaza || 0))
  if (!(kalanBorc > 0) || !(gunlukHiz > 0)) return null
  const gunSayisi = Math.ceil(kalanBorc / gunlukHiz)
  const d = new Date()
  d.setDate(d.getDate() + gunSayisi)
  return { gunlukHiz, enIyiGun, gunSayisi, tarih: todayKey(d) }
}

/**
 * Tahmini bitiş tarihini Türkçe okunur biçime çevirir.
 * Örn: "2026-12-03" → "3 Ara 2026"
 */
export const formatFinishDate = (key) => {
  const date = parseDateKey(key)
  if (!date) return key
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Vakit bazlı dağılım — seçili periyottaki toplamlar.
 * @returns {Array<{ id, name, kaza, bulk, toplam, yuzde }>}
 */
export const buildPrayerBreakdown = (history, period, bucketCount) => {
  const buckets = buildBuckets(history, period, bucketCount)
  const bucketKeys = buckets.map((b) => b.key)
  const days = sortedDays(history).filter((d) => {
    if (period === 'day') return bucketKeys.includes(d.date)
    if (period === 'week')
      return bucketKeys.some(
        (startKey) => d.date >= startKey && d.date <= shiftDays(startKey, -6)
      )
    return bucketKeys.some((key) => d.date.startsWith(key))
  })

  const rows = PRAYERS.map((prayer) => {
    const kaza = days.reduce((s, d) => s + (d.kaza?.[prayer.id] || 0), 0)
    const bulk = days.reduce((s, d) => s + (d.bulk?.[prayer.id] || 0), 0)
    return { id: prayer.id, name: prayer.name, kaza, bulk, toplam: kaza + bulk }
  })

  const grand = rows.reduce((s, r) => s + r.toplam, 0)
  return rows
    .map((r) => ({ ...r, yuzde: grand > 0 ? Math.round((r.toplam / grand) * 100) : 0 }))
    .sort((a, b) => b.toplam - a.toplam)
}

