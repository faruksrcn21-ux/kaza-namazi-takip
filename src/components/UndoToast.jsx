import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Undo2, X } from 'lucide-react'

const TOAST_DURATION = 5000

/**
 * Ekranın en altında sabit duran, sayfayı kaydırsan da görünür kalan
 * sade ve şık Geri Al (Undo) bildirimi.
 * Geri sayım çizgisi yeşilden mora doğru akar (yeşil ↔ mor sentezi).
 */
export default function UndoToast({ action, onUndo, onExpire }) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)

  const dismiss = useCallback(
    (isUndo) => {
      setExiting(true)
      if (timerRef.current) clearTimeout(timerRef.current)

      setTimeout(() => {
        setExiting(false)
        if (isUndo) {
          onUndo?.()
        } else {
          onExpire?.()
        }
      }, 200)
    },
    [onUndo, onExpire]
  )

  useEffect(() => {
    if (!action) return

    setExiting(false)
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      dismiss(false)
    }, TOAST_DURATION)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [action, dismiss])

  if (!action) return null

  const directionText = action.delta > 0 ? `+${action.delta}` : `${action.delta}`

  const toastContent = (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '1rem',
        right: '1rem',
        bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          maxWidth: '24rem',
          width: '100%'
        }}
        className={`relative overflow-hidden rounded-xl bg-surface-900/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/80 transition-all duration-200 ease-out transform ${
          exiting
            ? 'opacity-0 translate-y-3 scale-95'
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* Sade ve net bilgi yazısı — cırtlak renkler yok */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-zinc-100 text-sm whitespace-nowrap">
              {action.prayerName}
            </span>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${
                action.delta > 0
                  ? 'bg-primary-500/15 border-primary-500/25 text-primary-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
            >
              {directionText}
            </span>
            <span className="text-xs text-zinc-400 truncate">güncellendi</span>
          </div>

          {/* Aksiyon butonları */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Geri Al butonu — sade, net ve şık */}
            <button
              type="button"
              onClick={() => dismiss(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 text-zinc-100 text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Undo2 size={13} className="text-zinc-300" />
              <span>Geri Al</span>
            </button>

            {/* Kapat butonu */}
            <button
              type="button"
              onClick={() => dismiss(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
              aria-label="Kapat"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Yeşilden mora akan geri sayım süresi çizgisi */}
        <div className="h-[2.5px] w-full bg-white/[0.06] overflow-hidden">
          <div
            key={action.id || action.timestamp}
            className="h-full animate-countdown-color"
          />
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(toastContent, document.body)
  }

  return toastContent
}
