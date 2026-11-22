/**
 * GÜNLÜK HEDEF (Faz 5 — FR-TAK-08, K-30)
 * Hedef = günde kılınacak kaza vakti sayısı. 0 = kapalı.
 * Seri/rozet YOK (K-08): hedef yalnızca günlük yön gösterir.
 */
export const GOAL_OPTIONS = [0, 3, 5, 6, 10, 15, 20]
export const MAX_GOAL = 100

export const normalizeGoal = (v) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= MAX_GOAL ? n : 0
}

/** Bugünkü ilerleme. goal 0 ise null. */
export function goalProgress(done, goal) {
  const g = normalizeGoal(goal)
  if (!g) return null
  const d = Math.max(0, Number(done) || 0)
  return { done: d, goal: g, ratio: Math.min(1, d / g), reached: d >= g, left: Math.max(0, g - d) }
}

/**
 * Her gün hedef kadar kılınırsa borç ne zaman biter?
 * @returns {{days: number, date: Date} | null}
 */
export function finishWithGoal(totalRemaining, goal, from = new Date()) {
  const g = normalizeGoal(goal)
  const r = Math.max(0, Number(totalRemaining) || 0)
  if (!g || !r) return null
  const days = Math.ceil(r / g)
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days - 1, 12)
  return { days, date }
}

/** "3 yıl 2 ay" gibi kaba süre metni. */
export function durationText(days) {
  if (!Number.isFinite(days) || days <= 0) return ''
  if (days < 45) return `${days} gün`
  const months = Math.round(days / 30.44)
  if (months < 12) return `${months} ay`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m ? `${y} yıl ${m} ay` : `${y} yıl`
}
