import { useId } from 'react'

const W = 360
const H = 196
const PAD_L = 10
const PAD_R = 10
const PAD_T = 16
const PAD_B = 28

/**
 * El yapımı SVG sütun grafiği — bağımlılık yok, offline, tema uyumlu.
 * Her sütun o dönemin TOPLAM kılınan kazasını tek renkte gösterir
 * (zümrüt yeşili). Normal kaza ve toplu eklenen ayrımı YOKTUR (K-15).
 */
export default function BarChart({ data }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const buckets = Array.isArray(data) ? data : []
  const max = Math.max(1, ...buckets.map((b) => b.toplam || 0))
  const n = Math.max(1, buckets.length)
  const plotH = H - PAD_T - PAD_B
  const base = H - PAD_B
  const colW = (W - PAD_L - PAD_R) / n
  const barW = Math.min(30, Math.max(8, colW * 0.52))
  const allZero = buckets.every((b) => (b.toplam || 0) === 0)

  const summary = buckets.map((b) => `${b.label}: ${b.toplam || 0}`).join(', ')

  return (
    <div data-testid="bar-chart-wrap" className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Kaza grafiği. ${summary}`}
        data-testid="bar-chart"
      >
        <defs>
          <linearGradient id={`kaza-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Yatay ızgara çizgileri */}
        {[0, 0.5, 1].map((f) => {
          const y = base - plotH * f
          const val = Math.round(max * f)
          return (
            <g key={f}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <text x={W - PAD_R} y={y - 3} textAnchor="end" fontSize="8" fill="#71717a">
                {val}
              </text>
            </g>
          )
        })}

        {allZero && (
          <text x={W / 2} y={base - plotH / 2} textAnchor="middle" fontSize="11" fill="#52525b">
            Bu dönemde kayıt yok
          </text>
        )}

        {buckets.map((b, i) => {
          const toplam = b.toplam || 0
          const barH = (toplam / max) * plotH
          const x = PAD_L + i * colW + (colW - barW) / 2
          const isLast = i === buckets.length - 1
          const barY = base - barH
          return (
            <g key={b.key} data-bar={b.key}>
              <title>{`${b.label}: ${toplam} kılınan kaza`}</title>
              {toplam > 0 && (
                <>
                  <rect
                    x={x}
                    y={barY}
                    width={barW}
                    height={Math.max(0, barH)}
                    fill={`url(#kaza-${gid})`}
                    rx={4}
                  />
                  {isLast && (
                    <rect
                      x={x - 2}
                      y={barY - 2}
                      width={barW + 4}
                      height={barH + 4}
                      fill="none"
                      stroke="rgba(52,211,153,0.5)"
                      strokeWidth="1.5"
                      rx={6}
                    />
                  )}
                  <text x={x + barW / 2} y={barY - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#d4d4d8">
                    {toplam}
                  </text>
                </>
              )}
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="8.5" fill={isLast ? '#a7f3d0' : '#71717a'}>
                {b.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Lejant — tek renk: dönem toplamı */}
      <div className="flex items-center justify-center gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-primary-400 to-primary-600" />
          Kılınan kaza
        </span>
      </div>
    </div>
  )
}
