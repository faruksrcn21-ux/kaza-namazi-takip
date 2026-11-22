import { useState } from 'react'
import { Trash2, X, AlertTriangle } from 'lucide-react'

export default function ResetButton({ onConfirm }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Sıfırlama tetikleme butonu */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/[0.06] text-zinc-400 text-xs font-semibold hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-950/20 transition-all duration-200"
        aria-label="Tüm verileri sıfırla"
      >
        <Trash2 size={14} />
        Tüm verileri ve geçmişi sıfırla
      </button>

      {/* Onay modalı */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl islamic-card p-5 border border-rose-500/30 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Başlık */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30">
                  <AlertTriangle size={17} className="text-rose-400" />
                </div>
                <h2 className="font-bold text-zinc-100">Sıfırlama Onayı</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-surface-800 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Açıklama */}
            <p className="text-xs text-zinc-300 mb-2 leading-relaxed">
              Şunlar kalıcı olarak silinecek:
            </p>
            <ul className="text-xs text-zinc-300 mb-3 space-y-1 list-disc pl-5 marker:text-rose-400">
              <li>Kaza sayaçları ve başlangıç borcu</li>
              <li>Günlük ilerleme geçmişi</li>
              <li>Profil ve hesaplama bilgileri (cinsiyet, doğum tarihi vb.)</li>
            </ul>
            <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
              Konum ve vakit ayarların korunur.
            </p>
            <p className="text-xs text-zinc-300 mb-5 leading-relaxed">
              Silmeden önce <strong className="text-zinc-100">Yedeği indir</strong> ile yedek almanı öneririz.
              <span className="text-rose-400 font-semibold"> Bu işlem geri alınamaz.</span>
            </p>

            {/* Butonlar */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 h-11 rounded-xl bg-surface-800 border border-white/[0.06] text-zinc-300 font-semibold hover:bg-surface-750 transition-colors text-sm"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm()
                  setOpen(false)
                }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-[#fff] font-bold active:scale-[0.98] transition-all hover:brightness-110 text-sm shadow-md shadow-rose-900/30"
              >
                Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
