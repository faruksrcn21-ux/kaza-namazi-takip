import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  PRAYERS,
  STORAGE_KEY,
  STORAGE_KEY_INITIAL_TOTAL,
  STORAGE_KEY_ONBOARDING,
  STORAGE_KEY_PROFILE,
  createEmptyCounts
} from './constants/prayers'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useHistory } from './hooks/useHistory'
import { useReminders } from './hooks/useReminders'
import { useBirthdayGreeting } from './hooks/useBirthdayGreeting'
import { useTheme } from './hooks/useTheme'
import {
  STORAGE_KEY_LOCATION,
  STORAGE_KEY_PRAYER_OFFSETS,
  STORAGE_KEY_REMINDERS,
  STORAGE_KEY_DAILY_GOAL
} from './constants/storage'
import { normalizeGoal } from './utils/goal'
import { DEFAULT_REMINDER_SETTINGS, normalizeReminderSettings } from './utils/reminders'
import { NOTIFICATION_CLICK_MESSAGE, ensureNotificationPermission } from './utils/notifications'
import { todayKey } from './utils/history'
import { withBirthDate } from './utils/birthDateInput'
import BulkAddModal from './components/BulkAddModal'
import SetupWizard from './components/SetupWizard'
import UndoToast from './components/UndoToast'
import TabBar from './components/TabBar'
import TrackingScreen from './screens/TrackingScreen'
import SummaryScreen from './screens/SummaryScreen'
import SettingsScreen from './screens/SettingsScreen'
import { Analytics } from '@vercel/analytics/react'

const DEFAULT_OFFSETS = { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 }

export default function App() {
  const [counts, setCounts, resetCounts] = useLocalStorage(STORAGE_KEY, createEmptyCounts())
  const [initialTotal, setInitialTotal, resetInitialTotal] = useLocalStorage(
    STORAGE_KEY_INITIAL_TOTAL,
    0
  )
  const [onboardingDone, setOnboardingDone] = useLocalStorage(STORAGE_KEY_ONBOARDING, false)
  const [profile, setProfile] = useLocalStorage(STORAGE_KEY_PROFILE, null)
  const [modalOpen, setModalOpen] = useState(false)

  // 📊 Günlük kaza geçmişi (Faz 0)
  const { history, recordChange, recordBulk, revertChange, resetHistory } = useHistory()

  // 🎨 Tema (koyu varsayılan · açık · sistem)
  const [themePref, setThemePref] = useTheme()

  // 🧭 Aktif sekme (Takip | Özet | Ayarlar)
  const [activeTab, setActiveTab] = useState('tracking')

  // 📍 Konum + vakit sapması + 🔔 hatırlatma ayarı (Faz 3: zamanlayıcı da kullanır)
  const [location, setLocation] = useLocalStorage(STORAGE_KEY_LOCATION, null)
  const [offsets, setOffsets] = useLocalStorage(STORAGE_KEY_PRAYER_OFFSETS, DEFAULT_OFFSETS)
  const [remindersRaw, setReminders] = useLocalStorage(STORAGE_KEY_REMINDERS, DEFAULT_REMINDER_SETTINGS)
  const reminders = useMemo(() => normalizeReminderSettings(remindersRaw), [remindersRaw])
  const [goalRaw, setDailyGoal] = useLocalStorage(STORAGE_KEY_DAILY_GOAL, 0)
  const dailyGoal = normalizeGoal(goalRaw)

  // ✨ Bildirime dokununca: Takip sekmesi + ilgili vakit kartı vurgulanır
  const [highlightId, setHighlightId] = useState(null)
  const focusPrayer = useCallback((data) => {
    setActiveTab('tracking')
    if (data?.prayerId) setHighlightId(data.prayerId)
  }, [])

  useEffect(() => {
    if (!highlightId) return undefined
    const t = setTimeout(() => setHighlightId(null), 6000)
    return () => clearTimeout(t)
  }, [highlightId])

  useEffect(() => {
    // Uygulama kapalıyken bildirime dokunulduysa SW ?vakit=<id> ile açar
    const params = new URLSearchParams(window.location.search)
    const vakit = params.get('vakit')
    if (vakit) {
      focusPrayer({ prayerId: vakit })
      params.delete('vakit')
      const qs = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
    }
    if (!('serviceWorker' in navigator)) return undefined
    const onMessage = (e) => {
      if (e.data?.type === NOTIFICATION_CLICK_MESSAGE) focusPrayer(e.data.data)
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [focusPrayer])


  // 🔒 Kilit modu — varsayılan kilitli
  const [locked, setLocked] = useState(true)

  // 🔎 Kilit butonu ipucu — "Kilitli" yazısına basılınca butonu vurgular
  const [lockHintActive, setLockHintActive] = useState(false)
  const lockButtonRef = useRef(null)
  const lockHintTimer = useRef(null)

  const handleLockHint = useCallback(() => {
    // Önceki vurguyu temizle
    if (lockHintTimer.current) {
      clearTimeout(lockHintTimer.current)
      lockHintTimer.current = null
    }

    // Kilit butonuna yumuşak kaydır
    const el = lockButtonRef.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Butonu parlat
    setLockHintActive(true)
    lockHintTimer.current = setTimeout(() => {
      setLockHintActive(false)
      lockHintTimer.current = null
    }, 3600)
  }, [])

  // Bileşen ayrılırken vurgu timer'ını temizle
  useEffect(() => {
    return () => {
      if (lockHintTimer.current) {
        clearTimeout(lockHintTimer.current)
        lockHintTimer.current = null
      }
    }
  }, [])

  // 📩 Undo toast state
  const [undoAction, setUndoAction] = useState(null)
  const undoIdCounter = useRef(0)

  const totalRemaining = Object.values(counts).reduce((sum, n) => sum + n, 0)

  // 🔔 Vakit hatırlatmaları (uygulama açıkken / arka planda canlıyken)
  useReminders({
    location: onboardingDone ? location : null,
    offsets,
    settings: reminders,
    counts,
    onNotificationClick: focusPrayer
  })

  // 🎂 Doğum günü tebriği (K-29)
  useBirthdayGreeting({
    birthDate: onboardingDone ? profile?.birthDate : null,
    enabled: reminders.birthday
  })
  // 🎂 Doğum tarihini sonradan ekle/değiştir (K-36) — borç hesabına dokunmaz
  const setBirthDate = useCallback((v) => setProfile((prev) => withBirthDate(prev, v)), [setProfile])

  const enableBirthdayGreeting = useCallback(async () => {
    const p = await ensureNotificationPermission()
    if (p === 'granted') setReminders((prev) => ({ ...normalizeReminderSettings(prev), birthday: true }))
    return p
  }, [setReminders])

  const handleCardChange = useCallback(
    (id, nextValue, delta) => {
      const prevValue = counts[id] ?? 0
      const prayerInfo = PRAYERS.find((p) => p.id === id)

      undoIdCounter.current += 1
      setUndoAction({
        id: undoIdCounter.current,
        prayerId: id,
        prayerName: prayerInfo?.name || id,
        delta,
        prevValue,
        timestamp: Date.now()
      })

      const next = { ...counts, [id]: nextValue }
      setCounts(next)

      // 📊 Geçmişe kaydet — anlık kalan borç görüntüsüyle birlikte
      // delta < 0 → namaz kılındı (borç azaldı) → 'kaza'
      // delta > 0 → borç arttı → 'bulk'
      recordChange(id, delta, next)

      // ➕ +1/+5 = YENİ BORÇ (K-34): yüzdenin paydası da büyür (toplu eklemeyle aynı kural)
      if (delta > 0) setInitialTotal((prev) => (Number(prev) || 0) + delta)
    },
    [counts, setCounts, recordChange, setInitialTotal]
  )

  const handleUndo = useCallback(() => {
    if (!undoAction) return
    const next = {
      ...counts,
      [undoAction.prayerId]: undoAction.prevValue
    }
    setCounts(next)
    setUndoAction(null)

    // 📊 Geçmişte de geri al
    revertChange(undoAction.prayerId, undoAction.delta, next)

    // ➕ Geri alınan yeni borçsa başlangıç borcu da geri iner (K-34)
    if (undoAction.delta > 0) {
      setInitialTotal((prev) => Math.max(0, (Number(prev) || 0) - undoAction.delta))
    }
  }, [undoAction, setCounts, counts, revertChange, setInitialTotal])

  const handleUndoExpire = useCallback(() => {
    setUndoAction(null)
  }, [])

  const handleBulkApply = useCallback(
    (addition) => {
      const next = { ...counts }
      for (const id of Object.keys(addition)) {
        next[id] = (next[id] || 0) + addition[id]
      }
      setCounts(next)

      // 📊 Toplu ekleme geçmişe yazılır (bulk kovası).
      // NOT: setCounts updater'ı içinde çağrılmıyor — React StrictMode'da
      // updater iki kez çalışır ve kayıt çift yazılırdı.
      recordBulk(addition, next)

      setInitialTotal((prevInitial) => {
        const additionSum = Object.values(addition).reduce((s, n) => s + n, 0)
        return prevInitial + additionSum
      })
    },
    [counts, setCounts, setInitialTotal, recordBulk]
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
    resetHistory()
    setOnboardingDone(false)
    setProfile(null)
  }, [resetCounts, resetInitialTotal, resetHistory, setOnboardingDone, setProfile])

  // İlk açılışta setup wizard
  if (!onboardingDone) {
    return <SetupWizard onComplete={handleSetupComplete} />
  }

  return (
    <div className="relative min-h-screen bg-surface-950 islamic-pattern overflow-hidden">
      {/* İslami Derin Arka Plan Işıması (Zümrüt Yeşili & Kraliyet Moru) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-primary-800/[0.12] rounded-full blur-[140px] animate-ambient-glow" />
        <div className="absolute top-1/3 -right-28 w-[400px] h-[400px] bg-accent-900/[0.12] rounded-full blur-[130px] animate-ambient-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-28 -left-28 w-[380px] h-[380px] bg-accent-700/[0.06] rounded-full blur-[120px] animate-ambient-glow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 pb-28">
        {/* ── Aktif ekran ── */}
        {activeTab === 'tracking' && (
          <TrackingScreen
            counts={counts}
            initialTotal={initialTotal}
            totalRemaining={totalRemaining}
            profile={profile}
            locked={locked}
            onToggleLock={() => {
              setLocked((prev) => !prev)
              setLockHintActive(false)
            }}
            lockHintActive={lockHintActive}
            lockButtonRef={lockButtonRef}
            onLockHint={handleLockHint}
            onOpenBulk={() => setModalOpen(true)}
            onCardChange={handleCardChange}
            highlightId={highlightId}
            todayKaza={history[todayKey()]?.kaza}
            dailyGoal={dailyGoal}
            birthdayGreetingEnabled={reminders.birthday}
            onEnableBirthdayGreeting={enableBirthdayGreeting}
            onBirthDateSave={setBirthDate}
            onSuggest={(id) => setHighlightId(id)}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryScreen
            history={history}
            totalRemaining={totalRemaining}
            initialTotal={initialTotal}
            dailyGoal={dailyGoal}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            onReset={handleReset}
            profile={profile}
            location={location}
            onLocationChange={setLocation}
            offsets={offsets}
            onOffsetsChange={setOffsets}
            reminders={reminders}
            onRemindersChange={setReminders}
            dailyGoal={dailyGoal}
            onDailyGoalChange={setDailyGoal}
            themePref={themePref}
            onBirthDateChange={setBirthDate}
            onThemeChange={setThemePref}
            totalRemaining={totalRemaining}
          />
        )}
      </div>

      {/* ── Alt tab bar ── */}
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {/* Toplu hesaplama modalı */}
      {modalOpen && (
        <BulkAddModal onClose={() => setModalOpen(false)} onApply={handleBulkApply} />
      )}

      {/* Undo Toast — ekranın altında minimal bildirim */}
      <UndoToast
        action={undoAction}
        onUndo={handleUndo}
        onExpire={handleUndoExpire}
      />

      {/* Vercel Analytics Ziyaretçi & Etkileşim Takibi */}
      <Analytics />
    </div>
  )
}
