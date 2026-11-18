import {
  APP_DATA_KEYS,
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY_MIGRATION_SNAPSHOT,
  STORAGE_KEY_SCHEMA
} from '../constants/storage'

/**
 * ŞEMA MİGRASYONU (Faz 2.5 — FR-VRI-03, NFR-01)
 *
 * Uygulama açılırken (React çizmeden önce) bir kez çalışır.
 *
 * Kurallar:
 *  - Sürüm anahtarı yoksa ve eski veri varsa → "sürümsüz v1" kabul edilir.
 *  - Sürüm anahtarı yoksa ve veri yoksa      → yeni kurulum, güncel sürüm yazılır.
 *  - Depodaki sürüm uygulamadan YENİYSE      → hiçbir şeye dokunulmaz.
 *  - Eskiyse: adımlar ham değerlerin bir KOPYASI üzerinde sırayla çalışır.
 *    Hepsi başarılı olursa önce anlık görüntü alınır, sonra yazılır.
 *    Herhangi bir adım hata verirse gerçek depoya HİÇBİR şey yazılmaz.
 *
 * Yeni adım eklemek:
 *   MIGRATIONS[2] = (data) => { ...data nesnesini (anahtar → ham string|null)
 *                               yerinde değiştir... }
 *   ve CURRENT_SCHEMA_VERSION = 2 yap.
 */
export const MIGRATIONS = {
  // 2: (data) => { ... }
}

const readVersion = (storage) => {
  const raw = storage.getItem(STORAGE_KEY_SCHEMA)
  if (raw === null) return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

const hasAnyData = (storage, keys) => keys.some((k) => storage.getItem(k) !== null)

/**
 * @param {Storage} storage - localStorage (testlerde bellek içi taklit)
 * @param {object} [opts]
 * @param {object} [opts.migrations] - test için adım listesi
 * @param {number} [opts.target]     - test için hedef sürüm
 * @returns {{status: 'fresh'|'current'|'migrated'|'newer'|'failed', from: number|null, to: number, error?: string}}
 */
export function runMigrations(storage, opts = {}) {
  const migrations = opts.migrations || MIGRATIONS
  const target = opts.target || CURRENT_SCHEMA_VERSION
  const keys = APP_DATA_KEYS

  let from = readVersion(storage)

  if (from === null) {
    if (!hasAnyData(storage, keys)) {
      storage.setItem(STORAGE_KEY_SCHEMA, String(target))
      return { status: 'fresh', from: null, to: target }
    }
    from = 1 // Sürüm anahtarından önceki (canlıdaki v1) veri
  }

  if (from > target) {
    return { status: 'newer', from, to: target }
  }

  if (from === target) {
    if (storage.getItem(STORAGE_KEY_SCHEMA) === null) {
      storage.setItem(STORAGE_KEY_SCHEMA, String(target))
    }
    return { status: 'current', from, to: target }
  }

  // ── Kopya üzerinde çalış ──
  const original = {}
  for (const k of keys) original[k] = storage.getItem(k)
  const working = { ...original }

  try {
    for (let v = from + 1; v <= target; v++) {
      const step = migrations[v]
      if (typeof step !== 'function') {
        throw new Error(`v${v} için migrasyon adımı tanımlı değil`)
      }
      step(working)
    }
  } catch (error) {
    return { status: 'failed', from, to: target, error: String(error?.message || error) }
  }

  // ── Önce geri dönüş için anlık görüntü, sonra yaz ──
  try {
    storage.setItem(
      STORAGE_KEY_MIGRATION_SNAPSHOT,
      JSON.stringify({ version: from, at: new Date().toISOString(), data: original })
    )
    for (const k of keys) {
      if (working[k] === original[k]) continue
      if (working[k] === null || working[k] === undefined) storage.removeItem(k)
      else storage.setItem(k, working[k])
    }
    storage.setItem(STORAGE_KEY_SCHEMA, String(target))
  } catch (error) {
    // Yazma yarıda kaldıysa anlık görüntüden geri dön
    for (const k of keys) {
      try {
        if (original[k] === null) storage.removeItem(k)
        else storage.setItem(k, original[k])
      } catch {
        /* en iyi çaba */
      }
    }
    return { status: 'failed', from, to: target, error: String(error?.message || error) }
  }

  return { status: 'migrated', from, to: target }
}

/** Depodaki şema sürümünü döner (yoksa null). */
export const getStoredSchemaVersion = (storage) => readVersion(storage)
