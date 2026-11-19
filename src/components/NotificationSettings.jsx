import { useEffect, useMemo, useState } from 'react'
import { BellRing, BellOff, CalendarPlus, Info, Send, ShieldAlert } from 'lucide-react'
import {
  ensureNotificationPermission,
  getNotificationPermission,
  showAppNotification
} from '../utils/notifications'
import { buildReminderEvents, formatClock, LEAD_OPTIONS, REMINDER_TARGETS } from '../utils/reminders'
import { buildIcs, icsFileName } from '../utils/ics'
import { deliverFile } from '../utils/download'
import { daysAround, hasCoords, upcomingEvents } from '../hooks/useReminders'

const ICS_DAY_OPTIONS = [7, 30]

const Chip = ({ active, onClick, children, sub }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rounded-xl px-3 py-2 text-left text-xs font-bold border transition-all active:scale-[0.97] ${
      active
        ? 'bg-accent-500/20 border-accent-400/40 text-accent-100'
        : 'bg-surface-900/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
    }`}
  >
    {children}
    {sub && <span className="block text-[10px] font-medium opacity-80 mt-0.5">{sub}</span>}
  </button>
)

const Segmented = ({ options, value, onChange, label, format }) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl bg-surface-900/80 border border-white/[0.06] p-1">
    {options.map((o) => (
      <button
        key={o}
        type="button"
        role="radio"
        aria-checked={value === o}
        onClick={() => onChange(o)}
        className={`flex-1 min-w-[3.5rem] rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
          value === o
            ? 'bg-accent-500/20 text-accent-100 border border-accent-400/35'
            : 'text-zinc-400 border border-transparent hover:text-zinc-200'
        }`}
      >
        {format(o)}
      </button>
    ))}
  </div>
)

const NAFILE_NOTES = { teheccud: 'Gecenin son üçte biri', kusluk: 'Güneş +50 dk', evvabin: 'Akşam +20 dk' }

/**
 * Ayarlar → Bildirimler (Faz 3: FR-BLD-01..04).
 */
export default function NotificationSettings({ settings, onChange, location, offsets }) {
  const [permission, setPermission] = useState(getNotificationPermission)
  const [msg, setMsg] = useState('')
  const [icsDays, setIcsDays] = useState(7)
  const [now, setNow] = useState(() => new Date())

  // İzin tarayıcı ayarlarından değişmiş olabilir; sıradaki vakit önizlemesi dakikada bir tazelenir
  useEffect(() => {
    const refresh = () => {
      setPermission(getNotificationPermission())
      setNow(new Date())
    }
    const t = setInterval(refresh, 60 * 1000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  const located = hasCoords(location)
  const next = useMemo(
    () => (located ? upcomingEvents(location, offsets, settings, now)[0] || null : null),
    [located, location, offsets, settings, now]
  )
  const anyTarget = Object.values(settings.targets).some(Boolean)
  const update = (patch) => onChange({ ...settings, ...patch })

  const toggleEnabled = async () => {
    setMsg('')
    // Görünen duruma göre davran: ayar açık ama izin yoksa (ör. yedekten gelen) dokunuş AÇMAYI dener
    if (settings.enabled && getNotificationPermission() === 'granted') {
      update({ enabled: false })
      return
    }
    const p = await ensureNotificationPermission() // kullanıcı dokunuşu içinde (FR-BLD-01)
    setPermission(p)
    if (p === 'granted') update({ enabled: true })
  }

  const sendTest = async () => {
    const ok = await showAppNotification('Deneme bildirimi', {
      body: next
        ? `Hatırlatmalar çalışıyor. Sıradaki: ${next.name} · ${formatClock(next.prayerTime)}`
        : 'Hatırlatmalar çalışıyor.',
      tag: 'deneme'
    })
    setMsg(ok ? 'Deneme bildirimi gönderildi.' : 'Bildirim gösterilemedi. Tarayıcı izinlerini kontrol et.')
  }

  const downloadIcs = async () => {
    setMsg('')
    try {
      const start = new Date()
      const span = Array.from({ length: icsDays }, (_, i) => i)
      const events = buildReminderEvents(daysAround(location, offsets, start, span), settings).filter(
        (e) => e.prayerTime.getTime() > start.getTime()
      )
      if (!events.length) {
        setMsg('Takvime eklenecek vakit yok — en az bir vakit seç.')
        return
      }
      await deliverFile({ name: icsFileName(start), text: buildIcs(events, { now: start }), type: 'text/calendar' })
      setMsg(`${events.length} etkinlik içeren takvim dosyası hazırlandı. Açınca takvimine eklenir.`)
    } catch {
      setMsg('Takvim dosyası oluşturulamadı.')
    }
  }

  const toggleTarget = (id) => update({ targets: { ...settings.targets, [id]: !settings.targets[id] } })
  const vakitler = REMINDER_TARGETS.filter((t) => t.kind === 'vakit')
  const nafileler = REMINDER_TARGETS.filter((t) => t.kind === 'nafile')

  // ── Durum satırı ──
  let status = null
  if (!located) {
    status = { tone: 'muted', icon: Info, text: 'Hatırlatmalar için önce yukarıdan konum seç.' }
  } else if (permission === 'unsupported') {
    status = {
      tone: 'muted',
      icon: BellOff,
      text: 'Bu tarayıcı bildirim desteklemiyor. iPhone’da uygulamayı Ana Ekrana ekleyince açılır. Aşağıdaki takvim dosyasını kullanabilirsin.'
    }
  } else if (permission === 'denied') {
    status = {
      tone: 'warn',
      icon: ShieldAlert,
      text: 'Bildirim izni kapalı. Tarayıcının site ayarlarından bu siteye bildirim izni verip sayfayı yenile.'
    }
  } else if (settings.enabled && next) {
    status = {
      tone: 'ok',
      icon: BellRing,
      text:
        next.leadMinutes > 0
          ? `Sıradaki: ${next.name} · ${formatClock(next.prayerTime)} (hatırlatma ${formatClock(next.at)})`
          : `Sıradaki: ${next.name} · ${formatClock(next.prayerTime)}`
    }
  }

  const switchDisabled = !located || permission === 'unsupported' || permission === 'denied'
  const on = settings.enabled && permission === 'granted'

  return (
    <div className="mt-3 space-y-3" data-testid="notification-settings">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-zinc-200">Vakit hatırlatmaları</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Vakit girince kaza için nazik bir hatırlatma</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Vakit hatırlatmaları"
          disabled={switchDisabled}
          onClick={toggleEnabled}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-40 ${
            on ? 'bg-primary-500/70 border-primary-400/60' : 'bg-surface-800 border-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow transition-all ${
              on ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {status && (
        <p
          data-testid="notification-status"
          className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[11px] leading-relaxed border ${
            status.tone === 'ok'
              ? 'bg-primary-500/[0.07] border-primary-500/20 text-primary-200'
              : status.tone === 'warn'
                ? 'bg-rose-500/[0.07] border-rose-500/20 text-rose-200'
                : 'bg-accent-500/[0.06] border-accent-400/15 text-zinc-300'
          }`}
        >
          <status.icon size={14} className="shrink-0 mt-px" />
          {status.text}
        </p>
      )}

      {located && (
        <>
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 mb-1.5">Farz vakitler</p>
            <div className="grid grid-cols-5 gap-1.5">
              {vakitler.map((t) => (
                <Chip key={t.id} active={settings.targets[t.id]} onClick={() => toggleTarget(t.id)}>
                  <span className="block text-center">{t.name}</span>
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 mb-1.5">Nafile vakitleri</p>
            <div className="grid grid-cols-3 gap-1.5">
              {nafileler.map((t) => (
                <Chip key={t.id} active={settings.targets[t.id]} onClick={() => toggleTarget(t.id)} sub={NAFILE_NOTES[t.id]}>
                  {t.name}
                </Chip>
              ))}
            </div>
          </div>
          {!anyTarget && <p className="text-[11px] text-rose-300">En az bir vakit seç.</p>}

          <div>
            <p className="text-[11px] font-semibold text-zinc-400 mb-1.5">Ne zaman?</p>
            <Segmented
              label="Hatırlatma zamanı"
              options={LEAD_OPTIONS}
              value={settings.leadMinutes}
              onChange={(v) => update({ leadMinutes: v })}
              format={(v) => (v === 0 ? 'Vaktinde' : `${v} dk önce`)}
            />
          </div>

          {on && (
            <button
              type="button"
              onClick={sendTest}
              className="flex w-full items-center justify-center gap-2 h-10 rounded-xl bg-surface-900/70 border border-white/[0.08] text-zinc-300 text-xs font-semibold hover:text-zinc-100 hover:border-accent-400/30 transition-all"
            >
              <Send size={14} />
              Deneme bildirimi gönder
            </button>
          )}

          <p className="flex items-start gap-2 text-[10px] text-zinc-500 leading-relaxed">
            <Info size={12} className="shrink-0 mt-px" />
            Hatırlatmalar uygulama açıkken ya da arka planda canlıyken gelir. Telefon kilitliyken de kesin
            hatırlatma için vakitleri takvimine ekle.
          </p>

          <div className="rounded-xl border border-accent-400/15 bg-accent-500/[0.05] p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <CalendarPlus size={15} className="text-accent-300" />
              <p className="text-xs font-bold text-zinc-200">Takvime ekle</p>
              <span className="text-[10px] text-zinc-500">· uygulama kapalıyken de çalışır</span>
            </div>
            <Segmented
              label="Takvim süresi"
              options={ICS_DAY_OPTIONS}
              value={icsDays}
              onChange={setIcsDays}
              format={(v) => `${v} gün`}
            />
            <button
              type="button"
              onClick={downloadIcs}
              disabled={!anyTarget}
              className="flex w-full items-center justify-center gap-2 h-10 rounded-xl bg-accent-500/15 border border-accent-400/30 text-accent-100 text-xs font-bold hover:bg-accent-500/25 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              <CalendarPlus size={14} />
              Takvim dosyasını indir (.ics)
            </button>
          </div>
        </>
      )}

      {msg && (
        <p className="text-[11px] text-zinc-400 leading-relaxed" role="status">
          {msg}
        </p>
      )}
    </div>
  )
}
