/** Testler için bellek içi localStorage taklidi (jsdom gerektirmez). */
export class MemoryStorage {
  constructor(initial = {}) {
    this.map = new Map(Object.entries(initial))
    this.failOnSetFor = null // bu anahtara yazarken hata fırlat (hata senaryoları)
  }
  get length() {
    return this.map.size
  }
  key(i) {
    return [...this.map.keys()][i] ?? null
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null
  }
  setItem(k, v) {
    if (this.failOnSetFor === k) throw new Error('QuotaExceededError')
    this.map.set(k, String(v))
  }
  removeItem(k) {
    this.map.delete(k)
  }
  clear() {
    this.map.clear()
  }
  dump() {
    return Object.fromEntries(this.map)
  }
}
