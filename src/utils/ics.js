/**
 * TAKVİM DOSYASI (.ics) — Faz 3: FR-BLD-04
 *
 * Sunucusuz yedek yol: seçili vakitler alarmlı (VALARM) takvim etkinliği olur.
 * Telefonun takvimi alarmı devralır → uygulama kapalıyken de, iOS dahil çalışır.
 * RFC 5545: CRLF satır sonu, 75 bayttan uzun satırlar katlanır, metin kaçışları.
 */

const CRLF = '\r\n'

/** RFC 5545 TEXT kaçışı. */
export const escapeText = (s) =>
  String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

/** UTC tarih-saat: 20261119T103000Z */
export const icsDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const encoder = new TextEncoder()

/** 75 oktetten uzun satırı katlar (UTF-8 karakterlerini bölmeden). */
export function foldLine(line) {
  if (encoder.encode(line).length <= 75) return line
  const parts = []
  let current = ''
  let bytes = 0
  const limit = () => (parts.length === 0 ? 75 : 74) // devam satırları baştaki boşlukla başlar
  for (const ch of line) {
    const b = encoder.encode(ch).length
    if (bytes + b > limit()) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += b
  }
  parts.push(current)
  return parts.join(CRLF + ' ')
}

/**
 * @param {Array} events - buildReminderEvents() çıktısı
 * @param {object} [opts] - { now: Date, calendarName: string, description: (event) => string }
 * @returns {string} .ics içeriği
 */
export function buildIcs(events, opts = {}) {
  const now = opts.now || new Date()
  const calendarName = opts.calendarName || 'Kaza Namazı Vakitleri'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kaza Namazi Takip//Vakit Hatirlatma//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`
  ]
  for (const e of events) {
    const end = new Date(e.prayerTime.getTime() + 15 * 60 * 1000)
    const summary = e.kind === 'nafile' ? `${e.name} vakti (nafile)` : `${e.name} vakti`
    const desc = opts.description
      ? opts.description(e)
      : e.kind === 'nafile'
        ? 'Kaza kılmak için güzel bir vakit.'
        : `Vaktin farzından sonra bir ${e.name} kazası kılmaya ne dersin?`
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.key.replace(/[^A-Za-z0-9@-]/g, '')}@kaza-namazi-takip`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(e.prayerTime)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(desc)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `TRIGGER:${e.leadMinutes > 0 ? `-PT${e.leadMinutes}M` : 'PT0M'}`,
      `DESCRIPTION:${escapeText(summary)}`,
      'END:VALARM',
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join(CRLF) + CRLF
}

const pad = (n) => String(n).padStart(2, '0')
export const icsFileName = (now = new Date()) =>
  `kaza-namazi-vakitleri-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.ics`
