import {
  checkBirthdays,
  getHijriDate,
  isGregorianBirthdayOn,
  isHijriBirthdayOn,
  parseLocalDate
} from './hijriDate'

/**
 * DOĞUM GÜNÜ TEBRİĞİ (K-29) — saf mantık.
 *
 * - Miladî ve/veya Hicrî doğum gününde, saat 09:00'dan sonra BİR KEZ bildirim.
 * - "Gönderildi" anahtarları: miladi-<yıl>, hicri-<hicrî yıl> → aynı yıl tekrar yok.
 * - Uygulama kapalıyken de çalışması için: önümüzdeki yılların doğum günleri
 *   tüm gün takvim etkinliği (.ics) olarak verilir.
 */
export const GREETING_HOUR = 9

export function birthdayGreetingText(info) {
  const { isGregorianBirthday: g, isHijriBirthday: h, gregorianAge, hijriAge, todayHijriDate } = info
  if (g && h) {
    return {
      title: 'Doğum Gününüz Mübarek Olsun!',
      body: `Bugün hem Miladî (${gregorianAge}) hem Hicrî (${hijriAge}) yaşınıza giriyorsunuz. Rabbim ömrünüzü bereketli eylesin.`
    }
  }
  if (h) {
    return {
      title: 'Hicrî Doğum Gününüz Mübarek Olsun!',
      body: `Bugün ${todayHijriDate?.day} ${todayHijriDate?.monthName}: ${hijriAge}. Hicrî yaşınıza girdiniz. Allah ömrünüzü bereketli eylesin.`
    }
  }
  return {
    title: 'Miladî Doğum Gününüz Kutlu Olsun!',
    body: `${gregorianAge}. yaşınız hayırlı olsun. Rabbim hayırlı, bereketli bir ömür versin.`
  }
}

/**
 * Şu an gönderilmesi gereken tebrik (yoksa null).
 * @param {{birthDate: string, now: Date, sent: string[]}} p
 * @returns {{keys: string[], title: string, body: string} | null}
 */
export function pendingBirthdayGreeting({ birthDate, now = new Date(), sent = [] }) {
  if (!birthDate) return null
  if (now.getHours() < GREETING_HOUR) return null
  const info = checkBirthdays(birthDate, now)
  if (!info.isGregorianBirthday && !info.isHijriBirthday) return null

  const keys = []
  if (info.isGregorianBirthday) keys.push(`miladi-${now.getFullYear()}`)
  if (info.isHijriBirthday && info.todayHijriDate) keys.push(`hicri-${info.todayHijriDate.year}`)
  const fresh = keys.filter((k) => !sent.includes(k))
  if (!fresh.length) return null

  // Yalnız gönderilmemiş tür(ler) için metin
  const only = {
    ...info,
    isGregorianBirthday: info.isGregorianBirthday && fresh.some((k) => k.startsWith('miladi-')),
    isHijriBirthday: info.isHijriBirthday && fresh.some((k) => k.startsWith('hicri-'))
  }
  return { keys: fresh, ...birthdayGreetingText(only) }
}

/** Gönderilen anahtarları ekler; son 10 kayıt tutulur. */
export const rememberSent = (sent, keys) => [...new Set([...(sent || []), ...keys])].slice(-10)

const pad = (n) => String(n).padStart(2, '0')
const keyOf = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`

/**
 * Önümüzdeki `years` yılın Miladî ve Hicrî doğum günleri (tüm gün etkinlik).
 * @returns {Array<{key, allDay: true, date: Date, summary, description, alarmHour}>}
 */
export function birthdayCalendarEvents(birthDate, from = new Date(), years = 10, hijriOf = getHijriDate) {
  const birth = parseLocalDate(birthDate)
  if (!birth) return []
  const start = parseLocalDate(from)
  const end = new Date(start.getFullYear() + years, start.getMonth(), start.getDate(), 12)
  const birthHijri = hijriOf(birth)
  const out = []
  for (let d = new Date(start); d < end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12)) {
    const g = isGregorianBirthdayOn(birth, d)
    const h = isHijriBirthdayOn(birthHijri, d, hijriOf)
    if (!g && !h) continue
    const age = checkBirthdays(birthDate, d)
    if (g) {
      out.push({
        key: `dogum-miladi-${keyOf(d)}`,
        allDay: true,
        date: d,
        summary: `Miladî doğum günüm (${age.gregorianAge})`,
        description: 'Rabbim hayırlı, bereketli bir ömür versin.',
        alarmHour: GREETING_HOUR
      })
    }
    if (h) {
      out.push({
        key: `dogum-hicri-${keyOf(d)}`,
        allDay: true,
        date: d,
        summary: `Hicrî doğum günüm (${age.hijriAge})`,
        description: `${age.todayHijriDate?.day} ${age.todayHijriDate?.monthName} ${age.todayHijriDate?.year}. Allah ömrünüzü bereketli eylesin.`,
        alarmHour: GREETING_HOUR
      })
    }
  }
  return out
}
