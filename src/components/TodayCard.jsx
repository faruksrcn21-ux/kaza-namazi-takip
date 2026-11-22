import { useMemo } from 'react'
import { CalendarHeart, CheckCircle2, Lightbulb, MoonStar } from 'lucide-react'
import { PRAYERS } from '../constants/prayers'
import { getHijriDate } from '../utils/hijriDate'
import { specialDayText, upcomingSpecialDays } from '../utils/specialDays'
import { goalProgress } from '../utils/goal'

const SPECIAL_HORIZON = 45 // gün — daha uzaktaki özel günler gösterilmez

/** En çok borcu kalan vakit (eşitlikte gün içindeki sıra). Hepsi 0 ise null. */
export function suggestPrayer(counts) {
  let best = null
  for (const p of PRAYERS) {
    const n = counts?.[p.id] || 0
    if (n > 0 && (!best || n > best.remaining)) best = { id: p.id, name: p.name, remaining: n }
  }
  return best
}

/**
 * Takip ekranı "Bugün" kartı (Faz 5 — FR-TAK-07, FR-UX-04):
 * hicrî tarih · bugün kılınan · bugünün önerisi · yaklaşan mübarek gün/gece.
 */
export default function TodayCard({ todayTotal, counts, onSuggest, goal = 0, now = new Date() }) {
  const progress = goalProgress(todayTotal, goal)
  const dayKey = now.toDateString()
  const hijri = useMemo(() => getHijriDate(now), [dayKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const special = useMemo(
    () => upcomingSpecialDays(now, SPECIAL_HORIZON)[0] || null,
    [dayKey] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const suggestion = suggestPrayer(counts)

  return (
    <section
      aria-label="Bugün"
      data-testid="today-card"
      className="mb-5 rounded-2xl islamic-card p-4 border border-accent-500/15"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent-200">Bugün</p>
        {hijri && <p className="text-[11px] font-semibold text-zinc-300">{hijri.formatted}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-primary-500/[0.08] border border-primary-500/20 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-200">
            <CheckCircle2 size={13} aria-hidden="true" />
            Kılınan
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-primary-100 leading-none">
            <span data-testid="today-total">{todayTotal.toLocaleString('tr-TR')}</span>
            {progress && <span className="text-sm font-bold text-primary-200/90"> / {progress.goal}</span>}
          </p>
          {progress && (
            <div
              className="mt-2 h-1.5 rounded-full bg-white/[0.08] overflow-hidden"
              role="progressbar"
              aria-label="Günlük hedef"
              aria-valuemin={0}
              aria-valuemax={progress.goal}
              aria-valuenow={Math.min(progress.done, progress.goal)}
            >
              <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all" style={{ width: `${progress.ratio * 100}%` }} />
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-zinc-300" data-testid="today-goal-text">
            {progress?.reached
              ? 'Hedef tamam · Allah kabul etsin'
              : progress
                ? `Hedefe ${progress.left} kaldı`
                : todayTotal > 0
                  ? 'Allah kabul etsin'
                  : 'Henüz kayıt yok'}
          </p>
        </div>

        {suggestion ? (
          <button
            type="button"
            onClick={() => onSuggest?.(suggestion.id)}
            className="text-left rounded-xl bg-accent-500/[0.08] border border-accent-400/20 px-3 py-2.5 hover:bg-accent-500/[0.14] active:scale-[0.98] transition-all"
            aria-label={`Bugünün önerisi: ${suggestion.name}. ${suggestion.remaining} kaza kaldı. Karta git`}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-200">
              <Lightbulb size={13} aria-hidden="true" />
              Önerilen
            </p>
            <p className="mt-1 text-lg font-black text-accent-100 leading-none">{suggestion.name}</p>
            <p className="mt-1.5 text-[11px] text-zinc-300 tabular-nums">
              {suggestion.remaining.toLocaleString('tr-TR')} kaldı · en çok borç
            </p>
          </button>
        ) : (
          <div className="rounded-xl bg-accent-500/[0.08] border border-accent-400/20 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-200">
              <Lightbulb size={13} aria-hidden="true" />
              Önerilen
            </p>
            <p className="mt-1 text-sm font-bold text-zinc-200">Borç kalmadı</p>
          </div>
        )}
      </div>

      {special && (
        <p
          className="mt-3 flex items-center gap-2 rounded-xl bg-surface-900/60 border border-white/[0.06] px-3 py-2 text-xs text-zinc-200"
          data-testid="special-day"
        >
          {special.kind === 'kandil' ? (
            <MoonStar size={14} className="shrink-0 text-accent-300" aria-hidden="true" />
          ) : (
            <CalendarHeart size={14} className="shrink-0 text-accent-300" aria-hidden="true" />
          )}
          <span className="font-semibold">{specialDayText(special)}</span>
          <span className="ml-auto text-[10px] text-zinc-400" title="Ümmü'l-Kurâ takvimi; Diyanet takviminden 1 gün sapabilir">
            ±1 gün
          </span>
        </p>
      )}
    </section>
  )
}
