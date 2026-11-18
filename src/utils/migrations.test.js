import { describe, expect, it } from 'vitest'
import { runMigrations } from './migrations'
import {
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  STORAGE_KEY_HISTORY,
  STORAGE_KEY_MIGRATION_SNAPSHOT,
  STORAGE_KEY_SCHEMA
} from '../constants/storage'
import { MemoryStorage } from '../test/memoryStorage'

// Canlıdaki v1 kullanıcısının deposu (sürüm anahtarı YOK)
const liveV1 = () =>
  new MemoryStorage({
    [STORAGE_KEY]: JSON.stringify({ sabah: 10, ogle: 5, ikindi: 0, aksam: 0, yatsi: 0, vitir: 2 }),
    'kaza-namazi-takip-onboarding-v1': 'true'
  })

describe('runMigrations — gerçek kurallar', () => {
  it('boş depo: yeni kurulum, güncel sürüm yazılır', () => {
    const s = new MemoryStorage()
    expect(runMigrations(s).status).toBe('fresh')
    expect(s.getItem(STORAGE_KEY_SCHEMA)).toBe(String(CURRENT_SCHEMA_VERSION))
  })

  it('canlı v1 verisi (sürümsüz): veriye dokunmadan v1 olarak işaretlenir', () => {
    const s = liveV1()
    const before = s.getItem(STORAGE_KEY)
    const r = runMigrations(s)
    expect(r.status).toBe('current')
    expect(r.from).toBe(1)
    expect(s.getItem(STORAGE_KEY)).toBe(before)
    expect(s.getItem(STORAGE_KEY_SCHEMA)).toBe('1')
  })

  it('ikinci çalıştırma etkisizdir (idempotent)', () => {
    const s = liveV1()
    runMigrations(s)
    const snap = s.dump()
    expect(runMigrations(s).status).toBe('current')
    expect(s.dump()).toEqual(snap)
  })

  it('daha yeni sürüm verisine dokunulmaz', () => {
    const s = liveV1()
    s.setItem(STORAGE_KEY_SCHEMA, '99')
    const snap = s.dump()
    expect(runMigrations(s).status).toBe('newer')
    expect(s.dump()).toEqual(snap)
  })
})

describe('runMigrations — adım çerçevesi (sahte v2/v3)', () => {
  const steps = {
    2: (d) => {
      // örnek: sayaçlara yeni alan ekle
      const c = JSON.parse(d[STORAGE_KEY])
      d[STORAGE_KEY] = JSON.stringify({ ...c, nafile: 0 })
    },
    3: (d) => {
      d[STORAGE_KEY_HISTORY] = d[STORAGE_KEY_HISTORY] ?? '{}'
    }
  }

  it('adımlar sırayla çalışır, sürüm güncellenir, anlık görüntü alınır', () => {
    const s = liveV1()
    const original = s.getItem(STORAGE_KEY)
    const r = runMigrations(s, { migrations: steps, target: 3 })
    expect(r).toMatchObject({ status: 'migrated', from: 1, to: 3 })
    expect(JSON.parse(s.getItem(STORAGE_KEY)).nafile).toBe(0)
    expect(s.getItem(STORAGE_KEY_HISTORY)).toBe('{}')
    expect(s.getItem(STORAGE_KEY_SCHEMA)).toBe('3')
    const snap = JSON.parse(s.getItem(STORAGE_KEY_MIGRATION_SNAPSHOT))
    expect(snap.version).toBe(1)
    expect(snap.data[STORAGE_KEY]).toBe(original)
  })

  it('bir adım hata verirse depoya HİÇBİR şey yazılmaz', () => {
    const s = liveV1()
    const snap = s.dump()
    const bad = { ...steps, 3: () => { throw new Error('bozuk adım') } }
    const r = runMigrations(s, { migrations: bad, target: 3 })
    expect(r.status).toBe('failed')
    expect(r.error).toContain('bozuk adım')
    expect(s.dump()).toEqual(snap)
  })

  it('eksik adım = başarısız, veri korunur', () => {
    const s = liveV1()
    const snap = s.dump()
    expect(runMigrations(s, { migrations: { 2: steps[2] }, target: 3 }).status).toBe('failed')
    expect(s.dump()).toEqual(snap)
  })

  it('yazma yarıda kalırsa (kota) eski değerlere geri döner', () => {
    const s = liveV1()
    const original = s.getItem(STORAGE_KEY)
    s.failOnSetFor = STORAGE_KEY_SCHEMA // veri yazıldıktan sonra sürüm yazımı patlar
    const r = runMigrations(s, { migrations: steps, target: 3 })
    expect(r.status).toBe('failed')
    expect(s.getItem(STORAGE_KEY)).toBe(original)
    expect(s.getItem(STORAGE_KEY_HISTORY)).toBeNull()
  })
})
