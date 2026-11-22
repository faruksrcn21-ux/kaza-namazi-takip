import { describe, expect, it } from 'vitest'
import { durationText, finishWithGoal, goalProgress, normalizeGoal } from './goal'

describe('günlük hedef', () => {
  it('normalize: geçersiz → 0 (kapalı)', () => {
    for (const v of [-1, 1.5, 'x', null, 101]) expect(normalizeGoal(v)).toBe(0)
    expect(normalizeGoal(6)).toBe(6)
    expect(normalizeGoal('10')).toBe(10)
  })
  it('ilerleme', () => {
    expect(goalProgress(4, 0)).toBeNull()
    expect(goalProgress(4, 6)).toMatchObject({ done: 4, goal: 6, reached: false, left: 2 })
    expect(goalProgress(4, 6).ratio).toBeCloseTo(4 / 6)
    expect(goalProgress(9, 6)).toMatchObject({ reached: true, left: 0, ratio: 1 })
  })
  it('hedefle bitiş: bugün dahil gün sayısı', () => {
    const from = new Date(2026, 10, 19, 10)
    const f = finishWithGoal(12, 6, from)
    expect(f.days).toBe(2)
    expect(f.date.getDate()).toBe(20) // bugün 6 + yarın 6
    expect(finishWithGoal(13, 6, from).days).toBe(3)
    expect(finishWithGoal(0, 6, from)).toBeNull()
    expect(finishWithGoal(100, 0, from)).toBeNull()
  })
  it('süre metni', () => {
    expect(durationText(10)).toBe('10 gün')
    expect(durationText(120)).toBe('4 ay')
    expect(durationText(365)).toBe('1 yıl')
    expect(durationText(1210)).toBe('3 yıl 4 ay')
  })
})
