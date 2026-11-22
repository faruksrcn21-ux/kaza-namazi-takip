import { Target } from 'lucide-react'
import { durationText, finishWithGoal, GOAL_OPTIONS } from '../utils/goal'
import { formatFinishDate } from '../utils/history'

const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Ayarlar → Günlük hedef (Faz 5 — FR-TAK-08, K-30).
 * Seçenek + "bu hedefle borç ne zaman biter" önizlemesi.
 */
export default function GoalSettings({ goal, onChange, totalRemaining }) {
  const finish = finishWithGoal(totalRemaining, goal)

  return (
    <section className="rounded-2xl islamic-card p-4 border border-white/[0.06]" data-testid="goal-settings">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15 border border-primary-500/25">
          <Target size={16} className="text-primary-300" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-zinc-100">Günlük hedef</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">Günde kaç vakit kaza kılmak istiyorsun?</p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Günlük hedef" className="grid grid-cols-7 gap-1 rounded-xl bg-surface-900/80 border border-white/[0.06] p-1">
        {GOAL_OPTIONS.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={goal === o}
            onClick={() => onChange(o)}
            className={`rounded-lg py-2 text-xs font-bold transition-all ${
              goal === o
                ? 'bg-accent-500/20 text-accent-100 border border-accent-400/35'
                : 'text-zinc-400 border border-transparent hover:text-zinc-200'
            }`}
          >
            {o === 0 ? 'Yok' : o}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-zinc-300 leading-relaxed" data-testid="goal-preview">
        {!goal
          ? 'Hedef kapalı. Bir hedef seçersen Bugün kartında ilerlemeni görürsün.'
          : finish
            ? `Her gün ${goal} vakit kılarsan kalan borcun ~${durationText(finish.days)} sonra, ${formatFinishDate(isoDay(finish.date))} civarında biter.`
            : 'Borç kalmadı — elhamdülillah.'}
      </p>
    </section>
  )
}
