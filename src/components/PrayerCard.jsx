import { memo } from 'react'

/**
 * Dokunma alanı min 44x44px, saray estetiğinde şık butonlar.
 */
function QuickButton({ onClick, disabled, children, label, variant }) {
  const base =
    'flex items-center justify-center rounded-xl font-bold tabular-nums transition-all duration-150 active:scale-[0.92] disabled:opacity-20 disabled:active:scale-100 select-none'
  const styles =
    variant === 'add'
      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 shadow-sm'
      : 'bg-surface-800/90 text-zinc-300 hover:bg-surface-750 border border-white/[0.06] hover:border-white/[0.12]'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${base} ${styles} h-11 min-w-[44px] px-3 text-sm`}
    >
      {children}
    </button>
  )
}

/**
 * Tek vakit kaza kartı — İslami saray çinileri ve kadife renk teması.
 */
function PrayerCard({ prayer, count, onChange, index }) {
  const Icon = prayer.icon
  const atZero = count <= 0

  const handleChange = (delta) => {
    const next = Math.max(0, count + delta)
    onChange(prayer.id, next)
  }

  return (
    <div
      className={`group relative rounded-2xl islamic-card p-4.5 border transition-all duration-200 hover:scale-[0.988] active:scale-[0.975] ${prayer.borderColor}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative">
        {/* Üst satır: İkon + Vakit Adı + Sayaç */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            {/* Vakit ikonu — saray kadife gradyanında */}
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${prayer.accentFrom} ${prayer.accentTo} border ${prayer.borderColor} shadow-inner`}>
              <Icon size={20} strokeWidth={2} className={prayer.iconColor} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-zinc-100 text-base tracking-tight">{prayer.name}</span>
                {prayer.isVitir && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    Vacip
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">kaza borcu</p>
            </div>
          </div>

          {/* Sayı — Büyük, Altın/Yeşil Vurgulu */}
          <div className="text-right">
            <span className={`text-3xl font-black tabular-nums leading-none tracking-tight ${count > 0 ? (prayer.isVitir ? 'text-gold-gradient' : 'text-emerald-300') : 'text-zinc-600'}`}>
              {count.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Alt satır: Hızlı butonlar */}
        <div className="grid grid-cols-4 gap-2">
          <QuickButton
            variant="subtract"
            disabled={atZero}
            onClick={() => handleChange(-5)}
            label={`${prayer.name} kaza sayısını 5 azalt`}
          >
            −5
          </QuickButton>
          <QuickButton
            variant="subtract"
            disabled={atZero}
            onClick={() => handleChange(-1)}
            label={`${prayer.name} kaza sayısını 1 azalt`}
          >
            −1
          </QuickButton>
          <QuickButton
            variant="add"
            onClick={() => handleChange(1)}
            label={`${prayer.name} kaza sayısını 1 artır`}
          >
            +1
          </QuickButton>
          <QuickButton
            variant="add"
            onClick={() => handleChange(5)}
            label={`${prayer.name} kaza sayısını 5 artır`}
          >
            +5
          </QuickButton>
        </div>
      </div>
    </div>
  )
}

export default memo(PrayerCard)
