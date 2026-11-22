import { describe, expect, it } from 'vitest'
import { progressPercent } from './progress'

describe('progressPercent', () => {
  it('olağan durum', () => {
    expect(progressPercent(1000, 750)).toBe(25)
    expect(progressPercent(9000, 7260)).toBe(19) // 19,33
  })
  it('borç bitmeden %100 gösterilmez (eski Math.round hatası)', () => {
    expect(progressPercent(9000, 30)).toBe(99) // %99,67 → eskiden %100
    expect(progressPercent(9000, 1)).toBe(99)
  })
  it('borç bitince %100', () => {
    expect(progressPercent(9000, 0)).toBe(100)
  })
  it('aşağı yuvarlar: %0,9 → %0', () => {
    expect(progressPercent(1000, 991)).toBe(0)
  })
  it('başlangıç yok / kalan başlangıçtan fazla', () => {
    expect(progressPercent(0, 50)).toBe(0)
    expect(progressPercent(100, 120)).toBe(0)
  })
})
