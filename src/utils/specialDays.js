import { getHijriDate } from './hijriDate'

/**
 * MÜBAREK GÜN VE GECELER (Faz 5 — FR-UX-04)
 *
 * Hicrî tarih tarayıcının Ümmü'l-Kurâ takviminden gelir. Diyanet takvimi
 * bazı aylarda 1 gün farklı başlayabilir (ör. Ramazan 2026: ÜK 18 Şubat,
 * Diyanet 19 Şubat). Bu yüzden arayüz tarihleri "yaklaşık" diye sunar.
 *
 * Kandiller GECE idrak edilir: kandil, hicrî günün ÖNCEKİ akşamıdır
 * (ör. Miraç = 26→27 Recep gecesi → hicrî 26 Recep'in akşamı).
 */
export const SPECIAL_DAYS = [
  { id: 'hicri-yilbasi', name: 'Hicrî Yılbaşı', month: 1, day: 1, kind: 'gun' },
  { id: 'asure', name: 'Aşure Günü', month: 1, day: 10, kind: 'gun' },
  { id: 'mevlid', name: 'Mevlid Kandili', month: 3, day: 12, kind: 'kandil' },
  { id: 'regaip', name: 'Regaip Kandili', kind: 'kandil', rule: 'regaip' },
  { id: 'mirac', name: 'Miraç Kandili', month: 7, day: 27, kind: 'kandil' },
  { id: 'berat', name: 'Berat Kandili', month: 8, day: 15, kind: 'kandil' },
  { id: 'ramazan', name: 'Ramazan', month: 9, day: 1, kind: 'gun', label: 'Ramazan başlangıcı' },
  { id: 'kadir', name: 'Kadir Gecesi', month: 9, day: 27, kind: 'kandil' },
  { id: 'ramazan-bayrami', name: 'Ramazan Bayramı', month: 10, day: 1, kind: 'gun' },
  { id: 'arefe', name: 'Kurban Bayramı Arifesi', month: 12, day: 9, kind: 'gun' },
  { id: 'kurban-bayrami', name: 'Kurban Bayramı', month: 12, day: 10, kind: 'gun' }
]

const DAY = 24 * 60 * 60 * 1000
const atNoon = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12)

/**
 * `from` gününden itibaren `horizonDays` içindeki özel günler.
 * @returns {Array<{id,name,kind,date:Date,daysLeft:number}>} tarih sırasıyla.
 *   kandil için `date` = kandil AKŞAMININ miladî günü.
 */
export function upcomingSpecialDays(from = new Date(), horizonDays = 400, hijriOf = getHijriDate) {
  const start = atNoon(from)
  const out = []
  // Kandil akşamı = ertesi günün hicrî tarihi eşleşir → bir gün ileriden tara
  for (let i = 0; i <= horizonDays; i++) {
    const g = addDays(start, i) // miladî gün
    const h = hijriOf(g)
    const hNext = hijriOf(addDays(g, 1))
    if (!h || !hNext) continue
    for (const s of SPECIAL_DAYS) {
      let hit = false
      if (s.rule === 'regaip') {
        // Recep'in ilk Cuma'sından önceki gece (Perşembe akşamı)
        const next = addDays(g, 1)
        hit = next.getDay() === 5 && hNext.month === 7 && hNext.day <= 7
      } else if (s.kind === 'kandil') {
        hit = hNext.month === s.month && hNext.day === s.day
      } else {
        hit = h.month === s.month && h.day === s.day
      }
      if (hit) {
        out.push({
          id: s.id,
          name: s.label || s.name,
          kind: s.kind,
          date: g,
          daysLeft: Math.round((g - start) / DAY)
        })
      }
    }
  }
  return out
}

/** Arayüz metni: "Bu gece Berat Kandili", "Yarın …", "Ramazan Bayramı'na 12 gün". */
export function specialDayText(item) {
  if (!item) return null
  const { name, kind, daysLeft } = item
  if (daysLeft === 0) return kind === 'kandil' ? `Bu gece ${name}` : `Bugün ${name}`
  if (daysLeft === 1) return kind === 'kandil' ? `Yarın gece ${name}` : `Yarın ${name}`
  return `${name}${dativeSuffix(name)} ${daysLeft} gün`
}

/** Türkçe yönelme eki (Kandili'ne, Bayramı'na, Gecesi'ne, Ramazan'a, Günü'ne…). */
export function dativeSuffix(word) {
  const vowels = 'aeıioöuü'
  const lower = word.toLocaleLowerCase('tr')
  const last = lower[lower.length - 1]
  let lastVowel = ''
  for (let i = lower.length - 1; i >= 0; i--) {
    if (vowels.includes(lower[i])) {
      lastVowel = lower[i]
      break
    }
  }
  const back = 'aıou'.includes(lastVowel)
  const e = back ? 'a' : 'e'
  return vowels.includes(last) ? `'n${e}` : `'${e}`
}
