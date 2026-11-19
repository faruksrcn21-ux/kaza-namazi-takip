import { describe, expect, it } from 'vitest'
import { birthdayCalendarEvents, pendingBirthdayGreeting, rememberSent } from './birthdayGreeting'
import { checkBirthdays, getHijriDate, isGregorianBirthdayOn, isHijriBirthdayOn, parseLocalDate } from './hijriDate'
import { buildIcs } from './ics'

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h)

describe('hijriDate düzeltmeleri', () => {
  it('YYYY-MM-DD yerel gün olarak okunur (UTC kayması yok)', () => {
    const d = parseLocalDate('1990-03-15')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([1990, 2, 15])
  })
  it('29 Şubat: artık yılda 29, diğer yıllarda 28 Şubat', () => {
    const b = parseLocalDate('2000-02-29')
    expect(isGregorianBirthdayOn(b, at(2028, 2, 29))).toBe(true)
    expect(isGregorianBirthdayOn(b, at(2027, 2, 28))).toBe(true)
    expect(isGregorianBirthdayOn(b, at(2028, 2, 28))).toBe(false)
  })
  it('Hicrî 30: ay 29 çekerse 29\'unda kutlanır', () => {
    const birth = { month: 9, day: 30 }
    // Sahte takvim: 9. ay 29 gün çekiyor; 29'undan sonraki gün 10. ayın 1'i
    const fake = (d) => {
      const n = d.getDate()
      return n === 2 ? { month: 10, day: 1 } : { month: 9, day: 29 }
    }
    expect(isHijriBirthdayOn(birth, new Date(2026, 0, 1, 12), fake)).toBe(true)
    // Ay 30 çekiyorsa 29'u değil 30'u kutlanır
    const fake30 = (d) => (d.getDate() === 2 ? { month: 9, day: 30 } : { month: 9, day: 29 })
    expect(isHijriBirthdayOn(birth, new Date(2026, 0, 1, 12), fake30)).toBe(false)
  })
  it('yaş: doğum günü bugünse yaş artmış sayılır', () => {
    expect(checkBirthdays('1990-11-19', at(2026, 11, 19)).gregorianAge).toBe(36)
    expect(checkBirthdays('1990-11-20', at(2026, 11, 19)).gregorianAge).toBe(35)
  })
})

describe('pendingBirthdayGreeting', () => {
  const birth = '1990-11-19'
  it('Miladî doğum gününde 09:00 sonrası tebrik', () => {
    const g = pendingBirthdayGreeting({ birthDate: birth, now: at(2026, 11, 19, 10) })
    expect(g.keys).toEqual(['miladi-2026'])
    expect(g.title).toBe('Miladî Doğum Gününüz Kutlu Olsun!')
    expect(g.body).toContain('36. yaşınız')
  })
  it('09:00 öncesi bekler', () => {
    expect(pendingBirthdayGreeting({ birthDate: birth, now: at(2026, 11, 19, 8) })).toBeNull()
  })
  it('aynı yıl ikinci kez gönderilmez', () => {
    const now = at(2026, 11, 19, 15)
    const g = pendingBirthdayGreeting({ birthDate: birth, now })
    const sent = rememberSent([], g.keys)
    expect(pendingBirthdayGreeting({ birthDate: birth, now, sent })).toBeNull()
    // ertesi yıl yeniden
    expect(pendingBirthdayGreeting({ birthDate: birth, now: at(2027, 11, 19, 10), sent }).keys).toEqual(['miladi-2027'])
  })
  it('doğum günü değilse null; doğum tarihi yoksa null', () => {
    expect(pendingBirthdayGreeting({ birthDate: birth, now: at(2026, 11, 18, 10) })).toBeNull()
    expect(pendingBirthdayGreeting({ birthDate: null, now: at(2026, 11, 19, 10) })).toBeNull()
  })
  it('Hicrî doğum günü (Ümmü\'l-Kurâ)', () => {
    // 1990-03-15'in hicrî karşılığının 2026'daki denk günü
    const birthH = getHijriDate(parseLocalDate('1990-03-15'))
    let day = null
    for (let i = 0; i < 400 && !day; i++) {
      const d = at(2026, 1, 1 + i)
      if (isHijriBirthdayOn(birthH, d)) day = d
    }
    expect(day).not.toBeNull()
    day.setHours(11)
    const g = pendingBirthdayGreeting({ birthDate: '1990-03-15', now: day })
    expect(g.keys.some((k) => k.startsWith('hicri-'))).toBe(true)
    expect(g.title).toContain('Hicrî')
  })
  it('rememberSent son 10 kaydı tutar, tekrar eklemez', () => {
    const many = Array.from({ length: 12 }, (_, i) => `miladi-${2000 + i}`)
    expect(rememberSent(many, ['miladi-2011'])).toHaveLength(10)
  })
})

describe('doğum günü takvimi', () => {
  const events = birthdayCalendarEvents('1990-03-15', at(2026, 11, 19), 10)
  it('10 yılda 10 Miladî + ~10 Hicrî tüm gün etkinlik', () => {
    const mil = events.filter((e) => e.key.startsWith('dogum-miladi'))
    const hic = events.filter((e) => e.key.startsWith('dogum-hicri'))
    expect(mil).toHaveLength(10)
    expect(hic.length).toBeGreaterThanOrEqual(10)
    expect(hic.length).toBeLessThanOrEqual(11) // hicrî yıl ~11 gün kısa
    expect(mil[0].summary).toBe('Miladî doğum günüm (37)')
    expect(mil[0].date.getMonth()).toBe(2)
  })
  it('ics: tüm gün + 09:00 alarm', () => {
    const ics = buildIcs(events.slice(0, 2), { now: at(2026, 11, 19), calendarName: 'Doğum Günlerim' })
    expect(ics).toMatch(/DTSTART;VALUE=DATE:\d{8}\r\n/)
    expect(ics).toMatch(/DTEND;VALUE=DATE:\d{8}\r\n/)
    expect(ics).toContain('TRIGGER:PT9H')
    expect(ics).toContain('X-WR-CALNAME:Doğum Günlerim')
  })
})
