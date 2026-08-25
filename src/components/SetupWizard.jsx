import { useState, useMemo } from 'react'
import { User, UserRound, Calculator, ChevronRight, ChevronLeft, Minus, Plus, Sparkles, BookOpen, CalendarDays } from 'lucide-react'
import { PRAYERS } from '../constants/prayers'
import { calculateWithGender, buildBulkAddition } from '../utils/prayerCalculations'

/**
 * Stepper'lı sayı giriş alanı — İslami Saray Temalı.
 */
function StepperField({ label, value, onChange, min = 0, max = 999, hint }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
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
          onClick={() => onChange(Math.min(max, value + 1))}
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

/**
 * Custom checkbox bileşeni
 */
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

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState(null)

  const [manualCounts, setManualCounts] = useState(
    PRAYERS.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
  )

  const [gender, setGender] = useState('male')
  const [birthDate, setBirthDate] = useState('')
  const [pubertyAge, setPubertyAge] = useState(12)
  const [hasStartedPrayer, setHasStartedPrayer] = useState(false)
  const [startPrayerAge, setStartPrayerAge] = useState(20)
  const [avgHayzDays, setAvgHayzDays] = useState(7)
  const [birthCount, setBirthCount] = useState(0)
  const [nifasDaysPerBirth, setNifasDaysPerBirth] = useState(40)
  const [includeVitir, setIncludeVitir] = useState(true)

  const calcResult = useMemo(() => {
    return calculateWithGender({
      gender,
      birthDate,
      pubertyAge,
      hasStartedPrayer,
      startPrayerAge,
      avgHayzDays,
      birthCount,
      nifasDaysPerBirth
    })
  }, [gender, birthDate, pubertyAge, hasStartedPrayer, startPrayerAge, avgHayzDays, birthCount, nifasDaysPerBirth])

  const finalCounts = useMemo(() => {
    if (mode === 'manual') {
      return manualCounts
    }
    return buildBulkAddition(PRAYERS, calcResult.totalDays, includeVitir)
  }, [mode, manualCounts, calcResult.totalDays, includeVitir])

  const finalTotal = Object.values(finalCounts).reduce((s, n) => s + n, 0)

  const handleFinish = () => {
    const profile = {
      gender,
      birthDate,
      pubertyAge,
      hasStartedPrayer,
      ...(hasStartedPrayer ? { startPrayerAge } : {}),
      ...(gender === 'female' ? { avgHayzDays, birthCount, nifasDaysPerBirth } : {})
    }
    onComplete(finalCounts, finalTotal, profile)
  }

  const updateManual = (id, value) => {
    setManualCounts((prev) => ({ ...prev, [id]: Math.max(0, value) }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950 islamic-pattern overflow-auto">
      {/* Dekoratif Işımalar */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[400px] bg-emerald-800/[0.12] rounded-full blur-[130px] animate-ambient-glow" />
        <div className="absolute -bottom-20 -right-20 w-[350px] h-[350px] bg-purple-900/[0.12] rounded-full blur-[110px] animate-ambient-glow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* ═══════ ADIM 1: Karşılama ═══════ */}
        {step === 1 && (
          <div className="animate-fade-in">
            {/* Logo / Başlık */}
            <div className="text-center mb-8">
              <p className="font-serif text-amber-300/80 text-sm tracking-wide mb-2 select-none">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-900/40 via-purple-900/40 to-amber-900/30 border border-amber-500/30 shadow-lg mb-4">
                <Sparkles size={28} className="text-amber-400" />
              </div>
              <h1 className="text-2xl font-black text-royal-gradient mb-2 tracking-tight">Kaza Namazı Takip</h1>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Kaza namazı borcunuzu hesaplayın veya kendiniz girerek hemen takibe başlayın.
              </p>
            </div>

            {/* Seçimler */}
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={() => { setMode('manual'); setStep(2) }}
                className="group w-full rounded-2xl islamic-card p-4.5 text-left transition-all hover:scale-[0.988] active:scale-[0.975] border border-emerald-500/20"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-900/50 to-teal-900/40 border border-emerald-500/30">
                    <BookOpen size={22} className="text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-100 text-base">Kaza sayımı biliyorum</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Her vakit için kaza sayılarını kendin gir</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setMode('calculate'); setStep(2) }}
                className="group w-full rounded-2xl islamic-card p-4.5 text-left transition-all hover:scale-[0.988] active:scale-[0.975] border border-purple-500/20"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-900/50 to-violet-900/40 border border-purple-500/30">
                    <Calculator size={22} className="text-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-100 text-base">Bilmiyorum, hesaplat</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Yaş ve fıkhî kurallara göre otomatik hesapla</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ═══════ ADIM 2a: Manuel Giriş ═══════ */}
        {step === 2 && mode === 'manual' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-surface-800 transition-colors"
                aria-label="Geri"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-bold text-zinc-100">Kaza Sayılarını Girin</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-5 ml-10">Her vakit için kaza borcu sayınızı girin.</p>

            <div className="space-y-3 mb-6">
              {PRAYERS.map((prayer) => {
                const Icon = prayer.icon
                return (
                  <div key={prayer.id} className="flex items-center gap-3 rounded-xl islamic-card p-3 border border-white/[0.06]">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${prayer.accentFrom} ${prayer.accentTo} border ${prayer.borderColor}`}>
                      <Icon size={18} className={prayer.iconColor} />
                    </div>
                    <span className="font-semibold text-zinc-200 text-sm flex-1">{prayer.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateManual(prayer.id, manualCounts[prayer.id] - 1)}
                        disabled={manualCounts[prayer.id] <= 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-800 border border-white/[0.06] text-zinc-300 active:scale-[0.93] transition-all disabled:opacity-25"
                        aria-label={`${prayer.name} azalt`}
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="0"
                        value={manualCounts[prayer.id] || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateManual(prayer.id, e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-20 rounded-lg bg-surface-900 border border-white/[0.08] px-2 py-1.5 text-center text-base font-bold tabular-nums text-emerald-300 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => updateManual(prayer.id, manualCounts[prayer.id] + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 active:scale-[0.93] transition-all"
                        aria-label={`${prayer.name} artır`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={finalTotal <= 0}
              className="group relative w-full h-12 rounded-xl font-bold btn-gold-gradient transition-all active:scale-[0.98] disabled:opacity-30 overflow-hidden"
            >
              <span className="relative font-bold flex items-center justify-center gap-2">
                Devam Et <ChevronRight size={16} />
              </span>
            </button>
          </div>
        )}

        {/* ═══════ ADIM 2b: Hesaplama Modu ═══════ */}
        {step === 2 && mode === 'calculate' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-surface-800 transition-colors"
                aria-label="Geri"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-bold text-zinc-100">Kaza Hesaplama</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-5 ml-10">Fıkhî esaslara göre kaza borcunuz hesaplanacaktır.</p>

            {/* Cinsiyet seçimi */}
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">Cinsiyet</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl font-bold transition-all active:scale-[0.97] ${
                    gender === 'male'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 border'
                      : 'bg-surface-850 border border-white/[0.06] text-zinc-400 hover:bg-surface-800'
                  }`}
                >
                  <User size={18} />
                  Erkek
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl font-bold transition-all active:scale-[0.97] ${
                    gender === 'female'
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 border'
                      : 'bg-surface-850 border border-white/[0.06] text-zinc-400 hover:bg-surface-800'
                  }`}
                >
                  <UserRound size={18} />
                  Kadın
                </button>
              </div>
            </div>

            {/* Doğum Tarihi */}
            <div className="mb-4">
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                Doğum Tarihiniz
              </label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl bg-surface-900 border border-white/[0.08] pl-10 pr-3 py-2.5 text-base font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all [color-scheme:dark]"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Güncel tarih otomatik alınır, sadece doğum tarihinizi seçin</p>
            </div>

            {/* Buluğ Yaşı */}
            <div className="mb-4">
              <StepperField
                label="Buluğ yaşınız"
                value={pubertyAge}
                onChange={setPubertyAge}
                min={7}
                max={20}
                hint="Buluğ yaşını hatırlamıyorsanız fıkhî kural olarak 15 yaş esas alınır. (Erkek 12-15, kız 9-13)"
              />
            </div>

            {/* 5 Vakit Namaza Düzenli Başlama Yaşı */}
            <div className="mb-4 rounded-xl bg-surface-850 border border-white/[0.06] p-3.5 space-y-3">
              <Checkbox checked={hasStartedPrayer} onChange={setHasStartedPrayer}>
                5 vakit namaza düzenli başladım
              </Checkbox>
              {hasStartedPrayer && (
                <div className="pt-1 animate-fade-in">
                  <StepperField
                    label="Düzenli başlama yaşınız"
                    value={startPrayerAge}
                    onChange={(val) => setStartPrayerAge(Math.max(pubertyAge, val))}
                    min={pubertyAge}
                    max={90}
                    hint="Buluğdan bu yaşa kadar olan namazlar kaza olarak hesaplanır"
                  />
                </div>
              )}
              {!hasStartedPrayer && (
                <p className="text-[11px] text-zinc-400 italic">
                  Henüz düzenli kılmaya başlamadıysanız, kaza borcunuz buluğdan bugüne kadar hesaplanır.
                </p>
              )}
            </div>

            {/* Kadına Özel Düşümler */}
            {gender === 'female' && (
              <div className="rounded-xl bg-purple-950/40 border border-purple-500/20 p-4 mb-4 space-y-3 animate-fade-in">
                <p className="text-xs text-purple-300 font-semibold mb-1">
                  Kadınlara özel — hayız ve nifas günleri düşülür
                </p>
                <StepperField
                  label="Aylık ortalama adet günü"
                  value={avgHayzDays}
                  onChange={setAvgHayzDays}
                  min={0}
                  max={15}
                  hint="Genelde 5-10 gün arası"
                />
                <StepperField
                  label="Doğum sayısı"
                  value={birthCount}
                  onChange={setBirthCount}
                  min={0}
                  max={20}
                />
                {birthCount > 0 && (
                  <StepperField
                    label="Doğum başına nifas (lohusalık) günü"
                    value={nifasDaysPerBirth}
                    onChange={setNifasDaysPerBirth}
                    min={0}
                    max={60}
                    hint="Azami 40 gün (fıkhi sınır)"
                  />
                )}
              </div>
            )}

            {/* Vitir */}
            <div className="mb-4 rounded-xl bg-surface-850 border border-white/[0.06] p-3.5 space-y-1.5">
              <Checkbox checked={includeVitir} onChange={setIncludeVitir}>
                Vitir namazını da dahil et
              </Checkbox>
              <p className="text-[11px] text-zinc-400 pl-7.5 leading-relaxed">
                💡 <span className="text-amber-300 font-semibold">Hanefî mezhebine göre</span> Vitir namazı vacip olduğu için kazası da kılınmalıdır.
              </p>
            </div>

            {/* Hesaplama Özeti */}
            {birthDate && (
              <div className="rounded-xl islamic-card p-4 mb-5 space-y-1.5 border border-amber-500/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Namaz borcu süresi</span>
                  <span className="font-bold text-zinc-100 tabular-nums">
                    ~{calcResult.prayerYears} yıl ({calcResult.grossDays.toLocaleString('tr-TR')} gün)
                  </span>
                </div>
                {gender === 'female' && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Hayız düşümü</span>
                      <span className="font-semibold text-rose-400 tabular-nums">
                        −{calcResult.hayzDays.toLocaleString('tr-TR')} gün
                      </span>
                    </div>
                    {calcResult.nifasDays > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Nifas düşümü</span>
                        <span className="font-semibold text-rose-400 tabular-nums">
                          −{calcResult.nifasDays.toLocaleString('tr-TR')} gün
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-300 font-semibold">Her vakte eklenecek</span>
                  <span className="font-black text-gold-gradient text-base tabular-nums">
                    {calcResult.totalDays.toLocaleString('tr-TR')} kaza
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={calcResult.totalDays <= 0}
              className="group relative w-full h-12 rounded-xl font-bold btn-gold-gradient transition-all active:scale-[0.98] disabled:opacity-30 overflow-hidden"
            >
              <span className="relative font-bold flex items-center justify-center gap-2">
                Devam Et <ChevronRight size={16} />
              </span>
            </button>
          </div>
        )}

        {/* ═══════ ADIM 3: Özet & Onay ═══════ */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-surface-800 transition-colors"
                aria-label="Geri"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-bold text-zinc-100">Özet</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-5 ml-10">Aşağıdaki sayılarla kaza takibine başlamak üzeresiniz.</p>

            <div className="space-y-2 mb-5">
              {PRAYERS.map((prayer) => {
                const Icon = prayer.icon
                const count = finalCounts[prayer.id] || 0
                return (
                  <div key={prayer.id} className="flex items-center justify-between rounded-xl islamic-card px-4 py-3 border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${prayer.accentFrom} ${prayer.accentTo}`}>
                        <Icon size={16} className={prayer.iconColor} />
                      </div>
                      <span className="font-semibold text-zinc-200 text-sm">{prayer.name}</span>
                    </div>
                    <span className={`text-xl font-extrabold tabular-nums ${count > 0 ? (prayer.isVitir ? 'text-gold-gradient' : 'text-emerald-300') : 'text-zinc-600'}`}>
                      {count.toLocaleString('tr-TR')}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="rounded-xl islamic-card-emerald p-4 mb-6 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-200">Toplam Kaza Borcu</span>
                <span className="text-2xl font-black text-gold-gradient tabular-nums">
                  {finalTotal.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              disabled={finalTotal <= 0}
              className="group relative w-full h-13 rounded-xl font-bold btn-gold-gradient transition-all active:scale-[0.98] disabled:opacity-30 overflow-hidden"
            >
              <span className="relative font-bold text-base flex items-center justify-center gap-2">
                <Sparkles size={18} />
                Takibe Başla
              </span>
            </button>
          </div>
        )}

        {/* Alt adım göstergesi */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-gradient-to-r from-amber-400 to-emerald-400'
                  : s < step
                    ? 'w-4 bg-emerald-500/30'
                    : 'w-4 bg-surface-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
