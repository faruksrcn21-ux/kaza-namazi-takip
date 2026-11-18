import { describe, expect, it } from 'vitest'
import {
  buildReminderEvents,
  DEFAULT_REMINDER_SETTINGS,
  dueEvents,
  nextEvent,
  normalizeReminderSettings,
  reminderText
} from './reminders'
import { calculatePrayerTimes } from './prayerTimes'
import { daysAround, upcomingEvents } from '../hooks/useReminders'

const KONYA = { lat: 37.87, lon: 32.48 }
const at = (iso) => new Date(iso)
// Sentetik gün: saatler UTC; testler saat dilimine bağlı değil
const day = (date) => ({
  rows: [
    { id: 'sabah', time: at(`${date}T03:00:00Z`) },
    { id: 'ogle', time: at(`${date}T10:00:00Z`) },
    { id: 'ikindi', time: at(`${date}T12:30:00Z`) },
    { id: 'aksam', time: at(`${date}T15:00:00Z`) },
    { id: 'yatsi', time: at(`${date}T16:30:00Z`) },
    { id: 'vitir', time: at(`${date}T17:00:00Z`) }
  ],
  nafile: [
    { id: 'teheccud', time: at(`${date}T23:30:00Z`) },
    { id: 'kusluk', time: at(`${date}T05:20:00Z`) },
    { id: 'evvabin', time: at(`${date}T15:20:00Z`) }
  ]
})
const settings = (patch = {}) => normalizeReminderSettings({ ...DEFAULT_REMINDER_SETTINGS, enabled: true, ...patch })

describe('normalizeReminderSettings', () => {
  it('bozuk girdide varsayılan, kapalı', () => {
    for (const raw of [null, 'x', [], 5]) {
      const s = normalizeReminderSettings(raw)
      expect(s.enabled).toBe(false)
      expect(s.targets.sabah).toBe(true)
      expect(s.targets.teheccud).toBe(false)
    }
  })
  it('geçersiz dakika varsayılana döner, bilinmeyen alan atılır', () => {
    const s = normalizeReminderSettings({ enabled: true, leadMinutes: 7, targets: { sabah: false, hack: true } })
    expect(s.leadMinutes).toBe(0)
    expect(s.targets.sabah).toBe(false)
    expect(s.targets).not.toHaveProperty('hack')
  })
})

describe('buildReminderEvents', () => {
  it('varsayılan: yalnız 5 farz vakit, vitir ve nafile yok', () => {
    const ev = buildReminderEvents([day('2026-11-19')], settings())
    expect(ev.map((e) => e.id)).toEqual(['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'])
  })
  it('seçim ve "X dk önce" uygulanır, sıralıdır', () => {
    const ev = buildReminderEvents(
      [day('2026-11-19')],
      settings({ leadMinutes: 10, targets: { ...DEFAULT_REMINDER_SETTINGS.targets, ogle: false, teheccud: true } })
    )
    expect(ev.map((e) => e.id)).toEqual(['sabah', 'ikindi', 'aksam', 'yatsi', 'teheccud'])
    expect(ev[0].at.toISOString()).toBe('2026-11-19T02:50:00.000Z')
    expect(ev[0].prayerTime.toISOString()).toBe('2026-11-19T03:00:00.000Z')
  })
  it('aynı vakit iki günde geçerse tek olay', () => {
    const d = day('2026-11-19')
    expect(buildReminderEvents([d, d], settings())).toHaveLength(5)
  })
  it('null gün ve geçersiz tarih atlanır', () => {
    const d = day('2026-11-19')
    d.rows[0].time = new Date('x')
    expect(buildReminderEvents([null, d], settings()).map((e) => e.id)).not.toContain('sabah')
  })
})

describe('dueEvents', () => {
  const ev = buildReminderEvents([day('2026-11-19')], settings())
  it('son kontrolden bu yana gelenler', () => {
    const due = dueEvents(ev, at('2026-11-19T09:59:40Z'), at('2026-11-19T10:00:05Z'))
    expect(due.map((e) => e.id)).toEqual(['ogle'])
  })
  it('sınırda: tam anı dahil, son kontrol anı hariç (çift bildirim yok)', () => {
    expect(dueEvents(ev, at('2026-11-19T09:59:00Z'), at('2026-11-19T10:00:00Z'))).toHaveLength(1)
    expect(dueEvents(ev, at('2026-11-19T10:00:00Z'), at('2026-11-19T10:00:20Z'))).toHaveLength(0)
  })
  it('uzun uykudan dönüş: yalnız son 10 dk', () => {
    const due = dueEvents(ev, at('2026-11-19T00:00:00Z'), at('2026-11-19T12:35:00Z'))
    expect(due.map((e) => e.id)).toEqual(['ikindi'])
  })
  it('nextEvent', () => {
    expect(nextEvent(ev, at('2026-11-19T10:00:00Z')).id).toBe('ikindi')
    expect(nextEvent(ev, at('2026-11-20T00:00:00Z'))).toBeNull()
  })
})

describe('reminderText', () => {
  const [sabah] = buildReminderEvents([day('2026-11-19')], settings())
  it('vaktinde: kalan borç ile', () => {
    const t = reminderText(sabah, { remaining: 1240 })
    expect(t.title).toBe('Sabah vakti girdi')
    expect(t.body).toContain('Kalan Sabah kazan: 1.240')
  })
  it('önceden', () => {
    const [e] = buildReminderEvents([day('2026-11-19')], settings({ leadMinutes: 15 }))
    expect(reminderText(e).title).toBe('Sabah vaktine 15 dk kaldı')
  })
  it('nafile', () => {
    const ev = buildReminderEvents(
      [day('2026-11-19')],
      settings({ targets: { ...DEFAULT_REMINDER_SETTINGS.targets, kusluk: true } })
    )
    const k = ev.find((e) => e.id === 'kusluk')
    expect(reminderText(k).title).toBe('Kuşluk vakti')
    expect(reminderText(k).body).toContain('Kaza kılmak için güzel bir vakit')
  })
})

describe('gerçek vakitlerle (adhan, Konya)', () => {
  const now = new Date('2026-11-19T09:00:00Z') // 12:00 TSİ
  it('dün+bugün+yarın hesaplanır, sıradaki vakit öğle sonrası', () => {
    expect(daysAround(KONYA, {}, now)).toHaveLength(3)
    const up = upcomingEvents(KONYA, {}, settings(), now)
    expect(up[0].id).toBe('ogle')
    expect(up.every((e) => e.at > now)).toBe(true)
  })
  it('teheccüd: bu gecenin son üçte biri, bugünün akşamından sonra', () => {
    const s = settings({ targets: { ...DEFAULT_REMINDER_SETTINGS.targets, teheccud: true } })
    const t = upcomingEvents(KONYA, {}, s, now).find((e) => e.id === 'teheccud')
    const today = calculatePrayerTimes(KONYA, now, {})
    const aksam = today.rows.find((r) => r.id === 'aksam').time
    expect(t.prayerTime > aksam).toBe(true)
    expect(t.prayerTime - aksam).toBeLessThan(14 * 3600 * 1000)
  })
  it('sapma ayarı hatırlatma zamanına yansır', () => {
    const a = upcomingEvents(KONYA, {}, settings(), now)[0]
    const b = upcomingEvents(KONYA, { ogle: 5 }, settings(), now)[0]
    expect(b.at - a.at).toBe(5 * 60 * 1000)
  })
  it('konum yoksa olay yok', () => {
    expect(upcomingEvents(null, {}, settings(), now)).toEqual([])
  })
})
