import { describe, expect, it } from 'vitest'
import {
  backupFileName,
  createBackup,
  getLastBackupAt,
  markBackupDone,
  parseBackup,
  restoreBackup
} from './backup'
import {
  STORAGE_KEY,
  STORAGE_KEY_HISTORY,
  STORAGE_KEY_INITIAL_TOTAL,
  STORAGE_KEY_LOCATION,
  STORAGE_KEY_ONBOARDING,
  STORAGE_KEY_PRAYER_OFFSETS,
  STORAGE_KEY_PROFILE,
  STORAGE_KEY_SCHEMA
} from '../constants/storage'
import { MemoryStorage } from '../test/memoryStorage'

const counts = { sabah: 120, ogle: 100, ikindi: 90, aksam: 80, yatsi: 70, vitir: 60 }
const day = (date, sabah) => ({
  date,
  kaza: { sabah, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 }
})

const filledStorage = () =>
  new MemoryStorage({
    [STORAGE_KEY]: JSON.stringify(counts),
    [STORAGE_KEY_INITIAL_TOTAL]: '1000',
    [STORAGE_KEY_ONBOARDING]: 'true',
    [STORAGE_KEY_PROFILE]: JSON.stringify({ gender: 'male', birthDate: '1990-01-01' }),
    [STORAGE_KEY_HISTORY]: JSON.stringify({
      '2026-11-01': day('2026-11-01', 3),
      '2026-11-02': day('2026-11-02', 2)
    }),
    [STORAGE_KEY_LOCATION]: JSON.stringify({ source: 'city', city: 'Konya', lat: 37.87, lon: 32.48 }),
    [STORAGE_KEY_PRAYER_OFFSETS]: JSON.stringify({ sabah: 2, ogle: 0 }),
    [STORAGE_KEY_SCHEMA]: '1'
  })

const textOf = (backup) => JSON.stringify(backup)

describe('createBackup', () => {
  it('tüm alanları ve üst bilgiyi içerir', () => {
    const b = createBackup(filledStorage(), new Date('2026-11-19T10:00:00Z'))
    expect(b).toMatchObject({ app: 'kaza-namazi-takip', format: 1, schemaVersion: 1 })
    expect(b.exportedAt).toBe('2026-11-19T10:00:00.000Z')
    expect(b.data.counts).toEqual(counts)
    expect(b.data.initialTotal).toBe(1000)
    expect(b.data.location.city).toBe('Konya')
    expect(Object.keys(b.data.history)).toHaveLength(2)
  })

  it('dosya adı tarihli', () => {
    expect(backupFileName(new Date(2026, 10, 9))).toBe('kaza-namazi-yedek-2026-11-09.json')
  })
})

describe('gidiş-dönüş (UC-03: telefon değiştirme)', () => {
  it('eski cihazdaki veri yeni cihazda birebir aynı', () => {
    const oldPhone = filledStorage()
    const text = textOf(createBackup(oldPhone))

    const newPhone = new MemoryStorage()
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    restoreBackup(newPhone, parsed.backup)

    expect(JSON.parse(newPhone.getItem(STORAGE_KEY))).toEqual(counts)
    expect(JSON.parse(newPhone.getItem(STORAGE_KEY_INITIAL_TOTAL))).toBe(1000)
    expect(JSON.parse(newPhone.getItem(STORAGE_KEY_ONBOARDING))).toBe(true)
    expect(JSON.parse(newPhone.getItem(STORAGE_KEY_PROFILE)).gender).toBe('male')
    expect(JSON.parse(newPhone.getItem(STORAGE_KEY_LOCATION)).city).toBe('Konya')
    expect(JSON.parse(newPhone.getItem(STORAGE_KEY_PRAYER_OFFSETS)).sabah).toBe(2)
    const h = JSON.parse(newPhone.getItem(STORAGE_KEY_HISTORY))
    expect(h['2026-11-01'].kaza.sabah).toBe(3)
    expect(newPhone.getItem(STORAGE_KEY_SCHEMA)).toBe('1')
  })

  it('özet doğru', () => {
    const { summary } = parseBackup(textOf(createBackup(filledStorage())))
    expect(summary).toMatchObject({
      totalRemaining: 520,
      initialTotal: 1000,
      dayCount: 2,
      firstDay: '2026-11-01',
      lastDay: '2026-11-02',
      totalPrayed: 5,
      locationName: 'Konya'
    })
  })

  it('yedekte olmayan alan hedef cihazda temizlenir (eski ayar kalmaz)', () => {
    const src = filledStorage()
    src.removeItem(STORAGE_KEY_LOCATION)
    const target = filledStorage()
    restoreBackup(target, parseBackup(textOf(createBackup(src))).backup)
    expect(target.getItem(STORAGE_KEY_LOCATION)).toBeNull()
  })
})

describe('parseBackup — geçersiz dosyalar reddedilir', () => {
  const valid = () => createBackup(filledStorage())
  const cases = [
    ['boş metin', ''],
    ['JSON değil', 'merhaba'],
    ['başka uygulama', JSON.stringify({ ...valid(), app: 'baska' })],
    ['bilinmeyen biçim', JSON.stringify({ ...valid(), format: 2 })],
    ['daha yeni şema', JSON.stringify({ ...valid(), schemaVersion: 99 })],
    ['veri yok', JSON.stringify({ ...valid(), data: null })],
    ['sayaç yok', JSON.stringify({ ...valid(), data: { ...valid().data, counts: null } })],
    ['negatif sayaç', JSON.stringify({ ...valid(), data: { ...valid().data, counts: { ...counts, sabah: -5 } } })],
    ['metin sayaç', JSON.stringify({ ...valid(), data: { ...valid().data, counts: { ...counts, ogle: '12' } } })],
    ['bozuk konum', JSON.stringify({ ...valid(), data: { ...valid().data, location: { city: 'X' } } })],
    ['bozuk geçmiş', JSON.stringify({ ...valid(), data: { ...valid().data, history: [1, 2] } })]
  ]
  it.each(cases)('%s', (_, text) => {
    const r = parseBackup(text)
    expect(r.ok).toBe(false)
    expect(typeof r.error).toBe('string')
  })

  it('reddedilen dosya depoya hiçbir şey yazmaz (akış: parse → onay → restore)', () => {
    const s = filledStorage()
    const snap = s.dump()
    const r = parseBackup('{"app":"kaza-namazi-takip"}')
    expect(r.ok).toBe(false)
    expect(s.dump()).toEqual(snap)
  })

  it('eksik isteğe bağlı alanlar tolere edilir', () => {
    const minimal = { app: 'kaza-namazi-takip', format: 1, schemaVersion: 1, data: { counts: { sabah: 5 } } }
    const r = parseBackup(JSON.stringify(minimal))
    expect(r.ok).toBe(true)
    expect(r.backup.data.counts).toEqual({ sabah: 5, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 })
    expect(r.backup.data.history).toEqual({})
    expect(r.backup.data.onboardingDone).toBe(true)
  })
})

describe('bildirim ayarları (Faz 3)', () => {
  it('yedekle taşınır ve normalize edilir', () => {
    const s = filledStorage()
    s.setItem('kaza-namazi-takip-bildirim-v1', JSON.stringify({ enabled: true, leadMinutes: 10, targets: { teheccud: true } }))
    const r = parseBackup(textOf(createBackup(s)))
    expect(r.ok).toBe(true)
    expect(r.backup.data.reminders).toMatchObject({ enabled: true, leadMinutes: 10 })
    expect(r.backup.data.reminders.targets).toMatchObject({ teheccud: true, sabah: true })
    const target = new MemoryStorage()
    restoreBackup(target, r.backup)
    expect(JSON.parse(target.getItem('kaza-namazi-takip-bildirim-v1')).leadMinutes).toBe(10)
  })
  it('eski yedek (alan yok) kabul edilir', () => {
    const b = createBackup(filledStorage())
    delete b.data.reminders
    expect(parseBackup(textOf(b)).ok).toBe(true)
  })
  it('bozuk alan reddedilir', () => {
    const b = createBackup(filledStorage())
    b.data.reminders = 'acik'
    expect(parseBackup(textOf(b)).ok).toBe(false)
  })
})

describe('son yedek zamanı', () => {
  it('kaydedilir ve okunur', () => {
    const s = new MemoryStorage()
    expect(getLastBackupAt(s)).toBeNull()
    markBackupDone(s, new Date('2026-11-19T08:00:00Z'))
    expect(getLastBackupAt(s)).toBe('2026-11-19T08:00:00.000Z')
  })
})
