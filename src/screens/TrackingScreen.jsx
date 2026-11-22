import { useEffect } from 'react'
import { Lock, LockOpen, Calculator } from 'lucide-react'
import { PRAYERS } from '../constants/prayers'
import PrayerCard from '../components/PrayerCard'
import ProgressHeader from '../components/ProgressHeader'
import InstallPrompt from '../components/InstallPrompt'
import BirthdayBanner from '../components/BirthdayBanner'
import TodayCard from '../components/TodayCard'
import BirthdayPrompt from '../components/BirthdayPrompt'

/**
 * "Takip" sekmesi — mevcut ana ekran.
 * Tüm sayaç mantığı App.jsx'te; burası yalnızca sunum.
 */
export default function TrackingScreen({
  counts,
  initialTotal,
  totalRemaining,
  profile,
  locked,
  onToggleLock,
  lockHintActive,
  lockButtonRef,
  onLockHint,
  onOpenBulk,
  onCardChange,
  highlightId,
  todayKaza,
  dailyGoal,
  onSuggest,
  birthdayGreetingEnabled,
  onEnableBirthdayGreeting,
  onBirthDateSave
}) {
  const todayTotal = Object.values(todayKaza || {}).reduce((s, n) => s + (n || 0), 0)

  // Bildirimden gelindiyse ilgili vakit kartını ortala
  useEffect(() => {
    if (!highlightId) return undefined
    const t = setTimeout(() => {
      document.getElementById(`vakit-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
    return () => clearTimeout(t)
  }, [highlightId])

  return (
    <>
      {/* İlerleme çubuğu — sticky header */}
      <ProgressHeader totalRemaining={totalRemaining} initialTotal={initialTotal} />

      {/* Görkemli Başlık Bölgesi */}
      <header className="pt-5 pb-4 text-center">
        {/* Besmele-i Şerif */}
        <p className="font-serif text-gold-300 text-sm tracking-wide mb-1 select-none">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h1 className="text-2xl font-black text-brand-gradient tracking-tight">
          Kaza Namazı Takip
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-accent-500/30" />
          <p className="text-xs text-zinc-400 font-medium">Vakitlerini seç, borcunu eda et</p>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-accent-500/30" />
        </div>
      </header>

      {/* Bugün: hicrî tarih · kılınan · öneri · mübarek gün (Faz 5) */}
      <TodayCard todayTotal={todayTotal} counts={counts} onSuggest={onSuggest} goal={dailyGoal} />

      {/* Telefona Yükle Banner'ı */}
      <InstallPrompt />

      {/* Hicrî & Miladî Doğum Günü Tebrik & Yaş Kartı */}
      {/* Doğum tarihi yoksa sonradan sor (K-36), varsa doğum günü kartı */}
      {!profile?.birthDate && <BirthdayPrompt onSave={onBirthDateSave} />}
      <BirthdayBanner
        profile={profile}
        greetingEnabled={birthdayGreetingEnabled}
        onEnableGreeting={onEnableBirthdayGreeting}
      />

      {/* 🔒 Kilit Modu Toggle + Toplu Hesaplama Butonu */}
      <div className="flex gap-2.5 mb-6">
        {/* Kilit Toggle Butonu */}
        <button
          type="button"
          ref={lockButtonRef}
          onClick={onToggleLock}
          className={`group relative flex items-center justify-center gap-2 h-13 rounded-2xl font-extrabold overflow-hidden transition-all duration-200 active:scale-[0.98] islamic-card border shadow-lg px-4 ${
            locked
              ? 'border-accent-500/30'
              : 'border-primary-500/40 ring-1 ring-primary-500/20'
          } ${lockHintActive ? 'animate-lock-glow animate-lock-shake z-30' : ''}`}
          aria-label={locked ? 'Düzenleme kilidini aç' : 'Düzenleme kilidini kapat'}
          aria-live="polite"
        >
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            locked
              ? 'bg-gradient-to-r from-accent-900/20 to-surface-900/0'
              : 'bg-gradient-to-r from-primary-900/30 to-accent-900/20'
          }`} />
          {locked ? (
            <>
              <Lock size={17} className={`relative text-accent-400 transition-transform duration-300 ${lockHintActive ? 'scale-110' : ''}`} />
              <span className={`relative text-accent-300 text-xs font-bold tracking-wide transition-all duration-300 ${lockHintActive ? 'text-accent-100 drop-shadow-[0_0_6px_rgb(var(--c-accent-300)/0.8)]' : ''}`}>
                Kilitli
              </span>
              {lockHintActive && (
                <span className="relative text-[10px] font-semibold text-accent-200/90 animate-fade-in">
                  · kilidi aç
                </span>
              )}
            </>
          ) : (
            <>
              <LockOpen size={17} className="relative text-primary-400" />
              <span className="relative text-primary-300 text-xs font-bold tracking-wide">Açık</span>
            </>
          )}
        </button>

        {/* Toplu Hesaplama Butonu — İslami Yeşil/Mor Vurgulu */}
        <button
          type="button"
          onClick={onOpenBulk}
          className="group relative flex-1 flex items-center justify-center gap-2.5 h-13 rounded-2xl font-extrabold overflow-hidden transition-all duration-200 active:scale-[0.98] islamic-card border border-accent-500/30 shadow-lg"
          aria-label="Toplu kaza namazı hesapla ve ekle"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-accent-900/30 to-accent-900/20 group-hover:opacity-100 transition-opacity" />
          <Calculator size={19} className="relative text-accent-400" />
          <span className="relative text-brand-gradient text-sm tracking-wide">
            Toplu Kaza Hesapla ve Ekle
          </span>
        </button>
      </div>

      {/* Vakit kartları */}
      <div className="space-y-3 mb-6">
        {PRAYERS.map((prayer, index) => (
          <PrayerCard
            key={prayer.id}
            prayer={prayer}
            count={counts[prayer.id] || 0}
            onChange={onCardChange}
            index={index}
            locked={locked}
            onLockHint={onLockHint}
            highlighted={highlightId === prayer.id}
            todayDone={todayKaza?.[prayer.id] || 0}
          />
        ))}
      </div>
    </>
  )
}
