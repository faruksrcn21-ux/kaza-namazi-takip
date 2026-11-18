import { describe, expect, it } from 'vitest'
import { buildIcs, escapeText, foldLine, icsDate, icsFileName } from './ics'

const ev = (id, iso, lead = 0, kind = 'vakit', name = 'Öğle') => ({
  key: `${id}@${iso.slice(0, 16)}`,
  id,
  name,
  kind,
  prayerTime: new Date(iso),
  at: new Date(new Date(iso).getTime() - lead * 60000),
  leadMinutes: lead
})
const unfold = (s) => s.replace(/\r\n /g, '')

describe('yardımcılar', () => {
  it('UTC tarih', () => expect(icsDate(new Date('2026-11-19T10:05:00.000Z'))).toBe('20261119T100500Z'))
  it('metin kaçışı', () => expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne'))
  it('dosya adı', () => expect(icsFileName(new Date(2026, 0, 5))).toBe('kaza-namazi-vakitleri-2026-01-05.ics'))
  it('75 bayttan uzun satır katlanır, Türkçe karakter bölünmez', () => {
    const line = 'DESCRIPTION:' + 'ğüşıöç'.repeat(20)
    const folded = foldLine(line)
    const parts = folded.split('\r\n')
    expect(parts.length).toBeGreaterThan(1)
    for (const p of parts) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75)
    expect(unfold(folded)).toBe(line)
    expect(folded).not.toContain('�')
  })
  it('kısa satır olduğu gibi kalır', () => expect(foldLine('VERSION:2.0')).toBe('VERSION:2.0'))
})

describe('buildIcs', () => {
  const now = new Date('2026-11-19T08:00:00Z')
  const ics = buildIcs(
    [ev('ogle', '2026-11-19T09:47:00Z'), ev('teheccud', '2026-11-19T23:30:00Z', 10, 'nafile', 'Teheccüd')],
    { now }
  )
  const lines = unfold(ics).split('\r\n')

  it('CRLF ve takvim çerçevesi', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n')
    expect(lines).toContain('VERSION:2.0')
  })
  it('her vakit bir etkinlik + alarm', () => {
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(2)
    expect(lines.filter((l) => l === 'BEGIN:VALARM')).toHaveLength(2)
    expect(lines).toContain('DTSTART:20261119T094700Z')
    expect(lines).toContain('DTEND:20261119T100200Z')
    expect(lines).toContain('SUMMARY:Öğle vakti')
    expect(lines).toContain('TRIGGER:PT0M')
  })
  it('önceden hatırlatma ve nafile başlığı', () => {
    expect(lines).toContain('TRIGGER:-PT10M')
    expect(lines).toContain('SUMMARY:Teheccüd vakti (nafile)')
  })
  it('UID benzersiz ve güvenli karakterli', () => {
    const uids = lines.filter((l) => l.startsWith('UID:'))
    expect(new Set(uids).size).toBe(2)
    for (const u of uids) expect(u).toMatch(/^UID:[A-Za-z0-9@-]+@kaza-namazi-takip$/)
  })
})
