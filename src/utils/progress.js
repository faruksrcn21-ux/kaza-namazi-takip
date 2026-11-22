/**
 * TAMAMLANMA YÜZDESİ — uygulamadaki TEK hesap (üst çubuk + paylaşım kartı).
 *
 * yüzde = (başlangıç − kalan) / başlangıç
 * Aşağı yuvarlanır: borç bitmeden ASLA %100 gösterilmez
 * (eskiden Math.round, 9.000'den 30 kala "%100 tamamlandı" diyordu).
 */
export function progressPercent(initialTotal, totalRemaining) {
  const initial = Number(initialTotal) || 0
  const remaining = Math.max(0, Number(totalRemaining) || 0)
  if (initial <= 0) return 0
  if (remaining === 0) return 100
  const completed = Math.max(0, initial - remaining)
  return Math.min(99, Math.floor((completed / initial) * 100))
}
