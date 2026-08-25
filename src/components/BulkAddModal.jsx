import { useState, useMemo } from 'react'
import { X, Calculator, Minus, Plus, User, UserRound, CalendarDays } from 'lucide-react'
import { PRAYERS } from '../constants/prayers'
import { calculateTotalDays, calculateWithGender, buildBulkAddition } from '../utils/prayerCalculations'

function NumberField({ label, value, onChange, min = 0, max = 999, hint }) {
  const handleIncrement = () => onChange(Math.min(max, value + 1))
  const handleDecrement = () => onChange(Math.max(min, value - 1))

  return (
    <div className="flex-1">
      <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`${label} azalt`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-800 border border-white/[0.06] text-zinc-300 hover:bg-surface-750 active:scale-[0.93] transition-all disabled:opacity-25"
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          inputMode="numeric"
          value={value === 0 ? '' : value}
          placeholder="0"
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const v = e.target.value === '' ? min : Number(e.target.value)
            onChange(Math.max(min, Math.min(max, v)))
          }}
          className="w-full rounded-xl bg-surface-900 border border-white/[0.08] px-2 py-2 text-center text-lg font-bold tabular-nums text-emerald-300 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label={`${label} artır`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25 active:scale-[0.93] transition-all disabled:opacity-25"
        >
          <Plus size={14} />
        </button>
      </div>
      {hint && <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{hint}</p>}
    </div>
  )
}

function CompactDurationField({ label, value, onChange, max = 999 }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface-850 border border-white/[0.06] p-2.5 transition-all">
      <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 mb-1.5">{label}</span>
      <div className="flex items-center justify-between w-full gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-750 text-zinc-300 hover:bg-surface-700 active:scale-90 transition-all disabled:opacity-25"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          min="0"
          max={max}
          inputMode="numeric"
          value={value === 0 ? '' : value}
          placeholder="0"
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
          className="w-full text-center text-lg font-extrabold tabular-nums text-gold-gradient bg-transparent focus:outline-none placeholder:text-zinc-700"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 active:scale-90 transition-all"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}

function Checkbox({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-200 select-none cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-5 w-5 rounded-md border border-amber-500/30 bg-surface-850 peer-checked:bg-gradient-to-br peer-checked:from-emerald-600 peer-checked:to-amber-600 peer-checked:border-amber-400 transition-all flex items-center justify-center">
          {checked && (
            <svg className="w-3.5 h-3.5 text-surface-950 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="group-hover:text-amber-200 transition-colors">{children}</span>
    </label>
  )
}

export default function BulkAddModal({ onClose, onApply }) {
  const [calcMode, setCalcMode] = useState('simple')

  const [years, setYears] = useState(0)
  const [months, setMonths] = useState(0)
  const [days, setDays] = useState(0)

  const [gender, setGender] = useState('male')
  const [birthDate, setBirthDate] = useState('')
  const [pubertyAge, setPubertyAge] = useState(12)
  const [hasStartedPrayer, setHasStartedPrayer] = useState(false)
  const [startPrayerAge, setStartPrayerAge] = useState(20)
  const [avgHayzDays, setAvgHayzDays] = useState(7)
  const [birthCount, setBirthCount] = useState(0)
  const [nifasDaysPerBirth, setNifasDaysPerBirth] = useState(40)

  const [includeVitir, setIncludeVitir] = useState(true)

  const simpleDays = useMemo(
    () => calculateTotalDays({ years, months, days }),
    [years, months, days]
  )

  const detailedResult = useMemo(
    () => calculateWithGender({ gender, birthDate, pubertyAge, hasStartedPrayer, startPrayerAge, avgHayzDays, birthCount, nifasDaysPerBirth }),
    [gender, birthDate, pubertyAge, hasStartedPrayer, startPrayerAge, avgHayzDays, birthCount, nifasDaysPerBirth]
  )

  const totalDays = calcMode === 'simple' ? simpleDays : detailedResult.totalDays

  const handleApply = () => {
    if (totalDays <= 0) return
    const addition = buildBulkAddition(PRAYERS, totalDays, includeVitir)
    onApply(addition)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md px-0 sm:px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl islamic-card p-5.5 safe-bottom animate-slide-up max-h-[90vh] overflow-y-auto border border-amber-500/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-900/50 to-amber-900/40 border border-amber-500/30">
              <Calculator size={19} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-zinc-100 text-base">Toplu Kaza Hesapla</h2>
              <p className="text-[11px] text-zinc-400">Tüm vakitlere tek seferde ekle</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-surface-800 hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mod seçici */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setCalcMode('simple')}
            className={`h-10.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${
              calcMode === 'simple'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-surface-850 border border-white/[0.06] text-zinc-400 hover:bg-surface-800'
            }`}
          >
            Yıl / Ay / Gün
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('detailed')}
            className={`h-10.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${
              calcMode === 'detailed'
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                : 'bg-surface-850 border border-white/[0.06] text-zinc-400 hover:bg-surface-800'
            }`}
          >
            Yaş + Cinsiyet
          </button>
        </div>

        {/* ═══════ Basit mod ═══════ */}
        {calcMode === 'simple' && (
          <div className="animate-fade-in space-y-3 mb-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Kaza namazı borcunuzu yıl, ay ve gün olarak girin; tüm vakitlere otomatik eklensin.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <CompactDurationField label="Yıl" value={years} onChange={setYears} />
              <CompactDurationField label="Ay" value={months} onChange={setMonths} max={12} />
              <CompactDurationField label="Gün" value={days} onChange={setDays} max={30} />
            </div>
          </div>
        )}

        {/* ═══════ Detaylı mod ═══════ */}
        {calcMode === 'detailed' && (
          <div className="animate-fade-in">
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Yaş ve cinsiyete göre hesapla — kadınlarda hayız/nifas düşümü otomatik yapılır.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl font-bold transition-all active:scale-[0.97] ${
                  gender === 'male'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-surface-850 border border-white/[0.06] text-zinc-400 hover:bg-surface-800'
                }`}
              >
                <User size={16} />
                Erkek
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl font-bold transition-all active:scale-[0.97] ${
                  gender === 'female'
                    ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                    : 'bg-surface-850 border border-white/[0.06] text-zinc-400 hover:bg-surface-800'
                }`}
              >
                <UserRound size={16} />
                Kadın
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                Doğum Tarihi
              </label>
              <div className="relative">
                <CalendarDays size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl bg-surface-900 border border-white/[0.08] pl-9 pr-3 py-2 text-sm font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="mb-4">
              <NumberField
                label="Buluğ yaşı"
                value={pubertyAge}
                onChange={setPubertyAge}
                min={7}
                max={20}
                hint="Hatırlamıyorsanız fıkhen 15 yaş esas alınır. (Erkek 12-15, kız 9-13)"
              />
            </div>

            <div className="mb-4 rounded-xl bg-surface-850 border border-white/[0.06] p-3 space-y-2">
              <Checkbox checked={hasStartedPrayer} onChange={setHasStartedPrayer}>
                5 vakit namaza düzenli başladım
              </Checkbox>
              {hasStartedPrayer && (
                <div className="pt-1 animate-fade-in">
                  <NumberField
                    label="Düzenli başlama yaşı"
                    value={startPrayerAge}
                    onChange={(val) => setStartPrayerAge(Math.max(pubertyAge, val))}
                    min={pubertyAge}
                    max={90}
                    hint="Buluğdan bu yaşa kadar olan dönem hesaplanır"
                  />
                </div>
              )}
            </div>

            {gender === 'female' && (
              <div className="rounded-xl bg-purple-950/40 border border-purple-500/20 p-3 mb-4 space-y-3 animate-fade-in">
                <p className="text-[11px] text-purple-300 font-semibold">Hayız & nifas düşümü</p>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Aylık adet günü" value={avgHayzDays} onChange={setAvgHayzDays} min={0} max={15} />
                  <NumberField label="Doğum sayısı" value={birthCount} onChange={setBirthCount} min={0} max={20} />
                </div>
                {birthCount > 0 && (
                  <NumberField
                    label="Doğum başına nifas günü"
                    value={nifasDaysPerBirth}
                    onChange={setNifasDaysPerBirth}
                    min={0}
                    max={60}
                    hint="Azami 40 gün"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Vitir */}
        <div className="mb-4 rounded-xl bg-surface-850 border border-white/[0.06] p-3 space-y-1.5">
          <Checkbox checked={includeVitir} onChange={setIncludeVitir}>
            Vitir namazını da dahil et
          </Checkbox>
          <p className="text-[11px] text-zinc-400 pl-7.5 leading-relaxed">
            💡 <span className="text-amber-300 font-semibold">Hanefî mezhebine göre</span> Vitir namazı vacip olduğundan kazası kılınmalıdır.
          </p>
        </div>

        {/* Özet */}
        <div className="rounded-xl islamic-card p-4 mb-5 space-y-1.5 border border-amber-500/20">
          {calcMode === 'simple' ? (
            <p className="text-xs text-zinc-300">
              <span className="font-bold text-amber-300">{years}</span> yıl{' '}
              <span className="font-bold text-amber-300">{months}</span> ay{' '}
              <span className="font-bold text-amber-300">{days}</span> gün{' '}
              <span className="text-zinc-500">→</span>{' '}
              her vakte <span className="font-extrabold text-gold-gradient">{totalDays.toLocaleString('tr-TR')}</span> kaza
              eklenecek{!includeVitir && ' (Vitir hariç)'}.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Namaz süresi</span>
                <span className="font-bold text-zinc-100 tabular-nums">
                  ~{detailedResult.prayerYears} yıl ({detailedResult.grossDays.toLocaleString('tr-TR')} gün)
                </span>
              </div>
              {gender === 'female' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Hayız düşümü</span>
                    <span className="font-semibold text-rose-400 tabular-nums">
                      −{detailedResult.hayzDays.toLocaleString('tr-TR')} gün
                    </span>
                  </div>
                  {detailedResult.nifasDays > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Nifas düşümü</span>
                      <span className="font-semibold text-rose-400 tabular-nums">
                        −{detailedResult.nifasDays.toLocaleString('tr-TR')} gün
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-semibold">Her vakte eklenecek</span>
                <span className="font-extrabold text-gold-gradient tabular-nums">
                  {totalDays.toLocaleString('tr-TR')} kaza
                </span>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={totalDays <= 0}
          className="group relative w-full h-12 rounded-xl font-bold btn-gold-gradient transition-all active:scale-[0.98] disabled:opacity-30 overflow-hidden"
        >
          <span className="relative font-bold">Tümüne Ekle</span>
        </button>
      </div>
    </div>
  )
}
