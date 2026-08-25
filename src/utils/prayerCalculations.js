/**
 * Kaza namazı hesaplama yardımcı fonksiyonları.
 *
 * Fıkhî kural:
 * - Erkek: buluğdan itibaren her gün 5 vakit (+ isteğe bağlı vitir) namaz borcu.
 * - Kadın: aynı kural geçerli, ancak hayız (adet) ve nifas (lohusalık) günleri
 *   çıkarılır — bu günlerde namaz borcu oluşmaz.
 *
 * Hesaplama: Doğum tarihi + buluğ yaşı → buluğ tarihi.
 * 5 vakit namaza başlama yaşı girilmişse: başlama tarihi − buluğ tarihi.
 * Girilmemişse: bugünün tarihi − buluğ tarihi.
 */

// ────────────────────────────────────────────────
// 1) Basit yıl/ay/gün → toplam gün çevirici
// ────────────────────────────────────────────────

/**
 * Manuel "yıl / ay / gün" girdisinden toplam gün sayısını hesaplar.
 * BulkAddModal'daki basit mod için kullanılır.
 */
export function calculateTotalDays({ years = 0, months = 0, days = 0 }) {
  const y = Math.max(0, Number(years) || 0)
  const m = Math.max(0, Number(months) || 0)
  const d = Math.max(0, Number(days) || 0)
  return Math.round(y * 365.25 + m * 30 + d)
}

// ────────────────────────────────────────────────
// 2) Doğum tarihi + buluğ yaşı + başlama yaşı → net gün hesabı
// ────────────────────────────────────────────────

/**
 * Doğum tarihi, buluğ yaşı ve 5 vakit namaza düzenli başlama yaşından
 * kaç gün kaza borcu kaldığını birebir hesaplar.
 *
 * @param {string} birthDateStr     - ISO doğum tarihi ("YYYY-MM-DD")
 * @param {number} pubertyAge       - Buluğ yaşı
 * @param {boolean} hasStartedPrayer - 5 vakit namaza düzenli başlandı mı?
 * @param {number} startPrayerAge   - 5 vakit namaza başlama yaşı
 * @returns {{ grossDays: number, prayerYears: number, pubertyDate: Date, endDate: Date }}
 */
export function calculateDaysFromBirthDate(birthDateStr, pubertyAge, hasStartedPrayer = false, startPrayerAge = null) {
  const birth = new Date(birthDateStr)
  if (isNaN(birth.getTime())) {
    return { grossDays: 0, prayerYears: 0, pubertyDate: null, endDate: null }
  }

  const puberty = Math.max(0, Number(pubertyAge) || 0)

  // Buluğ tarihi = doğum + buluğ yaşı
  const pubertyDate = new Date(birth)
  pubertyDate.setFullYear(pubertyDate.getFullYear() + puberty)

  const today = new Date()

  // Bitiş tarihi: Düzenli başlandıysa başlama yaşı tarihi, başlanmadıysa bugün
  let endDate = today
  if (hasStartedPrayer && startPrayerAge !== null && startPrayerAge !== undefined && startPrayerAge !== '') {
    const startAge = Math.max(puberty, Number(startPrayerAge) || puberty)
    const startDate = new Date(birth)
    startDate.setFullYear(startDate.getFullYear() + startAge)
    // Eğer başlama tarihi bugünden sonraysa bugünü sınır al
    endDate = startDate > today ? today : startDate
  }

  // Henüz buluğa erişmemişse veya başlama tarihi buluğdan küçükse 0 döner
  if (pubertyDate >= endDate) {
    return { grossDays: 0, prayerYears: 0, pubertyDate, endDate }
  }

  // Gün farkı — milisaniye → gün
  const diffMs = endDate.getTime() - pubertyDate.getTime()
  const grossDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Yaklaşık yıl (sadece gösterim için)
  const prayerYears = Math.round((grossDays / 365.25) * 10) / 10

  return { grossDays, prayerYears, pubertyDate, endDate }
}

// ────────────────────────────────────────────────
// 3) Cinsiyet farkını dikkate alan tam hesaplama
// ────────────────────────────────────────────────

/**
 * Doğum tarihi, buluğ yaşı, namaza başlama yaşı ve cinsiyet bilgisiyle net kaza günü hesaplar.
 *
 * @param {Object} params
 * @param {'male'|'female'} params.gender             - Cinsiyet
 * @param {string}          params.birthDate           - ISO doğum tarihi ("YYYY-MM-DD")
 * @param {number}          params.pubertyAge          - Buluğ yaşı
 * @param {boolean}         params.hasStartedPrayer    - 5 vakit namaza düzenli başlandı mı?
 * @param {number}          params.startPrayerAge      - 5 vakit namaza başlama yaşı
 * @param {number}          params.avgHayzDays         - Kadınlarda aylık ortalama hayız günü
 * @param {number}          params.birthCount          - Doğum sayısı (nifas hesabı için)
 * @param {number}          params.nifasDaysPerBirth   - Doğum başına nifas günü
 * @returns {{ totalDays, grossDays, hayzDays, nifasDays, prayerYears }}
 */
export function calculateWithGender({
  gender = 'male',
  birthDate = '',
  pubertyAge = 12,
  hasStartedPrayer = false,
  startPrayerAge = 20,
  avgHayzDays = 7,
  birthCount = 0,
  nifasDaysPerBirth = 40
}) {
  // Doğum tarihinden birebir gün farkı hesapla
  const { grossDays, prayerYears } = calculateDaysFromBirthDate(birthDate, pubertyAge, hasStartedPrayer, startPrayerAge)

  if (gender === 'male') {
    return { totalDays: grossDays, grossDays, hayzDays: 0, nifasDays: 0, prayerYears }
  }

  // Kadın hesabı — hayız ve nifas günleri düşülür
  const hayz = Math.max(0, Number(avgHayzDays) || 0)
  const births = Math.max(0, Number(birthCount) || 0)
  const nifasPerBirth = Math.max(0, Number(nifasDaysPerBirth) || 0)

  // Toplam hayız: kaza yapılan ay sayısı × aylık ortalama hayız günü
  const totalMonths = Math.floor(grossDays / 30)
  const totalHayzDays = Math.round(totalMonths * hayz)
  // Toplam nifas: doğum sayısı × doğum başına nifas günü
  const totalNifasDays = Math.round(births * nifasPerBirth)

  // Net namaz borcu günü (negatif olamaz)
  const totalDays = Math.max(0, grossDays - totalHayzDays - totalNifasDays)

  return {
    totalDays,
    grossDays,
    hayzDays: totalHayzDays,
    nifasDays: totalNifasDays,
    prayerYears
  }
}

// ────────────────────────────────────────────────
// 4) Toplu ekleme dağıtımı
// ────────────────────────────────────────────────

/**
 * Toplu ekleme sonucu, her vakit için eklenecek miktarı döner.
 * Vitir dahil edilmek istenmiyorsa 0 olarak işaretlenir.
 */
export function buildBulkAddition(prayers, totalDays, includeVitir) {
  return prayers.reduce((acc, prayer) => {
    if (prayer.isVitir && !includeVitir) {
      acc[prayer.id] = 0
    } else {
      acc[prayer.id] = totalDays
    }
    return acc
  }, {})
}
