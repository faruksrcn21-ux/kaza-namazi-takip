import { Moon, Sun, MonitorSmartphone, Palette } from 'lucide-react'

const OPTIONS = [
  { id: 'system', label: 'Sistem', icon: MonitorSmartphone },
  { id: 'dark', label: 'Koyu', icon: Moon },
  { id: 'light', label: 'Açık', icon: Sun }
]

/** Ayarlar → Görünüm (Faz 5 — FR-UX-05, K-32). */
export default function ThemeSettings({ value, onChange }) {
  return (
    <section className="rounded-2xl islamic-card p-4 border border-white/[0.06]" data-testid="theme-settings">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 border border-accent-500/25">
          <Palette size={16} className="text-accent-300" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-zinc-100">Görünüm</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">Sistem: telefonun açık/koyu ayarını izler</p>
        </div>
      </div>
      <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-xl bg-surface-900/80 border border-white/[0.06] p-1">
        {OPTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            onClick={() => onChange(id)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
              value === id
                ? 'bg-accent-500/20 text-accent-100 border border-accent-400/35'
                : 'text-zinc-400 border border-transparent hover:text-zinc-200'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
