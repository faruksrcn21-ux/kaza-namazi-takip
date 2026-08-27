import { useState, useCallback } from 'react'
import { Calculator } from 'lucide-react'
import {
  PRAYERS,
  STORAGE_KEY,
  STORAGE_KEY_INITIAL_TOTAL,
  STORAGE_KEY_ONBOARDING,
  STORAGE_KEY_PROFILE,
  createEmptyCounts
} from './constants/prayers'
import { useLocalStorage } from './hooks/useLocalStorage'
import PrayerCard from './components/PrayerCard'
import ProgressHeader from './components/ProgressHeader'
import BulkAddModal from './components/BulkAddModal'
import ResetButton from './components/ResetButton'
import SetupWizard from './components/SetupWizard'
import InstallPrompt from './components/InstallPrompt'
import BirthdayBanner from './components/BirthdayBanner'
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  const [counts, setCounts, resetCounts] = useLocalStorage(STORAGE_KEY, createEmptyCounts())
  const [initialTotal, setInitialTotal, resetInitialTotal] = useLocalStorage(
    STORAGE_KEY_INITIAL_TOTAL,
    0
  )
  const [onboardingDone, setOnboardingDone] = useLocalStorage(STORAGE_KEY_ONBOARDING, false)
  const [profile, setProfile] = useLocalStorage(STORAGE_KEY_PROFILE, null)
  const [modalOpen, setModalOpen] = useState(false)

  const totalRemaining = Object.values(counts).reduce((sum, n) => sum + n, 0)

  const handleCardChange = useCallback(
    (id, nextValue) => {
      setCounts((prev) => ({ ...prev, [id]: nextValue }))
    },
    [setCounts]
  )

  const handleBulkApply = useCallback(
    (addition) => {
      setCounts((prev) => {
        const next = { ...prev }
        for (const id of Object.keys(addition)) {
          next[id] = (next[id] || 0) + addition[id]
        }
        return next
      })
      setInitialTotal((prevInitial) => {
        const additionSum = Object.values(addition).reduce((s, n) => s + n, 0)
        return prevInitial + additionSum
      })
    },
    [setCounts, setInitialTotal]
  )

  const handleSetupComplete = useCallback(
    (prayerCounts, total, profile) => {
      setCounts(prayerCounts)
      setInitialTotal(total)
      setProfile(profile)
      setOnboardingDone(true)
    },
    [setCounts, setInitialTotal, setProfile, setOnboardingDone]
  )

  const handleReset = useCallback(() => {
    resetCounts()
    resetInitialTotal()
    setOnboardingDone(false)
    setProfile(null)
  }, [resetCounts, resetInitialTotal, setOnboardingDone, setProfile])

  // İlk açılışta setup wizard
  if (!onboardingDone) {
    return <SetupWizard onComplete={handleSetupComplete} />
  }

  return (
    <div className="relative min-h-screen bg-surface-950 islamic-pattern overflow-hidden">
      {/* İslami Derin Arka Plan Işıması (Zümrüt Yeşili & Kraliyet Moru) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-emerald-800/[0.12] rounded-full blur-[140px] animate-ambient-glow" />
        <div className="absolute top-1/3 -right-28 w-[400px] h-[400px] bg-purple-900/[0.12] rounded-full blur-[130px] animate-ambient-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-28 -left-28 w-[380px] h-[380px] bg-amber-700/[0.06] rounded-full blur-[120px] animate-ambient-glow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 pb-12">
        {/* İlerleme çubuğu — sticky header */}
        <ProgressHeader totalRemaining={totalRemaining} initialTotal={initialTotal} />

        {/* Görkemli Başlık Bölgesi */}
        <header className="pt-5 pb-4 text-center">
          {/* Besmele-i Şerif */}
          <p className="font-serif text-amber-300/80 text-sm tracking-wide mb-1 select-none">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 className="text-2xl font-black text-royal-gradient tracking-tight">
            Kaza Namazı Takip
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-amber-500/30" />
            <p className="text-xs text-zinc-400 font-medium">Vakitlerini seç, borcunu eda et</p>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-amber-500/30" />
          </div>
        </header>

        {/* Telefona Yükle Banner'ı */}
        <InstallPrompt />

        {/* Hicrî & Miladî Doğum Günü Tebrik & Yaş Kartı */}
        <BirthdayBanner profile={profile} />

        {/* Toplu Hesaplama Butonu — İslami Altın/Zümrüt Vurgulu */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group relative flex items-center justify-center gap-2.5 w-full h-13 rounded-2xl font-extrabold mb-6 overflow-hidden transition-all duration-200 active:scale-[0.98] islamic-card border border-amber-500/30 shadow-lg"
          aria-label="Toplu kaza namazı hesapla ve ekle"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/30 via-purple-900/30 to-amber-900/20 group-hover:opacity-100 transition-opacity" />
          <Calculator size={19} className="relative text-amber-400" />
          <span className="relative text-gold-gradient text-sm tracking-wide">
            Toplu Kaza Hesapla ve Ekle
          </span>
        </button>

        {/* Vakit kartları */}
        <div className="space-y-3 mb-6">
          {PRAYERS.map((prayer, index) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              count={counts[prayer.id] || 0}
              onChange={handleCardChange}
              index={index}
            />
          ))}
        </div>

        {/* Sıfırlama */}
        <ResetButton onConfirm={handleReset} />
      </div>

      {/* Toplu hesaplama modalı */}
      {modalOpen && (
        <BulkAddModal onClose={() => setModalOpen(false)} onApply={handleBulkApply} />
      )}

      {/* Vercel Analytics Ziyaretçi & Etkileşim Takibi */}
      <Analytics />
    </div>
  )
}
