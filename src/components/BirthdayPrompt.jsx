import { useState } from 'react'
import { Cake } from 'lucide-react'
import BirthDateForm from './BirthDateForm'
import { STORAGE_KEY_BIRTHDATE_PROMPT_OFF } from '../constants/storage'

const isOff = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY_BIRTHDATE_PROMPT_OFF) === '1'
  } catch {
    return false
  }
}

/**
 * Takip ekranı: doğum tarihi girilmemişse nazikçe sorar (K-36).
 * "Sorma" bu cihazda bir daha göstermez; Ayarlar → Profil'den her zaman eklenebilir.
 */
export default function BirthdayPrompt({ onSave }) {
  const [hidden, setHidden] = useState(isOff)
  const [open, setOpen] = useState(false)
  if (hidden) return null

  const never = () => {
    setHidden(true)
    try {
      window.localStorage.setItem(STORAGE_KEY_BIRTHDATE_PROMPT_OFF, '1')
    } catch {
      /* yalnız bu oturumda gizlenir */
    }
  }

  return (
    <section
      aria-label="Doğum tarihi ekle"
      data-testid="birthday-prompt"
      className="mb-5 rounded-2xl islamic-card p-4 border border-accent-500/15"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 border border-accent-500/25">
          <Cake size={16} className="text-accent-300" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-100">Doğum tarihini ekle</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
            Miladî ve Hicrî yaşını gör, doğum gününde tebrik al. Borç hesabını değiştirmez.
          </p>
        </div>
      </div>

      {open ? (
        <div className="mt-3">
          <BirthDateForm onSave={onSave} onCancel={() => setOpen(false)} />
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 h-9 rounded-xl bg-accent-500/15 border border-accent-400/30 text-accent-100 text-xs font-bold hover:bg-accent-500/25 transition-all"
          >
            Ekle
          </button>
          <button
            type="button"
            onClick={never}
            className="h-9 px-4 rounded-xl text-zinc-400 text-xs font-semibold hover:text-zinc-200 border border-white/[0.08]"
          >
            Sorma
          </button>
        </div>
      )}
    </section>
  )
}
