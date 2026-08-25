import { useState, useEffect, useCallback } from 'react'

/**
 * localStorage ile senkronize bir state hook'u.
 * Depolanan veri bozuksa (geçersiz JSON, beklenmeyen şekil vb.)
 * sessizce başlangıç değerine döner; uygulama asla çökmez.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) return initialValue
      const parsed = JSON.parse(stored)
      return parsed ?? initialValue
    } catch (error) {
      console.warn(`localStorage okunamadı (${key}), başlangıç değeri kullanılıyor.`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`localStorage yazılamadı (${key}).`, error)
    }
  }, [key, value])

  const reset = useCallback(() => {
    setValue(initialValue)
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn(`localStorage silinemedi (${key}).`, error)
    }
  }, [key, initialValue])

  return [value, setValue, reset]
}
