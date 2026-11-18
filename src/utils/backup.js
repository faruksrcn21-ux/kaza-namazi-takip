import { PRAYERS } from '../constants/prayers'
import {
  BACKUP_FIELDS,
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY_LAST_BACKUP,
  STORAGE_KEY_SCHEMA
} from '../constants/storage'
import { normalizeHistory, sortedDays } from './history'
import { getStoredSchemaVersion, runMigrations } from './migrations'
import { normalizeReminderSettings } from './reminders'

/**
 * YEDEKLEME / GERİ YÜKLEME (Faz 2.5 — FR-VRI-01, FR-VRI-02, UC-03)
 *
 * Dosya biçimi (format 1):
 * {
 *   "app": "kaza-namazi-takip",
 *   "format": 1,
 *   "schemaVersion": 1,
 *   "exportedAt": "2026-11-19T10:00:00.000Z",
 *   "data": { counts, initialTotal, onboardingDone, profile, history, location, offsets, reminders }
 * }
 * Saf fonksiyonlar; depo parametre olarak verilir → test edilebilir.
 */
export const BACKUP_APP_ID = 'kaza-namazi-takip'
export const BACKUP_FORMAT = 1
const MAX_FILE_BYTES = 5 * 1024 * 1024

const PRAYER_IDS = PRAYERS.map((p) => p.id)
const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
const isNonNegNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0

const readJSON = (storage, key) => {
  const raw = storage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Depodaki tüm uygulama verisinden yedek nesnesi üretir. */
export function createBackup(storage, now = new Date()) {
  const data = {}
  for (const [field, key] of Object.entries(BACKUP_FIELDS)) {
    data[field] = readJSON(storage, key)
  }
  return {
    app: BACKUP_APP_ID,
    format: BACKUP_FORMAT,
    schemaVersion: getStoredSchemaVersion(storage) || CURRENT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data
  }
}

const pad = (n) => String(n).padStart(2, '0')
export const backupFileName = (now = new Date()) =>
  `kaza-namazi-yedek-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`

const fail = (error) => ({ ok: false, error })

/**
 * Dosya metnini doğrular ve normalize eder.
 * @returns {{ok: true, backup: object, summary: object} | {ok: false, error: string}}
 */
export function parseBackup(text) {
  if (typeof text !== 'string' || text.trim() === '') return fail('Dosya boş.')
  if (text.length > MAX_FILE_BYTES) return fail('Dosya çok büyük; bu bir yedek dosyası değil.')

  let obj
  try {
    obj = JSON.parse(text)
  } catch {
    return fail('Dosya okunamadı: geçerli bir yedek dosyası değil.')
  }

  if (!isPlainObject(obj) || obj.app !== BACKUP_APP_ID) {
    return fail('Bu dosya Kaza Namazı Takip yedeği değil.')
  }
  if (obj.format !== BACKUP_FORMAT) {
    return fail('Yedek biçimi tanınmıyor. Uygulamayı güncelleyip tekrar dene.')
  }
  const schemaVersion = Number(obj.schemaVersion)
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return fail('Yedekteki sürüm bilgisi bozuk.')
  }
  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    return fail('Bu yedek uygulamanın daha yeni bir sürümüyle alınmış. Önce uygulamayı güncelle.')
  }
  const d = obj.data
  if (!isPlainObject(d)) return fail('Yedekte veri bölümü yok.')

  // ── Sayaçlar (zorunlu) ──
  if (!isPlainObject(d.counts)) return fail('Yedekte kaza sayaçları yok.')
  const counts = {}
  for (const id of PRAYER_IDS) {
    const v = d.counts[id] ?? 0
    if (!isNonNegNumber(v)) return fail(`Yedekteki "${id}" sayacı geçersiz.`)
    counts[id] = Math.round(v)
  }

  // ── Diğer alanlar (isteğe bağlı) ──
  const initialTotal = d.initialTotal ?? 0
  if (!isNonNegNumber(initialTotal)) return fail('Yedekteki başlangıç toplamı geçersiz.')

  if (d.history != null && !isPlainObject(d.history)) return fail('Yedekteki geçmiş bozuk.')
  const history = normalizeHistory(d.history || {})

  if (d.profile != null && !isPlainObject(d.profile)) return fail('Yedekteki profil bozuk.')

  let location = null
  if (d.location != null) {
    const { lat, lon } = isPlainObject(d.location) ? d.location : {}
    if (!isPlainObject(d.location) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      return fail('Yedekteki konum bozuk.')
    }
    location = d.location
  }

  let offsets = null
  if (d.offsets != null) {
    if (!isPlainObject(d.offsets)) return fail('Yedekteki vakit ayarları bozuk.')
    offsets = {}
    for (const [k, v] of Object.entries(d.offsets)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return fail('Yedekteki vakit ayarları bozuk.')
      offsets[k] = v
    }
  }

  let reminders = null
  if (d.reminders != null) {
    if (!isPlainObject(d.reminders)) return fail('Yedekteki bildirim ayarları bozuk.')
    reminders = normalizeReminderSettings(d.reminders)
  }

  const backup = {
    app: BACKUP_APP_ID,
    format: BACKUP_FORMAT,
    schemaVersion,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : null,
    data: {
      counts,
      initialTotal,
      onboardingDone: true, // sayaç içeren yedek = kurulum tamamlanmış
      profile: d.profile ?? null,
      history,
      location,
      offsets,
      reminders
    }
  }

  return { ok: true, backup, summary: summarizeBackup(backup) }
}

/** Onay ekranında gösterilecek özet. */
export function summarizeBackup(backup) {
  const { counts, initialTotal, history, location } = backup.data
  const days = sortedDays(history)
  const totalPrayed = days.reduce((s, d) => s + (d.toplamKaza || 0), 0)
  return {
    totalRemaining: Object.values(counts).reduce((s, n) => s + n, 0),
    initialTotal,
    dayCount: days.length,
    firstDay: days.length ? days[0].date : null,
    lastDay: days.length ? days[days.length - 1].date : null,
    totalPrayed,
    exportedAt: backup.exportedAt,
    locationName: location
      ? location.city || (location.source === 'gps' ? 'GPS konumu' : 'Elle girilen koordinat')
      : null
  }
}

/**
 * Doğrulanmış yedeği depoya yazar. Mevcut uygulama verisinin YERİNE geçer.
 * Yazmadan sonra gerekiyorsa migrasyon çalışır (eski sürüm yedekleri için).
 * Çağıran taraf ardından sayfayı yeniden yüklemelidir.
 */
export function restoreBackup(storage, backup) {
  for (const [field, key] of Object.entries(BACKUP_FIELDS)) {
    const value = backup.data[field]
    if (value === null || value === undefined) storage.removeItem(key)
    else storage.setItem(key, JSON.stringify(value))
  }
  storage.setItem(STORAGE_KEY_SCHEMA, String(backup.schemaVersion))
  return runMigrations(storage)
}

/** Son yedek zamanını kaydeder / okur (ISO string). */
export const markBackupDone = (storage, now = new Date()) =>
  storage.setItem(STORAGE_KEY_LAST_BACKUP, JSON.stringify(now.toISOString()))

export const getLastBackupAt = (storage) => {
  const v = readJSON(storage, STORAGE_KEY_LAST_BACKUP)
  return typeof v === 'string' ? v : null
}
