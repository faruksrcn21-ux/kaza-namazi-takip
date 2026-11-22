import { Settings as SettingsIcon, MapPin, Bell, Clock, Database } from 'lucide-react'
import ResetButton from '../components/ResetButton'
import BackupPanel from '../components/BackupPanel'
import LocationPicker from '../components/LocationPicker'
import PrayerTimesCard from '../components/PrayerTimesCard'
import NotificationSettings from '../components/NotificationSettings'
import BirthdayGreetingSettings from '../components/BirthdayGreetingSettings'
import GoalSettings from '../components/GoalSettings'
import ThemeSettings from '../components/ThemeSettings'
import ProfileSettings from '../components/ProfileSettings'
import { usePrayerTimes } from '../hooks/usePrayerTimes'
import { normalizeOffsets } from '../utils/prayerTimes'

/**
 * "Ayarlar" sekmesi — Faz 2: konum + vakit hesabı (Diyanet) + sapma + sıfırlama.
 * Faz 3: bildirim izinleri.
 */
export default function SettingsScreen({
  onReset,
  profile,
  location,
  onLocationChange,
  offsets,
  onOffsetsChange,
  reminders,
  onRemindersChange,
  dailyGoal,
  onDailyGoalChange,
  totalRemaining,
  themePref,
  onThemeChange,
  onBirthDateChange
}) {
  // Konum/sapma/bildirim durumu App'te tutulur: hatırlatma zamanlayıcısı da kullanır (Faz 3)
  const setLocation = onLocationChange
  const setOffsets = onOffsetsChange
  const prayerData = usePrayerTimes(location, offsets)

  const handleOffsetChange = (id, value) => {
    setOffsets((prev) => normalizeOffsets({ ...prev, [id]: value }))
  }

  return (
    <div className="pt-5 pb-4">
      <header className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/10 border border-primary-500/30 mb-3">
          <SettingsIcon size={22} className="text-primary-300" />
        </div>
        <h1 className="text-xl font-black text-brand-gradient tracking-tight">Ayarlar</h1>
        <p className="text-xs text-zinc-400 mt-1">Tercihlerini ve verilerini yönet</p>
      </header>

      <div className="space-y-3">
        <GoalSettings goal={dailyGoal} onChange={onDailyGoalChange} totalRemaining={totalRemaining} />
        <ThemeSettings value={themePref} onChange={onThemeChange} />
        <ProfileSettings profile={profile} onBirthDateChange={onBirthDateChange} />

        <section className="rounded-2xl islamic-card p-4 border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15 border border-primary-500/25">
              <MapPin size={16} className="text-primary-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-zinc-100">Konum</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Namaz vakitleri bu konuma göre hesaplanır
              </p>
            </div>
          </div>
          <LocationPicker value={location} onChange={setLocation} />
        </section>

        <section className="rounded-2xl islamic-card p-4 border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 border border-accent-500/25">
              <Clock size={16} className="text-accent-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-zinc-100">Vakit Hesabı</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Diyanet (Hanefi) · 5 vakit + vitir + nafile
              </p>
            </div>
          </div>
          <PrayerTimesCard
            data={prayerData}
            hasLocation={!!location}
            offsets={offsets}
            onOffsetChange={handleOffsetChange}
          />
        </section>

        <section className="rounded-2xl islamic-card p-4 border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15 border border-primary-500/25">
              <Bell size={16} className="text-primary-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-zinc-100">Bildirimler</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Vakit hatırlatmaları ve takvim
              </p>
            </div>
          </div>
          <NotificationSettings
            settings={reminders}
            onChange={onRemindersChange}
            location={location}
            offsets={offsets}
          />
          <BirthdayGreetingSettings
            birthDate={profile?.birthDate}
            settings={reminders}
            onChange={onRemindersChange}
          />
        </section>

        <section className="rounded-2xl islamic-card p-4 border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 border border-accent-500/25">
              <Database size={16} className="text-accent-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-zinc-100">Veri</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Tüm veriler cihazında saklanır
                {profile?.gender ? ` · ${profile.gender === 'female' ? 'Kadın' : 'Erkek'}` : ''}
              </p>
            </div>
          </div>
          <BackupPanel />
          <ResetButton onConfirm={onReset} />
        </section>
      </div>
    </div>
  )
}
