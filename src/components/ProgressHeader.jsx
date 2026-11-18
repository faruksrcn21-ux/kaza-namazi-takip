import { PartyPopper, TrendingDown, Sparkles, HandHeart } from 'lucide-react'

export default function ProgressHeader({ totalRemaining, initialTotal }) {
  const hasStarted = initialTotal > 0
  const completed = hasStarted ? Math.max(0, initialTotal - totalRemaining) : 0
  const percent = hasStarted
    ? Math.min(100, Math.round((completed / initialTotal) * 100))
    : 0

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 pt-4 pb-3.5 bg-surface-950/85 backdrop-blur-xl border-b border-accent-500/15 safe-top transition-all">
      {/* İslami Mihrab Işıması */}
      <div className="absolute inset-x-0 top-0 h-full mihrab-glow pointer-events-none" />

      {totalRemaining === 0 && hasStarted ? (
        /* Tebrik durumu — tüm kaza borcu tamamlandı */
        <div className="relative flex items-center gap-3.5 rounded-2xl islamic-card-emerald p-4 border border-primary-500/30">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-500/20 border border-primary-400/30">
            <PartyPopper size={22} className="text-primary-300" />
          </div>
          <div>
            <p className="text-base font-extrabold text-brand-gradient">Elhamdülillah, Kaza Borcun Kalmadı!</p>
            <p className="text-xs text-primary-200/80 mt-0.5 font-serif italic flex items-center gap-1.5">
              "Dualarınız ve ibadetleriniz kabul olsun."
              <HandHeart size={13} className="text-accent-400" />
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Toplam kalan kaza ve yüzde */}
          <div className="flex items-end justify-between mb-2.5">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown size={13} className="text-accent-400/80" />
                <p className="text-[11px] uppercase tracking-wider text-accent-200/60 font-semibold">
                  Toplam Kalan Kaza Borcu
                </p>
              </div>
              <p className="text-4xl font-extrabold tabular-nums text-zinc-50 leading-none tracking-tight">
                {totalRemaining.toLocaleString('tr-TR')}
              </p>
            </div>
            {hasStarted && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Sparkles size={14} className="text-accent-400" />
                  <p className="text-2xl font-extrabold tabular-nums text-brand-gradient leading-none">
                    %{percent}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium mt-1">tamamlandı</p>
              </div>
            )}
          </div>

          {/* İslami Saray Çıtası Progress Bar */}
          {hasStarted && (
            <div className="h-3 w-full rounded-full bg-surface-900 border border-accent-500/15 overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-brand-gradient-x transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${percent}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Tamamlanma yüzdesi"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
