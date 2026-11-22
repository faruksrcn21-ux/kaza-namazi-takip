import { useEffect, useState } from 'react'
import { CalendarPlus, Cake } from 'lucide-react'
import { ensureNotificationPermission, getNotificationPermission } from '../utils/notifications'
import { birthdayCalendarEvents, GREETING_HOUR } from '../utils/birthdayGreeting'
import { buildIcs, icsFileName } from '../utils/ics'
import { deliverFile } from '../utils/download'

const CALENDAR_YEARS = 10

/**
 * Ayarlar → Bildirimler → Doğum günü tebriği (K-29).
 * Konumdan bağımsızdır; yalnızca profilde doğum tarihi varsa gösterilir.
 */
export default function BirthdayGreetingSettings({ birthDate, settings, onChange }) {
  const [permission, setPermission] = useState(getNotificationPermission)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const refresh = () => setPermission(getNotificationPermission())
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  if (!birthDate) return null

  const on = settings.birthday && permission === 'granted'
  const blocked = permission === 'denied' || permission === 'unsupported'

  const toggle = async () => {
    setMsg('')
    if (on) {
      onChange({ ...settings, birthday: false })
      return
    }
    const p = await ensureNotificationPermission()
    setPermission(p)
    if (p === 'granted') onChange({ ...settings, birthday: true })
  }

  const downloadIcs = async () => {
    setMsg('')
    try {
      const now = new Date()
      const events = birthdayCalendarEvents(birthDate, now, CALENDAR_YEARS)
      await deliverFile({
        name: icsFileName(now, 'dogum-gunlerim'),
        text: buildIcs(events, { now, calendarName: 'Doğum Günlerim (Miladî & Hicrî)' }),
        type: 'text/calendar'
      })
      setMsg(`Önümüzdeki ${CALENDAR_YEARS} yılın ${events.length} doğum günü takvim dosyasına eklendi.`)
    } catch {
      setMsg('Takvim dosyası oluşturulamadı.')
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-accent-400/15 bg-accent-500/[0.05] p-3 space-y-2.5" data-testid="birthday-greeting">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <Cake size={15} className="mt-0.5 shrink-0 text-accent-300" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold text-zinc-200">Doğum günü tebriği</p>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              Miladî ve Hicrî doğum gününde saat {String(GREETING_HOUR).padStart(2, '0')}:00’dan sonra bir kez
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Doğum günü tebriği"
          disabled={blocked}
          onClick={toggle}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-40 ${
            on ? 'bg-primary-500/70 border-primary-400/60' : 'bg-surface-800 border-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-[#fff] shadow transition-all ${
              on ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={downloadIcs}
        className="flex w-full items-center justify-center gap-2 h-10 rounded-xl bg-accent-500/15 border border-accent-400/30 text-accent-100 text-xs font-bold hover:bg-accent-500/25 active:scale-[0.98] transition-all"
      >
        <CalendarPlus size={14} />
        Doğum günlerimi takvime ekle ({CALENDAR_YEARS} yıl)
      </button>
      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Bildirim uygulama açıkken gelir; takvim dosyası telefon kapalıyken de hatırlatır. Hicrî doğum
        günü her yıl başka bir Miladî tarihe denk gelir — dosya bunları tek tek içerir.
      </p>
      {msg && (
        <p className="text-[11px] text-zinc-300" role="status">
          {msg}
        </p>
      )}
    </div>
  )
}
