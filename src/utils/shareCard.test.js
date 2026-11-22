import { describe, expect, it } from 'vitest'
import { buildShareData } from './shareCard'
import { shiftDays, todayKey } from './history'

const now = new Date(2026, 10, 19, 12)
const T = todayKey(now)
const day = (key, sabah, ogle = 0) => ({ date: key, kaza: { sabah, ogle } })
const history = {
  [T]: day(T, 3, 1),
  [shiftDays(T, 1)]: day(shiftDays(T, 1), 2),
  [shiftDays(T, 10)]: day(shiftDays(T, 10), 5) // 7 gün dışında
}

describe('buildShareData', () => {
  it('yüzde, bugün, son 7 gün, kayıtlı gün', () => {
    const d = buildShareData({ history, totalRemaining: 750, initialTotal: 1000, now })
    expect(d.percent).toBe(25)
    expect(d.todayTotal).toBe(4)
    expect(d.weekTotal).toBe(6)
    expect(d.dayCount).toBe(3)
    expect(d.dateText).toContain('2026')
  })
  it('gizlilik: kalan borç varsayılan olarak YOK, yalnız istenirse', () => {
    expect(buildShareData({ history, totalRemaining: 750, initialTotal: 1000, now }).remaining).toBeNull()
    expect(buildShareData({ history, totalRemaining: 750, initialTotal: 1000, now, showRemaining: true }).remaining).toBe(750)
  })
  it('başlangıç yoksa %0, sınırlar korunur', () => {
    expect(buildShareData({ history: {}, totalRemaining: 0, initialTotal: 0, now }).percent).toBe(0)
    expect(buildShareData({ history: {}, totalRemaining: 1200, initialTotal: 1000, now }).percent).toBe(0)
    expect(buildShareData({ history: {}, totalRemaining: 0, initialTotal: 1000, now }).percent).toBe(100)
  })
})
