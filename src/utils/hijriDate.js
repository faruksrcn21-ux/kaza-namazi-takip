/**
 * Hicrî Takvim ve Doğum Günü Yardımcı Fonksiyonları.
 * Modern tarayıcılardaki yerel Intl.DateTimeFormat (islamic-umalqura) API'sini kullanır.
 */

const HIJRI_MONTH_NAMES_TR = [
  'Muharrem',
  'Sefer',
  'Rebiülevvel',
  'Rebiülahir',
  'Cemaziyelevvel',
  'Cemaziyelahir',
  'Recep',
  'Şaban',
  'Ramazan',
  'Şevval',
  'Zilkade',
  'Zilhicce'
]

/**
 * Verilen Miladî tarihi (Date veya "YYYY-MM-DD" string) Hicrî tarihe çevirir.
 * @param {Date|string} dateInput
 * @returns {{ day: number, month: number, monthName: string, year: number, formatted: string }}
 */
export function getHijriDate(dateInput) {
  if (!dateInput) return null

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (isNaN(date.getTime())) return null

  try {
    // Intl.DateTimeFormat ile Hicrî parçaları al
    const formatter = new Intl.DateTimeFormat('tr-TR-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    })

    const parts = formatter.formatToParts(date)
    let day = 1
    let month = 1
    let year = 1445

    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10)
      if (part.type === 'month') month = parseInt(part.value, 10)
      if (part.type === 'year') year = parseInt(part.value, 10)
    }

    const monthName = HIJRI_MONTH_NAMES_TR[month - 1] || `${month}. Ay`
    const formatted = `${day} ${monthName} ${year}`

    return { day, month, monthName, year, formatted }
  } catch (e) {
    // Fallback yaklaşık hesaplama
    const gYear = date.getFullYear()
    const hYear = Math.round((gYear - 622) * 1.03068)
    return { day: date.getDate(), month: date.getMonth() + 1, monthName: 'Hicrî', year: hYear, formatted: `${hYear} Hicrî` }
  }
}

/** "YYYY-MM-DD" → yerel öğlen (UTC ayrıştırmasının gün kaydırmasını önler). */
export function parseLocalDate(input) {
  if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate(), 12)
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(input || ''))
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  return Number.isNaN(d.getTime()) ? null : d
}

const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** Miladî doğum günü mü? 29 Şubat doğumlular artık olmayan yıllarda 28 Şubat'ta kutlanır. */
export function isGregorianBirthdayOn(birth, day) {
  if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(day.getFullYear())) {
    return day.getMonth() === 1 && day.getDate() === 28
  }
  return day.getMonth() === birth.getMonth() && day.getDate() === birth.getDate()
}

/**
 * Hicrî doğum günü mü? Ayın 30'unda doğanlar, ay 29 çektiğinde ayın son günü (29) kutlanır.
 */
export function isHijriBirthdayOn(birthHijri, day, hijriOf = getHijriDate) {
  const h = hijriOf(day)
  if (!birthHijri || !h || h.month !== birthHijri.month) return false
  if (h.day === birthHijri.day) return true
  if (birthHijri.day === 30 && h.day === 29) {
    const next = hijriOf(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 12))
    return !!next && next.month !== h.month // bu ay 29 çekiyor
  }
  return false
}

/**
 * Doğum tarihi verilen kullanıcının bugün Miladî veya Hicrî doğum günü olup olmadığını kontrol eder.
 *
 * @param {string} birthDateStr - "YYYY-MM-DD"
 * @param {Date} [now] - test için "bugün"
 * @returns {{
 *   isGregorianBirthday: boolean,
 *   isHijriBirthday: boolean,
 *   gregorianAge: number,
 *   hijriAge: number,
 *   hijriBirthDate: { day, month, monthName, year, formatted },
 *   todayHijriDate: { day, month, monthName, year, formatted }
 * }}
 */
export function checkBirthdays(birthDateStr, now = new Date()) {
  const empty = {
    isGregorianBirthday: false,
    isHijriBirthday: false,
    gregorianAge: 0,
    hijriAge: 0,
    hijriBirthDate: null,
    todayHijriDate: null
  }
  const birthDate = parseLocalDate(birthDateStr)
  if (!birthDate) return empty

  const today = parseLocalDate(now)

  // 1) Miladî kontrol & tam yaş hesabı
  const isGregorianBirthday = isGregorianBirthdayOn(birthDate, today)

  let gregorianAge = today.getFullYear() - birthDate.getFullYear()
  const hasGregorianBirthdayPassed =
    isGregorianBirthday ||
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
  if (!hasGregorianBirthdayPassed) {
    gregorianAge -= 1
  }

  // 2) Hicrî kontrol & tam yaş hesabı
  const birthHijri = getHijriDate(birthDate)
  const todayHijri = getHijriDate(today)
  const isHijriBirthday = isHijriBirthdayOn(birthHijri, today)

  let hijriAge = 0
  if (birthHijri && todayHijri) {
    hijriAge = todayHijri.year - birthHijri.year
    const hasHijriBirthdayPassed =
      isHijriBirthday ||
      todayHijri.month > birthHijri.month ||
      (todayHijri.month === birthHijri.month && todayHijri.day >= birthHijri.day)
    if (!hasHijriBirthdayPassed) {
      hijriAge -= 1
    }
  } else {
    hijriAge = Math.round(gregorianAge * 1.03068)
  }

  return {
    isGregorianBirthday,
    isHijriBirthday,
    gregorianAge,
    hijriAge,
    hijriBirthDate: birthHijri,
    todayHijriDate: todayHijri
  }
}
