import { useState } from 'react'
import { UserRound } from 'lucide-react'
import BirthDateForm from './BirthDateForm'
import { formatBirthDate } from '../utils/birthDateInput'

/** Ayarlar → Profil: doğum tarihini sonradan ekle / değiştir (K-36). */
export default function ProfileSettings({ profile, onBirthDateChange }) {
  const [editing, setEditing] = useState(false)
  const birthDate = profile?.birthDate || ''

  return (
    <section className="rounded-2xl islamic-card p-4 border border-white/[0.06]" data-testid="profile-settings">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 border border-accent-500/25">
          <UserRound size={16} className="text-accent-300" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-zinc-100">Profil</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">Doğum günü tebriği ve yaş bilgisi için</p>
        </div>
      </div>

      {editing ? (
        <BirthDateForm
          initial={birthDate}
          onSave={(v) => {
            onBirthDateChange(v)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-300">
            Doğum tarihi:{' '}
            <strong className="text-zinc-100" data-testid="profile-birthdate">
              {birthDate ? formatBirthDate(birthDate) : 'Girilmedi'}
            </strong>
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 px-3.5 rounded-xl bg-accent-500/15 border border-accent-400/30 text-accent-100 text-xs font-bold hover:bg-accent-500/25 transition-all"
          >
            {birthDate ? 'Değiştir' : 'Ekle'}
          </button>
        </div>
      )}
      <p className="mt-2 text-[11px] text-zinc-400">Kaza borcu hesabını değiştirmez.</p>
    </section>
  )
}
