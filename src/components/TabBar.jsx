import { BarChart3, Settings, ListChecks } from 'lucide-react'

/**
 * Alt tab bar — 3 sekme: Takip | Özet | Ayarlar
 * Mobil-first, sabit alt konumlu, safe-area destekli.
 */
const TABS = [
  { id: 'tracking', label: 'Takip', icon: ListChecks },
  { id: 'summary', label: 'Özet', icon: BarChart3 },
  { id: 'settings', label: 'Ayarlar', icon: Settings }
]

export default function TabBar({ activeTab, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-accent-500/15 bg-surface-950/90 backdrop-blur-xl safe-bottom"
      aria-label="Ana gezinme"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors duration-200 ${
                isActive ? 'text-accent-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span
                className={`relative flex h-8 w-14 items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-500/15 border border-accent-500/30'
                    : 'border border-transparent'
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span
                className={`text-[10px] font-bold tracking-wide ${
                  isActive ? 'text-brand-gradient' : 'text-zinc-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
