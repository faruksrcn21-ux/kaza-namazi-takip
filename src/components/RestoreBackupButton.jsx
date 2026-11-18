import { useRef, useState } from 'react'
import { Upload, X, ShieldAlert, AlertTriangle } from 'lucide-react'
import { parseBackup, restoreBackup } from '../utils/backup'

const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString('tr-TR') : '0')
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * "Yedekten geri yükle" — dosya seç → doğrula → özet + onay → yaz → yeniden yükle.
 * Ayarlar'da (variant="panel") ve kurulum ekranında (variant="link") kullanılır.
 * Geçersiz dosyada hiçbir veri değişmez (UC-03 kabul ölçütü).
 */
export default function RestoreBackupButton({ variant = 'panel' }) {
  const inputRef = useRef(null)
  const [pending, setPending] = useState(null) // { backup, summary }
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const pick = () => {
    setError('')
    inputRef.current?.click()
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // aynı dosya tekrar seçilebilsin
    if (!file) return
    try {
      const text = await file.text()
      const result = parseBackup(text)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPending(result)
    } catch {
      setError('Dosya okunamadı.')
    }
  }

  const confirm = () => {
    if (!pending) return
    setBusy(true)
    try {
      restoreBackup(window.localStorage, pending.backup)
      // Hook'lar veriyi açılışta okur → temiz başlangıç için yeniden yükle
      window.location.reload()
    } catch {
      setBusy(false)
      setPending(null)
      setError('Geri yükleme sırasında depolama hatası oluştu. Verine dokunulmadı.')
    }
  }

  const s = pending?.summary

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFile}
        data-testid="restore-input"
      />

      {variant === 'link' ? (
        <button
          type="button"
          onClick={pick}
          className="mx-auto mt-6 flex items-center gap-2 text-xs font-semibold text-accent-300/90 hover:text-accent-200 transition-colors"
        >
          <Upload size={14} />
          Yedeğin var mı? Yedekten geri yükle
        </button>
      ) : (
        <button
          type="button"
          onClick={pick}
          className="flex flex-1 items-center justify-center gap-2 h-11 rounded-xl bg-accent-500/10 border border-accent-400/25 text-accent-200 text-xs font-bold hover:bg-accent-500/[0.18] active:scale-[0.98] transition-all"
        >
          <Upload size={15} />
          Geri yükle
        </button>
      )}

      {error && (
        <p
          role="alert"
          className={`flex items-start gap-1.5 text-[11px] text-rose-300 leading-relaxed ${
            variant === 'link' ? 'justify-center mt-2 text-center' : 'basis-full mt-1'
          }`}
        >
          <AlertTriangle size={13} className="shrink-0 mt-px" />
          {error}
        </p>
      )}

      {pending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-fade-in"
          onClick={() => !busy && setPending(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
            className="w-full max-w-sm rounded-2xl islamic-card-violet p-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 border border-accent-400/30">
                  <Upload size={17} className="text-accent-300" />
                </div>
                <h2 id="restore-title" className="font-bold text-zinc-100">
                  Yedeği geri yükle
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={busy}
                aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-surface-800 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <dl className="rounded-xl bg-surface-950/50 border border-white/[0.06] divide-y divide-white/[0.05] text-xs mb-4">
              {[
                ['Yedek tarihi', fmtDate(s.exportedAt)],
                ['Kalan borç', `${fmt(s.totalRemaining)} vakit`],
                ['Başlangıç borcu', `${fmt(s.initialTotal)} vakit`],
                [
                  'Geçmiş',
                  s.dayCount
                    ? `${fmt(s.dayCount)} gün · ${fmtDate(s.firstDay)} – ${fmtDate(s.lastDay)}`
                    : 'Kayıt yok'
                ],
                ['Konum', s.locationName || 'Seçilmemiş']
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 px-3 py-2">
                  <dt className="text-zinc-400 shrink-0">{k}</dt>
                  <dd className="text-zinc-100 font-semibold text-right">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="flex items-start gap-2 text-[11px] text-zinc-300 leading-relaxed mb-5">
              <ShieldAlert size={14} className="shrink-0 mt-px text-accent-300" />
              <span>
                Bu cihazdaki mevcut sayaçların, geçmişin ve ayarların{' '}
                <strong className="text-zinc-100">bu yedekle değiştirilecek</strong>.
              </span>
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={busy}
                className="flex-1 h-11 rounded-xl bg-surface-800 border border-white/[0.06] text-zinc-300 font-semibold hover:bg-surface-750 transition-colors text-sm"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className="flex-1 h-11 rounded-xl btn-brand-gradient font-bold active:scale-[0.98] transition-all text-sm disabled:opacity-60"
              >
                {busy ? 'Yükleniyor…' : 'Geri yükle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
