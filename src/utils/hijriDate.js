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

/**
 * Doğum tarihi verilen kullanıcının bugün Miladî veya Hicrî doğum günü olup olmadığını kontrol eder.
 *
 * @param {string} birthDateStr - "YYYY-MM-DD"
 * @returns {{
 *   isGregorianBirthday: boolean,
 *   isHijriBirthday: boolean,
 *   gregorianAge: number,
 *   hijriAge: number,
 *   hijriBirthDate: { day, month, monthName, year, formatted },
 *   todayHijriDate: { day, month, monthName, year, formatted }
 * }}
 */
export function checkBirthdays(birthDateStr) {
  if (!birthDateStr) {
    return {
      isGregorianBirthday: false,
      isHijriBirthday: false,
      gregorianAge: 0,
      hijriAge: 0,
      hijriBirthDate: null,
      todayHijriDate: null
    }
  }

  const birthDate = new Date(birthDateStr)
  if (isNaN(birthDate.getTime())) {
    return {
      isGregorianBirthday: false,
      isHijriBirthday: false,
      gregorianAge: 0,
      hijriAge: 0,
      hijriBirthDate: null,
      todayHijriDate: null
    }
  }

  const today = new Date()

  // 1) Miladî kontrol & tam yaş hesabı
  const isGregorianBirthday =
    today.getMonth() === birthDate.getMonth() &&
    today.getDate() === birthDate.getDate()

  let gregorianAge = today.getFullYear() - birthDate.getFullYear()
  const hasGregorianBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
  if (!hasGregorianBirthdayPassed) {
    gregorianAge -= 1
  }

  // 2) Hicrî kontrol & tam yaş hesabı
  const birthHijri = getHijriDate(birthDate)
  const todayHijri = getHijriDate(today)

  const isHijriBirthday =
    birthHijri &&
    todayHijri &&
    birthHijri.day === todayHijri.day &&
    birthHijri.month === todayHijri.month

  let hijriAge = 0
  if (birthHijri && todayHijri) {
    hijriAge = todayHijri.year - birthHijri.year
    const hasHijriBirthdayPassed =
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
