import { memo } from 'react'
import { Lock } from 'lucide-react'

/**
 * Dokunma alanı min 44x44px, saray estetiğinde şık butonlar.
 */
function QuickButton({ onClick, disabled, children, label, variant }) {
  const base =
    'flex items-center justify-center rounded-xl font-bold tabular-nums transition-all duration-150 active:scale-[0.92] disabled:opacity-20 disabled:active:scale-100 select-none'
  // K-16: −1/−5 = kaza KILINDI (borç azalır) → ana eylem, YEŞİL.
  //       +1/+5 = borç EKLE / düzelt → ikincil, sakin MOR.
  const styles =
    variant === 'pray'
      ? 'bg-gradient-to-b from-primary-500/25 to-primary-600/15 text-primary-200 hover:from-primary-500/35 hover:to-primary-600/25 border border-primary-400/35 shadow-sm shadow-primary-950/40'
      : 'bg-accent-500/[0.07] text-accent-300/90 hover:bg-accent-500/[0.14] border border-accent-400/15 hover:border-accent-400/30'

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
 * locked=true olduğunda butonlar devre dışı kalır.
 */
function PrayerCard({ prayer, count, onChange, index, locked = false, onLockHint, highlighted = false }) {
  const Icon = prayer.icon
  const atZero = count <= 0

  const handleChange = (delta) => {
    if (locked) return
    const next = Math.max(0, count + delta)
    onChange(prayer.id, next, delta)
  }

  return (
    <div
      id={`vakit-${prayer.id}`}
      data-highlighted={highlighted || undefined}
      className={`group relative rounded-2xl islamic-card p-4.5 border transition-all duration-200 hover:scale-[0.988] active:scale-[0.975] ${prayer.borderColor} ${
        highlighted ? 'ring-2 ring-primary-400/70 shadow-lg shadow-primary-900/40' : ''
      }`}
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent-500/15 border border-accent-500/30 text-accent-300">
                    Vacip
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">kaza borcu</p>
            </div>
          </div>

          {/* Kalan borç — vaktin rengiyle (gün boyu yeşilden mora) */}
          <div className="text-right">
            <span className={`text-3xl font-black tabular-nums leading-none tracking-tight ${count > 0 ? prayer.numberColor : 'text-zinc-600'}`}>
              {count.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Alt satır: Hızlı butonlar */}
        <div className="relative">
          {/* Kilit overlay — tıklanınca kilit butonuna yönlendirir */}
          {locked && (
            <button
              type="button"
              onClick={onLockHint}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface-950/60 backdrop-blur-[2px] cursor-pointer group/lockhint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
              aria-label={`${prayer.name} kilitli. Kilidi açmak için kilit butonuna git`}
            >
              <span className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-full bg-surface-900/70 border border-white/[0.06] transition-colors group-hover/lockhint:text-accent-300 group-hover/lockhint:border-accent-500/40 group-hover/lockhint:bg-accent-900/25">
                <Lock size={12} />
                <span>Kilitli</span>
                <span className="text-accent-400/80 font-semibold group-hover/lockhint:text-accent-300">
                  · kilidi aç
                </span>
              </span>
            </button>
          )}
          <div className={`grid grid-cols-4 gap-2 ${locked ? 'opacity-30 pointer-events-none' : ''}`}>
            <QuickButton
              variant="pray"
              disabled={atZero || locked}
              onClick={() => handleChange(-5)}
              label={`${prayer.name} kaza sayısını 5 azalt`}
            >
              −5
            </QuickButton>
            <QuickButton
              variant="pray"
              disabled={atZero || locked}
              onClick={() => handleChange(-1)}
              label={`${prayer.name} kaza sayısını 1 azalt`}
            >
              −1
            </QuickButton>
            <QuickButton
              variant="add"
              disabled={locked}
              onClick={() => handleChange(1)}
              label={`${prayer.name} kaza sayısını 1 artır`}
            >
              +1
            </QuickButton>
            <QuickButton
              variant="add"
              disabled={locked}
              onClick={() => handleChange(5)}
              label={`${prayer.name} kaza sayısını 5 artır`}
            >
              +5
            </QuickButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(PrayerCard)

