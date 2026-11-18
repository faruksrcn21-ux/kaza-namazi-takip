import { MoonStar, Sunrise, Sun, CloudSun, Sunset, Moon, Star } from 'lucide-react'

const ROW_ICONS = {
  sabah: Sunrise,
  ogle: Sun,
  ikindi: CloudSun,
  aksam: Sunset,
  yatsi: Moon,
  vitir: Star,
  teheccud: MoonStar,
  kusluk: Sun,
  evvabin: Sunset
}

/**
 * Vakit listesi (Faz 2) — 5 vakit + vitir + nafile saatleri.
 * Konum yoksa uyarı kartı gösterir.
 */
export default function PrayerTimesCard({ data, hasLocation, offsets, onOffsetChange }) {
  if (!hasLocation) {
    return (
      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
        Vakitleri görmek için önce yukarıdan konum seç
      </p>
    )
  }

  if (!data) {
    return (
      <p className="text-[11px] text-rose-300 mt-0.5" role="alert">
        Vakitler hesaplanamadı — konumu kontrol edip tekrar dene
      </p>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <ul className="divide-y divide-white/[0.05]">
        {data.rows.map((row) => {
          const Icon = ROW_ICONS[row.id] || Sun
          return (
            <li key={row.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2.5">
                <Icon size={14} className="text-accent-300 flex-shrink-0" />
                <span className="flex-1 text-xs font-bold text-zinc-100">
                  {row.name}
                  {row.note && (
                    <span className="block text-[10px] font-medium text-zinc-500">{row.note}</span>
                  )}
                </span>
                <span className="text-xs font-mono font-bold text-zinc-100 tabular-nums">
                  {row.text}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 ml-[22px]">
                <span className="text-[10px] text-zinc-500">Sapma:</span>
                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={1}
                  value={offsets?.[row.id] ?? 0}
                  onChange={(e) => onOffsetChange?.(row.id, Number(e.target.value))}
                  aria-label={`${row.name} vakit sapması (dakika)`}
                  className="flex-1 h-1 accent-primary-400"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-10 text-right tabular-nums">
                  {(offsets?.[row.id] ?? 0) > 0 ? '+' : ''}
                  {offsets?.[row.id] ?? 0} dk
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <p className="text-[11px] font-bold text-zinc-300 mb-2">Nafile vakitleri</p>
        <ul className="space-y-1.5">
          {data.nafile.map((n) => {
            const Icon = ROW_ICONS[n.id] || Sparkles
            return (
              <li key={n.id} className="flex items-center gap-2.5">
                <Icon size={13} className="text-accent-300 flex-shrink-0" />
                <span className="flex-1 text-[11px] font-semibold text-zinc-200">
                  {n.name}
                  <span className="block text-[10px] font-medium text-zinc-500">{n.note}</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-zinc-100 tabular-nums">
                  {n.text}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
