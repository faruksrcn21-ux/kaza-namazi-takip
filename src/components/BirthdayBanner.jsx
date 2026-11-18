import { useState, useEffect } from 'react'
import { PartyPopper, Moon, Calendar, Bell, Check, HeartHandshake, Sparkles, HandHeart } from 'lucide-react'
import { checkBirthdays } from '../utils/hijriDate'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showAppNotification
} from '../utils/notifications'

export default function BirthdayBanner({ profile }) {
  const birthDate = profile?.birthDate
  const [notificationState, setNotificationState] = useState('default') // 'default' | 'granted' | 'denied' | 'unsupported'
  const [dismissed, setDismissed] = useState(false)

  const birthdayInfo = checkBirthdays(birthDate)
  const {
    isGregorianBirthday,
    isHijriBirthday,
    gregorianAge,
    hijriAge,
    hijriBirthDate,
    todayHijriDate
  } = birthdayInfo

  useEffect(() => {
    setNotificationState(getNotificationPermission())
  }, [])

  if (!birthDate || dismissed) return null

  // Bildirim izni isteme ve tebrik/deneme bildirimi — ortak servis üzerinden (TD-07)
  const handleRequestNotification = async () => {
    const permission = await requestNotificationPermission()
    setNotificationState(permission)
    if (permission !== 'granted') return

    const title = isHijriBirthday
      ? 'Hicrî Doğum Gününüz Mübarek Olsun!'
      : isGregorianBirthday
        ? 'Miladî Doğum Gününüz Kutlu Olsun!'
        : 'Kaza Namazı Takip Bildirimleri Açıldı'

    const body = isHijriBirthday
      ? `Bugün ${hijriBirthDate?.formatted} (${hijriAge}. Hicrî yaşınız). Allah ömrünüzü bereketli eylesin.`
      : isGregorianBirthday
        ? `Miladî ${gregorianAge}. yaşınız kutlu olsun. Rabbim hayırlı uzun ömürler versin.`
        : 'Hicrî ve Miladî doğum günlerinizde size özel tebrik bildirimi gönderilecektir.'

    await showAppNotification(title, { body, tag: 'dogum-gunu' })
  }

  // Bugün Doğum Günü mü? (Miladî veya Hicrî)
  const isCelebrationDay = isGregorianBirthday || isHijriBirthday

  return (
    <div className="mb-5 animate-fade-in">
      {isCelebrationDay ? (
        /* ═════════ DOĞUM GÜNÜ TEBRİK KARTI ═════════ */
        <div className="relative rounded-2xl islamic-card p-5 border border-accent-500/40 shadow-xl overflow-hidden">
          {/* Işıma Efekti */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent-500/15 via-accent-500/15 to-primary-500/15 animate-ambient-glow pointer-events-none" />

          <div className="relative z-10">
            {/* Üst İkon & Kapatma */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/30 to-accent-500/30 border border-accent-400/40">
                  <PartyPopper size={22} className="text-accent-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300 border border-accent-500/30 inline-flex items-center gap-1">
                    {isHijriBirthday && isGregorianBirthday ? (
                      <>
                        <PartyPopper size={11} className="text-accent-300" /> Çifte Doğum Günü!
                      </>
                    ) : isHijriBirthday ? (
                      <>
                        <Moon size={11} className="text-accent-300" /> Hicrî Doğum Günü
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} className="text-accent-300" /> Miladî Doğum Günü
                      </>
                    )}
                  </span>
                  <h3 className="text-base font-extrabold text-brand-gradient mt-0.5">
                    Doğum Gününüz Mübarek Olsun!
                  </h3>
                </div>
              </div>
            </div>

            {/* Dua ve Detaylar */}
            <div className="space-y-2 text-xs text-zinc-200 leading-relaxed mb-4">
              {isHijriBirthday && (
                <p className="font-medium text-primary-300 flex items-center gap-1.5">
                  <Moon size={13} className="shrink-0 text-accent-400" />
                  <span>
                    <b>Hicrî Takvime Göre:</b> Bugün <span className="underline decoration-accent-400/50">{hijriBirthDate?.formatted}</span> ({hijriAge}. Hicrî yılınız).
                  </span>
                </p>
              )}
              {isGregorianBirthday && (
                <p className="font-medium text-accent-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="shrink-0 text-accent-400" />
                  <span>
                    <b>Miladî Takvime Göre:</b> Bugün {gregorianAge}. yaşınıza girdiniz.
                  </span>
                </p>
              )}
              <div className="rounded-xl bg-surface-900/60 p-3 border border-white/[0.06] text-accent-200/90 font-serif italic text-sm">
                <HeartHandshake size={14} className="inline mr-1 text-accent-400" />
                "Rabbimiz, ömrünüze bereket, ibadetlerinize huşû, kalbinize huzur versin. Yeni yaşınız hayırlara vesile olsun."{' '}
                <HandHeart size={14} className="inline ml-1 text-accent-400" />
              </div>
            </div>

            {/* Bildirim Al Butonu */}
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
              <span className="text-[11px] text-zinc-400">Her doğum gününde bildirim al</span>
              <button
                type="button"
                onClick={handleRequestNotification}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold btn-brand-gradient active:scale-95 transition-all"
              >
                {notificationState === 'granted' ? (
                  <>
                    <Check size={13} /> Bildirimler Açık
                  </>
                ) : (
                  <>
                    <Bell size={13} /> Bildirimi Aç
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ═════════ HİCRÎ & MİLADÎ YAŞ KARTI (NORMAL GÜN) ═════════ */
        <div className="rounded-2xl islamic-card p-4 border border-accent-500/15 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 border border-accent-500/30 text-accent-300">
                <Moon size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-accent-300/80 tracking-wider">
                  Takvim & Yaş Bilgisi
                </p>
                <p className="text-xs font-bold text-zinc-200">
                  Hicrî: <span className="text-brand-gradient">{hijriBirthDate?.formatted}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-800 border border-white/[0.06] text-primary-300 tabular-nums">
                {gregorianAge} Miladî / <span className="text-accent-300 font-bold">{hijriAge} Hicrî</span> Yaş
              </span>
            </div>
          </div>

          {/* Güncel Hicrî Tarih & Bildirim Açma */}
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 mt-2 text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1">
              <Calendar size={12} className="text-accent-400" /> Bugüne karşılık gelen: <b className="text-zinc-200">{todayHijriDate?.formatted}</b>
            </span>
            <button
              type="button"
              onClick={handleRequestNotification}
              className="text-accent-400 hover:text-accent-300 font-semibold flex items-center gap-1 transition-colors"
            >
              {notificationState === 'granted' ? (
                <span className="text-primary-400 flex items-center gap-1"><Check size={11} /> Bildirim Aktif</span>
              ) : (
                <span className="flex items-center gap-1"><Bell size={11} /> Doğum Günü Bildirimi Aç</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
