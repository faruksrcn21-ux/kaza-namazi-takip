/**
 * VAKİT HATIRLATMALARI — saf mantık (Faz 3: FR-BLD-02, FR-BLD-03)
 *
 * Girdi: calculatePrayerTimes() çıktıları (bir veya birkaç gün) + kullanıcı ayarı.
 * Çıktı: zamanı belli hatırlatma olayları. Zamanlayıcı (useReminders) ve
 * takvim dosyası (ics.js) aynı olay listesini kullanır.
 */

export const REMINDER_TARGETS = [
  { id: 'sabah', name: 'Sabah', kind: 'vakit' },
  { id: 'ogle', name: 'Öğle', kind: 'vakit' },
  { id: 'ikindi', name: 'İkindi', kind: 'vakit' },
  { id: 'aksam', name: 'Akşam', kind: 'vakit' },
  { id: 'yatsi', name: 'Yatsı', kind: 'vakit' },
  { id: 'teheccud', name: 'Teheccüd', kind: 'nafile' },
  { id: 'kusluk', name: 'Kuşluk', kind: 'nafile' },
  { id: 'evvabin', name: 'Evvâbin', kind: 'nafile' }
]

export const LEAD_OPTIONS = [0, 5, 10, 15, 30]

export const DEFAULT_REMINDER_SETTINGS = {
  enabled: false,
  targets: {
    sabah: true,
    ogle: true,
    ikindi: true,
    aksam: true,
    yatsi: true,
    teheccud: false,
    kusluk: false,
    evvabin: false
  },
  leadMinutes: 0
}

/** Bozuk / eksik ayarı güvenli varsayılanlarla tamamlar. */
export function normalizeReminderSettings(raw) {
  const d = DEFAULT_REMINDER_SETTINGS
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...d, targets: { ...d.targets } }
  }
  const targets = {}
  for (const t of REMINDER_TARGETS) {
    const v = raw.targets?.[t.id]
    targets[t.id] = typeof v === 'boolean' ? v : d.targets[t.id]
  }
  return {
    enabled: raw.enabled === true,
    targets,
    leadMinutes: LEAD_OPTIONS.includes(raw.leadMinutes) ? raw.leadMinutes : d.leadMinutes
  }
}

const MIN = 60 * 1000
const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime())
const minuteKey = (d) => d.toISOString().slice(0, 16)

/**
 * Bir veya birkaç günün vakit verisinden hatırlatma olayları üretir.
 * Aynı vakit iki günün verisinde geçerse (ör. teheccüd) tek olaya indirgenir.
 * @param {Array<object|null>} days - calculatePrayerTimes() çıktıları
 * @param {object} settings - normalizeReminderSettings() biçiminde
 * @returns {Array<{key,id,name,kind,prayerTime:Date,at:Date,leadMinutes:number}>} zamana göre sıralı
 */
export function buildReminderEvents(days, settings) {
  const s = normalizeReminderSettings(settings)
  const lead = s.leadMinutes
  const byKey = new Map()
  for (const day of days || []) {
    if (!day) continue
    const all = [...(day.rows || []), ...(day.nafile || [])]
    for (const target of REMINDER_TARGETS) {
      if (!s.targets[target.id]) continue
      const row = all.find((r) => r.id === target.id)
      if (!row || !isValidDate(row.time)) continue
      const key = `${target.id}@${minuteKey(row.time)}`
      if (byKey.has(key)) continue
      byKey.set(key, {
        key,
        id: target.id,
        name: target.name,
        kind: target.kind,
        prayerTime: row.time,
        at: new Date(row.time.getTime() - lead * MIN),
        leadMinutes: lead
      })
    }
  }
  return [...byKey.values()].sort((a, b) => a.at - b.at)
}

/**
 * Son kontrolden (since) bu yana zamanı gelen olaylar.
 * Cihaz uzun süre uyuduysa yalnızca son `graceMs` içindekiler döner —
 * uygulama açıldığında eski hatırlatmalar yağmuru olmaz.
 */
export function dueEvents(events, since, now, graceMs = 10 * MIN) {
  const s = since instanceof Date ? since.getTime() : since
  const n = now instanceof Date ? now.getTime() : now
  return (events || []).filter((e) => {
    const t = e.at.getTime()
    return t > s && t <= n && n - t <= graceMs
  })
}

/** Şu andan sonraki ilk olay (yoksa null). */
export const nextEvent = (events, now) => {
  const n = now instanceof Date ? now.getTime() : now
  return (events || []).find((e) => e.at.getTime() > n) || null
}

export const formatClock = (date, timeZone = 'Europe/Istanbul') =>
  new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone }).format(date)

/**
 * Bildirim başlığı ve metni.
 * @param {object} event
 * @param {object} [ctx] - { remaining: o vaktin kalan kaza borcu }
 */
export function reminderText(event, ctx = {}) {
  const clock = formatClock(event.prayerTime)
  const early = event.leadMinutes > 0
  if (event.kind === 'nafile') {
    return {
      title: early ? `${event.name} vaktine ${event.leadMinutes} dk` : `${event.name} vakti`,
      body: `${clock} · Kaza kılmak için güzel bir vakit.`
    }
  }
  const title = early ? `${event.name} vaktine ${event.leadMinutes} dk kaldı` : `${event.name} vakti girdi`
  const remaining = Number.isFinite(ctx.remaining) && ctx.remaining > 0
    ? ` Kalan ${event.name} kazan: ${ctx.remaining.toLocaleString('tr-TR')}.`
    : ''
  const body = early
    ? `${clock}'de giriyor.${remaining}`
    : `${clock} · Vaktin farzından sonra bir ${event.name} kazası kılmaya ne dersin?${remaining}`
  return { title, body }
}
