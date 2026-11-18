/**
 * MERKEZİ DEPO KAYDI (Faz 2.5 — FR-VRI-01..03)
 *
 * Uygulamanın localStorage'da tuttuğu HER anahtar burada tanımlanır.
 * Yeni bir anahtar eklenirse:
 *   1. Buraya ekle (gerekirse BACKUP_FIELDS'e de),
 *   2. Şekli değişiyorsa CURRENT_SCHEMA_VERSION'ı artırıp
 *      src/utils/migrations.js'e bir adım yaz.
 * Anahtar adları ASLA değiştirilmez (mevcut kullanıcı verisi bu adlarda).
 */

// ── Borç verisi ────────────────────────────────────────────────
export const STORAGE_KEY = 'kaza-namazi-takip-v1' // kalan borç sayaçları
export const STORAGE_KEY_INITIAL_TOTAL = 'kaza-namazi-takip-baslangic-v1'
export const STORAGE_KEY_ONBOARDING = 'kaza-namazi-takip-onboarding-v1'
export const STORAGE_KEY_PROFILE = 'kaza-namazi-takip-profil-v1'
export const STORAGE_KEY_HISTORY = 'kaza-namazi-takip-gecmis-v1'

// ── Tercihler ──────────────────────────────────────────────────
export const STORAGE_KEY_LOCATION = 'kaza-namazi-takip-konum-v1'
export const STORAGE_KEY_PRAYER_OFFSETS = 'kaza-namazi-takip-vakit-sapma-v1'
export const STORAGE_KEY_REMINDERS = 'kaza-namazi-takip-bildirim-v1' // Faz 3

// ── Sistem ─────────────────────────────────────────────────────
export const STORAGE_KEY_SCHEMA = 'kaza-namazi-takip-sema'
export const STORAGE_KEY_LAST_BACKUP = 'kaza-namazi-takip-son-yedek-v1'
export const STORAGE_KEY_MIGRATION_SNAPSHOT = 'kaza-namazi-takip-migrasyon-oncesi'

/** Depolanan verinin şu anki şema sürümü. */
export const CURRENT_SCHEMA_VERSION = 1

/**
 * Yedek dosyasındaki alan adı → localStorage anahtarı.
 * Yedek biçimi anahtar adlarından bağımsızdır; böylece anahtarlar
 * ileride taşınsa bile eski yedekler okunabilir.
 */
export const BACKUP_FIELDS = {
  counts: STORAGE_KEY,
  initialTotal: STORAGE_KEY_INITIAL_TOTAL,
  onboardingDone: STORAGE_KEY_ONBOARDING,
  profile: STORAGE_KEY_PROFILE,
  history: STORAGE_KEY_HISTORY,
  location: STORAGE_KEY_LOCATION,
  offsets: STORAGE_KEY_PRAYER_OFFSETS,
  reminders: STORAGE_KEY_REMINDERS
}

/** Uygulama verisi sayılan tüm anahtarlar (sistem anahtarları hariç). */
export const APP_DATA_KEYS = Object.values(BACKUP_FIELDS)
