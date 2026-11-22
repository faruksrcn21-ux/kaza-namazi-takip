import { parseLocalDate } from './hijriDate'

/**
 * Sonradan girilen doğum tarihi doğrulaması (K-36).
 * Kabul: geçerli "YYYY-MM-DD", gelecekte değil, en fazla 120 yıl önce.
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
export function validateBirthDate(input, now = new Date()) {
  const s = String(input || '').trim()
  if (!s) return { ok: false, error: 'Doğum tarihini seç.' }
  const d = parseLocalDate(s)
  // parseLocalDate 2026-02-31'i 3 Mart'a taşır; gün/ay birebir korunmalı
  const [y, m, day] = s.split('-').map(Number)
  if (!d || d.getFullYear() !== y || d.getMonth() !== m - 1 || d.getDate() !== day) {
    return { ok: false, error: 'Geçerli bir tarih gir.' }
  }
  const today = parseLocalDate(now)
  if (d > today) return { ok: false, error: 'Doğum tarihi gelecekte olamaz.' }
  const oldest = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate(), 12)
  if (d < oldest) return { ok: false, error: 'Tarihi kontrol et (120 yıldan eski).' }
  return { ok: true, value: s }
}

/** Profilde doğum tarihini günceller; diğer alanlara dokunmaz. */
export const withBirthDate = (profile, birthDate) => ({ ...(profile || {}), birthDate })

export const formatBirthDate = (s) => {
  const d = parseLocalDate(s)
  return d ? d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
}
