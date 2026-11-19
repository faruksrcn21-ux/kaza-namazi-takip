import { useState, useEffect } from 'react'
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react'
import { STORAGE_KEY_INSTALL_DISMISSED } from '../constants/storage'

const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000
const wasDismissedRecently = () => {
  try {
    const at = Number(window.localStorage.getItem(STORAGE_KEY_INSTALL_DISMISSED))
    return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_MS
  } catch {
    return false
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(wasDismissedRecently)

  useEffect(() => {
    // Zaten standalone (uygulama olarak) açılmışsa gizle
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true)
      return
    }

    // iOS algılama
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)

    // Android / Chrome için beforeinstallprompt olayı
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  if (isInstalled || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY_INSTALL_DISMISSED, String(Date.now()))
    } catch {
      /* yalnız bu oturumda gizlenir */
    }
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      // Prompt desteklenmiyorsa veya iOS ise rehber modalı aç
      setShowModal(true)
    }
  }

  return (
    <>
      {/* Üstte veya Altta Şık İndirme Butonu Banner'ı */}
      <div className="mb-5 rounded-2xl islamic-card-emerald p-3.5 border border-primary-500/30 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-500/20 border border-primary-400/30">
            <Smartphone size={20} className="text-primary-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-100">Telefona Uygulama Olarak Yükle</p>
            <p className="text-[11px] text-primary-100/90">Ana ekrana ekle, internetsiz kullan</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl font-bold text-xs btn-brand-gradient shrink-0 active:scale-95 transition-all shadow-md"
        >
          <Download size={14} />
          Yükle
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Yükleme önerisini kapat"
          className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Yükleme Rehberi Modalı (iOS / Manuel Chrome) */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl islamic-card p-5 border border-accent-500/30 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-accent-400" />
                <h3 className="font-bold text-zinc-100 text-sm">Telefona Nasıl Kurulur?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-surface-800"
              >
                <X size={16} />
              </button>
            </div>

            {isIOS ? (
              /* iPhone Adımları */
              <div className="space-y-3 text-xs text-zinc-300 py-1">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-300 font-bold text-[10px]">1</span>
                  <p>Ekranın altındaki <Share2 size={13} className="inline text-accent-300 mx-0.5" /> <b>Paylaş</b> simgesine dokunun.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-300 font-bold text-[10px]">2</span>
                  <p>Açılan listeden <PlusSquare size={13} className="inline text-accent-300 mx-0.5" /> <b>Ana Ekrana Ekle</b> seçeneğini seçin.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-300 font-bold text-[10px]">3</span>
                  <p>Sağ üstteki <b>Ekle</b> butonuna basın. Uygulama ikonunuz ana ekrana eklenecektir!</p>
                </div>
              </div>
            ) : (
              /* Android / Chrome Adımları */
              <div className="space-y-3 text-xs text-zinc-300 py-1">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-300 font-bold text-[10px]">1</span>
                  <p>Chrome sağ üst köşesindeki <b>üç nokta (⋮)</b> menüsüne dokunun.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-300 font-bold text-[10px]">2</span>
                  <p>Menüden <b>"Uygulamayı Yükle"</b> veya <b>"Ana Ekrana Ekle"</b> seçeneğine basın.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-300 font-bold text-[10px]">3</span>
                  <p>Çıkan onaya <b>Yükle</b> deyin. Uygulama telefonunuza yüklenecektir!</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full mt-4 h-10 rounded-xl bg-surface-800 text-zinc-300 font-semibold hover:bg-surface-750 text-xs"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  )
}
