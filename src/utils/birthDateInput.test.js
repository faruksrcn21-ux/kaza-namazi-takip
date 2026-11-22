import { describe, expect, it } from 'vitest'
import { formatBirthDate, validateBirthDate, withBirthDate } from './birthDateInput'

const now = new Date(2026, 10, 22, 12)

describe('validateBirthDate', () => {
  it('geçerli tarih', () => {
    expect(validateBirthDate('1990-03-15', now)).toEqual({ ok: true, value: '1990-03-15' })
    expect(validateBirthDate('2026-11-22', now).ok).toBe(true) // bugün doğan
  })
  it('boş, bozuk, olmayan gün', () => {
    expect(validateBirthDate('', now).ok).toBe(false)
    expect(validateBirthDate('abc', now).ok).toBe(false)
    expect(validateBirthDate('1990-02-31', now).ok).toBe(false)
  })
  it('gelecek ve 120 yıldan eski reddedilir', () => {
    expect(validateBirthDate('2026-11-23', now).error).toContain('gelecekte')
    expect(validateBirthDate('1900-01-01', now).ok).toBe(false)
  })
})

describe('profil güncelleme', () => {
  it('yalnız doğum tarihi değişir, diğer alanlar korunur', () => {
    const p = { gender: 'female', pubertyAge: 9, birthDate: '' }
    expect(withBirthDate(p, '1990-03-15')).toEqual({ gender: 'female', pubertyAge: 9, birthDate: '1990-03-15' })
    expect(withBirthDate(null, '1990-03-15')).toEqual({ birthDate: '1990-03-15' })
  })
  it('biçim', () => {
    expect(formatBirthDate('1990-03-15')).toBe('15 Mart 1990')
    expect(formatBirthDate('')).toBe('')
  })
})
