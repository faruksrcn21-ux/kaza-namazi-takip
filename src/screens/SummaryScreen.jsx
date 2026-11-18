import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, CalendarClock, Sparkles } from 'lucide-react'
import BarChart from '../components/BarChart'
import {
  buildBuckets,
  buildPrayerBreakdown,
  comparePeriods,
  estimateFinish,
  formatFinishDate,
  PERIODS
} from '../utils/history'

const PERIOD_ORDER = ['day', 'week', 'month']
const fmtNum = (n) => (Number.isFinite(n) ? n.toLocaleString('tr-TR') : '0')

/**
 * Özet ekranı (Faz 1): periyot seçici + sütun grafik + dağılım +
 * karşılaştırma + tahmini bitiş. Kayıt yoksa boş-durum kartı.
 */
export default function SummaryScreen({ history, totalRemaining }) {
  const [period, setPeriod] = useState('day')
  const bucketCount = PERIODS[period].bucketCount

  const buckets = buildBuckets(history || {}, period, bucketCount)
  const breakdown = buildPrayerBreakdown(history || {}, period, bucketCount)
  const cmp = comparePeriods(history || {}, period, bucketCount)
  const finish = estimateFinish(history || {}, totalRemaining ?? 0)
  const dayCount = Object.keys(history || {}).length
  const maxRow = Math.max(1, ...breakdown.map((r) => r.toplam))

  const CmpIcon = cmp.yon === 'up' ? TrendingUp : cmp.yon === 'down' ? TrendingDown : Minus
  const cmpColor =
    cmp.yon === 'up' ? 'text-primary-300' : cmp.yon === 'down' ? 'text-rose-300' : 'text-zinc-400'
  const cmpText =
    cmp.yuzde === null
      ? 'Karşılaştırma için veri yok'
      : cmp.fark === 0
        ? 'Önceki dönemle aynı'
        : `Önceki döneme göre ${cmp.fark > 0 ? '+' : ''}${fmtNum(cmp.fark)} (%${cmp.yuzde})`

  return (
    <div className="pt-5 pb-4">
      <header className="text-center mb-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/10 border border-accent-500/30 mb-3">
          <BarChart3 size={22} className="text-accent-300" />
        </div>
        <h1 className="text-xl font-black text-brand-gradient tracking-tight">Özet</h1>
        <p className="text-xs text-zinc-400 mt-1">Kaza ilerlemenin dönemsel görünümü</p>
      </header>

      {dayCount === 0 ? (
        <div className="rounded-2xl islamic-card p-5 border border-accent-500/20 text-center">
          <Sparkles size={20} className="mx-auto text-accent-400 mb-3" />
          <p className="text-sm font-bold text-zinc-200">Henüz kayıt yok</p>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Sayaçları değiştirdikçe geçmiş burada birikir; grafikler otomatik oluşur.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            role="tablist"
            aria-label="Dönem seçimi"
            className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-900/80 border border-white/[0.06] p-1"
          >
            {PERIOD_ORDER.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={`rounded-xl px-2 py-2 text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-accent-500/20 text-accent-100 border border-accent-400/35 shadow-sm shadow-accent-950/50'
                    : 'text-zinc-400 border border-transparent hover:text-zinc-200'
                }`}
              >
                {PERIODS[p].label}
                <span className="block text-[10px] font-medium opacity-70">
                  {PERIODS[p].bucketCount} {p === 'day' ? 'gün' : p === 'week' ? 'hafta' : 'ay'}
                </span>
              </button>
            ))}
          </div>

          <section
            aria-label="Dönem grafiği"
            className="rounded-2xl islamic-card p-4 border border-white/[0.06]"
          >
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-sm font-bold text-zinc-100">{PERIODS[period].label} görünüm</h2>
              <span className="text-[11px] text-zinc-400">
                Toplam{' '}
                <strong className="text-zinc-100">
                  {fmtNum(buckets.reduce((s, b) => s + (b.toplam || 0), 0))}
                </strong>
              </span>
            </div>
            <BarChart data={buckets} />
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl islamic-card p-4 border border-white/[0.06]">
              <div className={`flex items-center gap-1.5 ${cmpColor}`}>
                <CmpIcon size={15} />
                <h2 className="text-[11px] font-bold uppercase tracking-wide">Karşılaştırma</h2>
              </div>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{cmpText}</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Bu dönem {fmtNum(cmp.simdiki)} · Önceki {fmtNum(cmp.onceki)}
              </p>
            </div>
            <div className="rounded-2xl islamic-card p-4 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-accent-300">
                <CalendarClock size={15} />
                <h2 className="text-[11px] font-bold uppercase tracking-wide">Tahmini bitiş</h2>
              </div>
              {finish ? (
                <>
                  <p className="text-sm font-black text-zinc-100 mt-2">
                    {formatFinishDate(finish.tarih)}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Günlük ~{finish.gunlukHiz.toFixed(1)} hızla {fmtNum(finish.gunSayisi)} gün
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    En iyi gün: {fmtNum(finish.enIyiGun)}
                  </p>
                </>
              ) : (
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {(totalRemaining ?? 0) <= 0
                    ? 'Borç kalmadı — elhamdülillah 🎉'
                    : 'Tahmin için son 7 günde kayıt gerekli'}
                </p>
              )}
            </div>
          </section>

          <section
            aria-label="Vakit dağılımı"
            className="rounded-2xl islamic-card p-4 border border-white/[0.06]"
          >
            <h2 className="text-sm font-bold text-zinc-100 mb-1">Vakit dağılımı</h2>
            <p className="text-[11px] text-zinc-500 mb-3">
              {dayCount} günlük kayıt toplandı · seçili dönem
            </p>
            <ul className="space-y-2.5">
              {breakdown.map((row) => (
                <li key={row.id}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="font-semibold text-zinc-200">{row.name}</span>
                    <span className="text-zinc-400">
                      <strong className="text-zinc-100">{fmtNum(row.toplam)}</strong>
                      <span className="text-zinc-500"> · %{row.yuzde}</span>
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-white/[0.06] overflow-hidden"
                    role="img"
                    aria-label={`${row.name}: ${row.toplam} (%${row.yuzde})`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all"
                      style={{ width: `${maxRow > 0 ? (row.toplam / maxRow) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

