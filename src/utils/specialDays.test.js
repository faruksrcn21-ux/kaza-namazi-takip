import { describe, expect, it } from 'vitest'
import { dativeSuffix, specialDayText, upcomingSpecialDays } from './specialDays'

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const find = (list, id) => list.find((x) => x.id === id)

describe('upcomingSpecialDays (Ümmü\'l-Kurâ)', () => {
  // 2026 için bilinen tarihler (Diyanet ile aynı olanlar)
  const list = upcomingSpecialDays(new Date(2026, 0, 1), 365)

  it('Ramazan Bayramı 2026: 20 Mart', () => expect(iso(find(list, 'ramazan-bayrami').date)).toBe('2026-03-20'))
  it('Kurban Bayramı 2026: 27 Mayıs, arife 26 Mayıs', () => {
    expect(iso(find(list, 'kurban-bayrami').date)).toBe('2026-05-27')
    expect(iso(find(list, 'arefe').date)).toBe('2026-05-26')
  })
  it('kandil = hicrî günden önceki akşam (Kadir: 26→27 Ramazan)', () => {
    const k = find(list, 'kadir')
    const ramazan = find(list, 'ramazan').date
    // 1 Ramazan'dan 25 gün sonrası = 26 Ramazan'ın miladî günü
    expect(Math.round((k.date - ramazan) / 86400000)).toBe(25)
  })
  it('Regaip: Perşembe akşamı, ertesi gün Recep\'in ilk Cuma\'sı', () => {
    const r = find(list, 'regaip')
    expect(r.date.getDay()).toBe(4)
  })
  it('sıralı ve daysLeft tutarlı', () => {
    for (let i = 1; i < list.length; i++) expect(list[i].date >= list[i - 1].date).toBe(true)
    expect(list.every((x) => x.daysLeft >= 0 && x.daysLeft <= 365)).toBe(true)
  })
  it('her özel gün bir yılda bir kez', () => {
    const ids = list.map((x) => x.id)
    expect(ids.filter((x) => x === 'kadir')).toHaveLength(1)
  })
})

describe('metin', () => {
  it('Türkçe yönelme eki', () => {
    expect(dativeSuffix('Berat Kandili')).toBe("'ne")
    expect(dativeSuffix('Ramazan Bayramı')).toBe("'na")
    expect(dativeSuffix('Ramazan')).toBe("'a")
    expect(dativeSuffix('Aşure Günü')).toBe("'ne")
    expect(dativeSuffix('Hicrî Yılbaşı')).toBe("'na")
    expect(dativeSuffix('Kadir Gecesi')).toBe("'ne")
  })
  it('bugün / bu gece / yarın / N gün', () => {
    expect(specialDayText({ name: 'Berat Kandili', kind: 'kandil', daysLeft: 0 })).toBe('Bu gece Berat Kandili')
    expect(specialDayText({ name: 'Kurban Bayramı', kind: 'gun', daysLeft: 0 })).toBe('Bugün Kurban Bayramı')
    expect(specialDayText({ name: 'Miraç Kandili', kind: 'kandil', daysLeft: 1 })).toBe('Yarın gece Miraç Kandili')
    expect(specialDayText({ name: 'Ramazan Bayramı', kind: 'gun', daysLeft: 12 })).toBe("Ramazan Bayramı'na 12 gün")
  })
})
