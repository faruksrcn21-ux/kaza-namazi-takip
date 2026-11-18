import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEY_HISTORY } from '../constants/prayers'
import {
  createEmptyDayRecord,
  normalizeHistory,
  todayKey,
  totalOf
} from '../utils/history'

/**
 * Günlük kaza geçmişi yönetimi.
 *
 * Depolama anahtarı: kaza-namazi-takip-gecmis-v1
 * Yapı: { "YYYY-MM-DD": { kaza, bulk, kalan, kalanGunSonu, ... } }
 *
 * Not: Uygulamadaki `counts` KALAN BORCU tutar (sayaç azaltmak = namaz kılmak).
 * Bu yüzden geçmişe yazılan "kaza" miktarı, borçtan DÜŞÜLEN miktardır.
 */
export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_HISTORY)
      if (!stored) return {}
      return normalizeHistory(JSON.parse(stored))
    } catch (error) {
      console.warn('Geçmiş okunamadı, boş başlanıyor.', error)
      return {}
    }
  })

  // ── Kalıcı yazma ────────────────────────────────────────────────
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history))
    } catch (error) {
      console.warn('Geçmiş yazılamadı.', error)
    }
  }, [history])

  // ── Gece yarısı geçişinde gün sonu kapanışını yaz ───────────────
  const currentDayRef = useRef(todayKey())

  useEffect(() => {
    const check = () => {
      const now = todayKey()
      if (now !== currentDayRef.current) {
        // Kapanış: dünkü günün anlık kalan değerini gün sonu değerine yaz
        const prevDay = currentDayRef.current
        setHistory((prev) => {
          const rec = prev[prevDay]
          if (!rec) return prev
          return {
            ...prev,
            [prevDay]: {
              ...rec,
              kalanGunSonu: { ...rec.kalan },
              toplamKalanGunSonu: totalOf(rec.kalan)
            }
          }
        })
        currentDayRef.current = now
      }
    }

    const timer = setInterval(check, 60 * 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // ── Kayıt fonksiyonları ────────────────────────────────────────

  /**
   * Bir vakit için o günkü kayda miktar ekler.
   *
   * SEMANTİK: `counts` uygulamada KALAN BORCU tutar.
   *   delta < 0 → borç AZALDI  → namaz kılındı      → 'kaza' kovasına eklenir
   *   delta > 0 → borç ARTTI   → yeni borç yüklendi → 'bulk' kovasına eklenir
   *
   * @param {string} prayerId
   * @param {number} delta   - borç değişimi (negatif = kaza yapıldı)
   * @param {Object} counts  - güncel kalan borç sayaçları (anlık snapshot)
   */
  const recordChange = useCallback((prayerId, delta, counts) => {
    if (!delta) return
    const day = todayKey()
    const bucket = delta < 0 ? 'kaza' : 'bulk'
    const amount = Math.abs(delta)

    setHistory((prev) => {
      const rec = prev[day] || createEmptyDayRecord(day)
      const nextBucket = { ...rec[bucket] }
      nextBucket[prayerId] = Math.max(0, (nextBucket[prayerId] || 0) + amount)

      const next = {
        ...rec,
        [bucket]: nextBucket,
        toplamKaza: rec.toplamKaza + (bucket === 'kaza' ? amount : 0),
        toplamBulk: rec.toplamBulk + (bucket === 'bulk' ? amount : 0)
      }

      // Anlık kalan borç görüntüsü
      if (counts) {
        next.kalan = { ...counts }
        next.toplamKalan = totalOf(counts)
      }

      return { ...prev, [day]: next }
    })
  }, [])

  /**
   * Toplu borç yükleme — her vakit için miktarı 'bulk' kovasına yazar.
   * @param {Object} addition - { prayerId: miktar }
   * @param {Object} counts   - güncel kalan borç sayaçları
   */
  const recordBulk = useCallback((addition, counts) => {
    const day = todayKey()
    setHistory((prev) => {
      const rec = prev[day] || createEmptyDayRecord(day)
      const nextBulk = { ...rec.bulk }
      let sum = 0
      for (const [prayerId, amount] of Object.entries(addition || {})) {
        const value = Number(amount) || 0
        if (value <= 0) continue
        nextBulk[prayerId] = (nextBulk[prayerId] || 0) + value
        sum += value
      }
      const next = {
        ...rec,
        bulk: nextBulk,
        toplamBulk: rec.toplamBulk + sum
      }
      if (counts) {
        next.kalan = { ...counts }
        next.toplamKalan = totalOf(counts)
      }
      return { ...prev, [day]: next }
    })
  }, [])

  /**
   * Geri alma — bir vakit için o günkü kaydı tersine çevirir.
   * Orijinal işlemle AYNI kovadan düşer (işaret ters çevirme YOK —
   * recordChange işarete göre kova seçtiği için ters çevirme yanlış
   * kovaya yazardı).
   * @param {string} prayerId
   * @param {number} delta   - geri alınacak ORİJİNAL borç değişimi
   * @param {Object} counts  - güncel kalan borç sayaçları
   */
  const revertChange = useCallback((prayerId, delta, counts) => {
    if (!delta) return
    const day = todayKey()
    const bucket = delta < 0 ? 'kaza' : 'bulk'
    const amount = Math.abs(delta)

    setHistory((prev) => {
      const rec = prev[day]
      if (!rec) return prev
      const nextBucket = { ...rec[bucket] }
      nextBucket[prayerId] = Math.max(0, (nextBucket[prayerId] || 0) - amount)

      const next = {
        ...rec,
        [bucket]: nextBucket,
        toplamKaza: Math.max(0, rec.toplamKaza - (bucket === 'kaza' ? amount : 0)),
        toplamBulk: Math.max(0, rec.toplamBulk - (bucket === 'bulk' ? amount : 0))
      }

      if (counts) {
        next.kalan = { ...counts }
        next.toplamKalan = totalOf(counts)
      }

      return { ...prev, [day]: next }
    })
  }, [])

  /**
   * Geçmişi tamamen siler.
   */
  const resetHistory = useCallback(() => {
    setHistory({})
    try {
      window.localStorage.removeItem(STORAGE_KEY_HISTORY)
    } catch (error) {
      console.warn('Geçmiş silinemedi.', error)
    }
  }, [])

  return {
    history,
    recordChange,
    recordBulk,
    revertChange,
    resetHistory
  }
}
