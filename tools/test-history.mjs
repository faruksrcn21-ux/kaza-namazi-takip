import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

// Node ESM, uzantısız import'ları çözemiyor. Kaynak dosyaları GEÇİCİ olarak
// uzantılı import'larla kopyalayıp oradan import ediyoruz.
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const tmp = join(root, 'node_modules', '.tmp-history-test')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

const historySrc = readFileSync(join(root, 'src/utils/history.js'), 'utf8')
  .replace("from '../constants/prayers'", "from './prayers.js'")
const prayersSrc = readFileSync(join(root, 'src/constants/prayers.js'), 'utf8')
  .replace(
    /import \{[^}]*\} from 'lucide-react'/,
    'const __mk = () => null; const Sunrise=__mk,Sun=__mk,CloudSun=__mk,Sunset=__mk,Moon=__mk,Star=__mk;'
  )

writeFileSync(join(tmp, 'history.js'), historySrc)
writeFileSync(join(tmp, 'prayers.js'), prayersSrc)

const mod = await import(pathToFileURL(join(tmp, 'history.js')).href)

const {
  todayKey,
  shiftDays,
  parseDateKey,
  buildBuckets,
  buildPrayerBreakdown,
  createEmptyDayRecord,
  normalizeHistory,
  startOfWeekKey
} = mod

let failures = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) {
    failures++
    console.log('FAIL', label, '-> got', JSON.stringify(actual), 'expected', JSON.stringify(expected))
  } else {
    console.log('ok  ', label, '->', JSON.stringify(actual))
  }
}

// 1) Tarih yardımcıları
check('todayKey format', /^\d{4}-\d{2}-\d{2}$/.test(todayKey()), true)
check('parseDateKey geçersiz', parseDateKey('abc'), null)
check('shiftDays geri', shiftDays('2026-10-19', 1), '2026-10-18')
check('shiftDays 7 gun', shiftDays('2026-10-19', 7), '2026-10-12')

// 2) Örnek geçmiş — tarihler "bugün" ve "dün"e göreli (sabit tarih kullanılmaz)
const T = todayKey()
const Y = shiftDays(T, 1)
const history = {
  [T]: {
    ...createEmptyDayRecord(T),
    kaza: { sabah: 3, ogle: 1, ikindi: 0, aksam: 2, yatsi: 0, vitir: 1 },
    bulk: { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 },
    toplamKaza: 7,
    toplamKalan: 120
  },
  [Y]: {
    ...createEmptyDayRecord(Y),
    kaza: { sabah: 5, ogle: 2, ikindi: 1, aksam: 3, yatsi: 1, vitir: 0 },
    bulk: { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 },
    toplamKaza: 12,
    toplamKalan: 130
  }
}

// 3) Normalizasyon — eksik alanlar tamamlanır
const norm = normalizeHistory({ [T]: { kaza: { sabah: 2 } } })
check('normalize eksik alan', Object.keys(norm[T].kaza).length, 6)
check('normalize toplamKaza', norm[T].toplamKaza, 2)
check('normalize bozuk gün atlanır', Object.keys(normalizeHistory({ 'bozuk': {} })).length, 0)

// 4) Günlük bucket — son 7 gün
const days = buildBuckets(history, 'day', 7)
check('gunluk bucket sayisi', days.length, 7)
check('gunluk en yeni sagda', days[6].key, T)
check('gunluk kaza degeri', days[6].kaza, 7)
check('gunluk onceki gun', days[5].kaza, 12)
check('gunluk bos gun 0', days[0].kaza, 0)

// 5) Haftalık bucket — Pazartesi başlangıçlı
const weeks = buildBuckets(history, 'week', 4)
check('haftalik bucket sayisi', weeks.length, 4)
check('haftalik pazartesi baslangic', weeks[3].key, startOfWeekKey(T))
// Bugünün haftası + geçen hafta toplamı = 19 (hafta bölmesi doğru çalışıyor)
const weekSum = weeks.reduce((s, w) => s + w.kaza, 0)
check('haftalik toplam (tum haftalar)', weekSum, 19)

// 6) Aylık bucket
const months = buildBuckets(history, 'month', 3)
check('aylik bucket sayisi', months.length, 3)
check('aylik toplam', months[2].kaza, 19)

// 7) Vakit dağılımı
const breakdown = buildPrayerBreakdown(history, 'day', 7)
check('vakit dagilimi sabah', breakdown.find((r) => r.id === 'sabah').toplam, 8)
check('vakit dagilimi toplam', breakdown.reduce((s, r) => s + r.toplam, 0), 19)
// Yüzdeler yuvarlanır — toplam 99 veya 100 olabilir
const pctSum = breakdown.reduce((s, r) => s + r.yuzde, 0)
check('vakit yuzde toplami ~100', pctSum >= 99 && pctSum <= 100, true)

// 8) Karşılaştırma + tahmini bitiş (Faz 1)
const cmp = mod.comparePeriods(history, 'day', 7)
check('karsilastirma simdiki', cmp.simdiki, 19)
check('karsilastirma yon', cmp.yon, 'up')
const est = mod.estimateFinish(history, 120)
check('tahmin var', !!est, true)
check('tahmin hiz', Math.abs(est.gunlukHiz - 19 / 7) < 0.001, true)
const estBos = mod.estimateFinish({}, 120)
check('tahmin bos gecmis null', estBos, null)
const estSifir = mod.estimateFinish(history, 0)
check('tahmin sifir borc null', estSifir, null)
check('PERIODS gun 7', mod.PERIODS.day.bucketCount, 7)
check('PERIODS hafta 4', mod.PERIODS.week.bucketCount, 4)
check('PERIODS ay 6', mod.PERIODS.month.bucketCount, 6)

console.log(failures === 0 ? '\nTUM TESTLER GECTI' : `\n${failures} TEST BASARISIZ`)
process.exit(failures === 0 ? 0 : 1)
