import { describe, expect, it } from 'vitest'
import { normalizeThemePref, resolveTheme } from './useTheme'

describe('tema', () => {
  it('varsayılan sistem (K-33), geçersiz tercih sisteme döner', () => {
    expect(normalizeThemePref(undefined)).toBe('system')
    expect(normalizeThemePref('mavi')).toBe('system')
    expect(normalizeThemePref('dark')).toBe('dark')
    expect(normalizeThemePref('light')).toBe('light')
  })
  it('sistem tercihi telefonu izler', () => {
    expect(resolveTheme('system', true)).toBe('light')
    expect(resolveTheme('system', false)).toBe('dark')
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('dark', true)).toBe('dark')
  })
})
