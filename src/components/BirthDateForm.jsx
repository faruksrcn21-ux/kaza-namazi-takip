import { useId, useState } from 'react'
import { validateBirthDate } from '../utils/birthDateInput'

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Doğum tarihi girişi (Takip ekranı sorusu + Ayarlar → Profil ortak). K-36 */
export default function BirthDateForm({ initial = '', onSave, onCancel, saveLabel = 'Kaydet' }) {
  const id = useId()
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const r = validateBirthDate(value)
    if (!r.ok) {
      setError(r.error)
      return
    }
    setError('')
    onSave(r.value)
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2" data-testid="birthdate-form">
      <label htmlFor={id} className="block text-[11px] font-semibold text-zinc-300">
        Doğum tarihi
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="date"
          value={value}
          max={todayIso()}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-0 h-10 rounded-xl bg-surface-900/80 border border-white/[0.1] px-3 text-sm text-zinc-100 focus:outline-none focus:border-accent-400/60"
          aria-invalid={!!error}
        />
        <button
          type="submit"
          className="h-10 px-4 rounded-xl btn-brand-gradient text-xs font-bold active:scale-[0.98] transition-all"
        >
          {saveLabel}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-[11px] text-rose-300">
          {error}
        </p>
      )}
      {onCancel && (
        <button type="button" onClick={onCancel} className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200">
          Vazgeç
        </button>
      )}
    </form>
  )
}
