// tools/test-history.mjs'in Vitest'e taşınmış hâli (aynı senaryolar).
import { describe, expect, it } from 'vitest'
import {
  buildBuckets,
  buildPrayerBreakdown,
  comparePeriods,
  createEmptyDayRecord,
  estimateFinish,
  normalizeHistory,
  parseDateKey,
  PERIODS,
  shiftDays,
  startOfWeekKey,
  todayKey
} from './history'

const T = todayKey()
const Y = shiftDays(T, 1)
const zero = { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 }
const history = {
  [T]: {
    ...createEmptyDayRecord(T),
    kaza: { sabah: 3, ogle: 1, ikindi: 0, aksam: 2, yatsi: 0, vitir: 1 },
    bulk: { ...zero },
    toplamKaza: 7,
    toplamKalan: 120
  },
  [Y]: {
    ...createEmptyDayRecord(Y),
    kaza: { sabah: 5, ogle: 2, ikindi: 1, aksam: 3, yatsi: 1, vitir: 0 },
    bulk: { ...zero },
    toplamKaza: 12,
    toplamKalan: 130
  }
}

describe('tarih yardımcıları', () => {
  it('todayKey YYYY-MM-DD', () => expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/))
  it('geçersiz anahtar null', () => expect(parseDateKey('abc')).toBeNull())
  it('shiftDays', () => {
    expect(shiftDays('2026-10-19', 1)).toBe('2026-10-18')
    expect(shiftDays('2026-10-19', 7)).toBe('2026-10-12')
  })
})

describe('normalizeHistory', () => {
  it('eksik alanları tamamlar', () => {
    const n = normalizeHistory({ [T]: { kaza: { sabah: 2 } } })
    expect(Object.keys(n[T].kaza)).toHaveLength(6)
    expect(n[T].toplamKaza).toBe(2)
  })
  it('bozuk gün anahtarını atar', () => {
    expect(Object.keys(normalizeHistory({ bozuk: {} }))).toHaveLength(0)
  })
  it('dizi / null girdide boş döner', () => {
    expect(normalizeHistory([])).toEqual({})
    expect(normalizeHistory(null)).toEqual({})
  })
})

describe('buildBuckets', () => {
  it('günlük: 7 kova, en yeni sağda', () => {
    const d = buildBuckets(history, 'day', 7)
    expect(d).toHaveLength(7)
    expect(d[6].key).toBe(T)
    expect(d[6].kaza).toBe(7)
    expect(d[5].kaza).toBe(12)
    expect(d[0].kaza).toBe(0)
  })
  it('haftalık: Pazartesi başlangıç, toplam korunur', () => {
    const w = buildBuckets(history, 'week', 4)
    expect(w).toHaveLength(4)
    expect(w[3].key).toBe(startOfWeekKey(T))
    expect(w.reduce((s, x) => s + x.kaza, 0)).toBe(19)
  })
  it('aylık', () => {
    const m = buildBuckets(history, 'month', 3)
    expect(m).toHaveLength(3)
    // Bugün ayın 1'iyse dün önceki aydadır; toplam her durumda 19
    expect(m.reduce((s, x) => s + x.kaza, 0)).toBe(19)
  })
})

describe('özet hesapları', () => {
  it('vakit dağılımı', () => {
    const b = buildPrayerBreakdown(history, 'day', 7)
    expect(b.find((r) => r.id === 'sabah').toplam).toBe(8)
    expect(b.reduce((s, r) => s + r.toplam, 0)).toBe(19)
    const pct = b.reduce((s, r) => s + r.yuzde, 0)
    expect(pct).toBeGreaterThanOrEqual(99)
    expect(pct).toBeLessThanOrEqual(100)
  })
  it('karşılaştırma', () => {
    const c = comparePeriods(history, 'day', 7)
    expect(c.simdiki).toBe(19)
    expect(c.yon).toBe('up')
  })
  it('tahmini bitiş', () => {
    const e = estimateFinish(history, 120)
    expect(e).toBeTruthy()
    expect(e.gunlukHiz).toBeCloseTo(19 / 7)
    expect(estimateFinish({}, 120)).toBeNull()
    expect(estimateFinish(history, 0)).toBeNull()
  })
  it('periyot kova sayıları', () => {
    expect(PERIODS.day.bucketCount).toBe(7)
    expect(PERIODS.week.bucketCount).toBe(4)
    expect(PERIODS.month.bucketCount).toBe(6)
  })
})
