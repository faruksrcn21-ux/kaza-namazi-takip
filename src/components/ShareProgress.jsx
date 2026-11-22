import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { buildShareData, createShareImage } from '../utils/shareCard'
import { deliverFile } from '../utils/download'

/**
 * Özet → "İlerlemeni paylaş" (Faz 5 — FR-OZT-05, K-31).
 * Kart cihazda çizilir; veri yalnız kullanıcı paylaşırsa dışarı çıkar.
 */
export default function ShareProgress({ history, totalRemaining, initialTotal }) {
  const [showRemaining, setShowRemaining] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const share = async () => {
    setMsg('')
    setBusy(true)
    try {
      const blob = await createShareImage(buildShareData({ history, totalRemaining, initialTotal, showRemaining }))
      const result = await deliverFile({
        name: 'kaza-ilerlemem.jpg',
        blob,
        type: 'image/jpeg',
        preferShare: true,
        shareTitle: 'Kaza namazı ilerlemem'
      })
      if (result === 'downloaded') setMsg('İlerleme kartı indirildi.')
    } catch {
      setMsg('Kart oluşturulamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl islamic-card p-4 border border-white/[0.06]" data-testid="share-progress">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-100">İlerlemeni paylaş</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">Yüzde ve son kılınanlarla bir görsel oluşturur</p>
        </div>
        <button
          type="button"
          onClick={share}
          disabled={busy}
          className="flex shrink-0 items-center gap-2 h-10 px-4 rounded-xl btn-brand-gradient text-xs font-bold active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <Share2 size={15} />
          {busy ? 'Hazırlanıyor…' : 'Paylaş'}
        </button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showRemaining}
          onChange={(e) => setShowRemaining(e.target.checked)}
          className="h-4 w-4 rounded accent-violet-500"
        />
        Kalan borç sayısını da göster
      </label>
      {msg && (
        <p className="mt-2 text-[11px] text-zinc-400" role="status">
          {msg}
        </p>
      )}
    </section>
  )
}
