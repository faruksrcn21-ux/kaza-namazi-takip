import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEY_THEME } from '../constants/storage'

/**
 * TEMA (Faz 5 — FR-UX-05, K-32)
 * Tercih: 'system' (VARSAYILAN, K-33 — telefonun açık/koyu ayarını izler) | 'dark' | 'light'.
 * index.html'deki satır içi betik aynı kuralı React'ten ÖNCE uygular (açılışta
 * yanlış tema yanıp sönmez); bu hook sonraki değişiklikleri uygular.
 */
export const THEME_OPTIONS = ['dark', 'light', 'system']
export const THEME_COLORS = { dark: '#0f0e0c', light: '#f4efe4' } // theme.css --page-bg ile aynı

export const DEFAULT_THEME = 'system'
export const normalizeThemePref = (v) => (THEME_OPTIONS.includes(v) ? v : DEFAULT_THEME)

/** Tercih + sistem ayarı → uygulanacak tema. */
export const resolveTheme = (pref, systemPrefersLight) => {
  const p = normalizeThemePref(pref)
  if (p === 'system') return systemPrefersLight ? 'light' : 'dark'
  return p
}

const systemLight = () => !!window.matchMedia?.('(prefers-color-scheme: light)').matches

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[theme])
}

export function useTheme() {
  // Varsayılan cihaza YAZILMAZ; yalnız kullanıcı seçim yapınca kaydedilir. Böylece
  // varsayılan ileride değişirse seçim yapmamış herkese yansır (useLocalStorage
  // ilk açılışta varsayılanı da yazdığı için burada kullanılmıyor).
  const [pref, setPrefState] = useState(() => {
    try {
      return normalizeThemePref(JSON.parse(window.localStorage.getItem(STORAGE_KEY_THEME)))
    } catch {
      return DEFAULT_THEME
    }
  })
  const setPref = useCallback((value) => {
    const next = normalizeThemePref(value)
    setPrefState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(next))
    } catch {
      /* yalnız bu oturumda geçerli */
    }
  }, [])

  useEffect(() => {
    applyTheme(resolveTheme(pref, systemLight()))
    if (pref !== 'system' || !window.matchMedia) return undefined
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => applyTheme(resolveTheme('system', mq.matches))
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [pref])

  return [pref, setPref]
}
