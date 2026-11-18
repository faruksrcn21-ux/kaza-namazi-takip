import { useState } from 'react'
import { MapPin, LocateFixed, Check, ChevronDown, PencilLine } from 'lucide-react'
import { CITIES } from '../constants/cities'

const isValidCoord = (lat, lon) =>
  Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180

/**
 * Konum seçici (Faz 1+2): 81 il listesi + GPS + manuel koordinat.
 * Seçim localStorage'da saklanır; Faz 2'de vakit hesabında kullanılır.
 */
export default function LocationPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [gpsState, setGpsState] = useState('idle') // idle | loading | ok | error
  const [gpsMsg, setGpsMsg] = useState('')
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [manualError, setManualError] = useState('')

  const selected = CITIES.find((c) => c.name === value?.city) || null

  const pickCity = (city) => {
    onChange?.({ source: 'city', city: city.name, lat: city.lat, lon: city.lon })
    setOpen(false)
  }

  const useGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsState('error')
      setGpsMsg('Bu cihazda konum servisi yok')
      return
    }
    setGpsState('loading')
    setGpsMsg('Konum alınıyor…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        onChange?.({
          source: 'gps',
          city: null,
          lat: Number(latitude.toFixed(4)),
          lon: Number(longitude.toFixed(4))
        })
        setGpsState('ok')
        setGpsMsg(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`)
      },
      (err) => {
        setGpsState('error')
        setGpsMsg(
          err.code === 1
            ? 'Konum izni verilmedi — tarayıcı ayarından açabilirsin'
            : 'Konum alınamadı, tekrar dene'
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    )
  }

  const saveManual = () => {
    const lat = Number(String(manualLat).replace(',', '.'))
    const lon = Number(String(manualLon).replace(',', '.'))
    if (!isValidCoord(lat, lon)) {
      setManualError('Geçerli aralık: enlem -90…90, boylam -180…180')
      return
    }
    setManualError('')
    onChange?.({ source: 'manual', city: null, lat, lon })
    setOpen(false)
  }

  const display =
    value?.source === 'gps'
      ? `GPS: ${value.lat}°, ${value.lon}°`
      : value?.source === 'manual'
        ? `Manuel: ${value.lat}°, ${value.lon}°`
        : selected
          ? `${selected.name} (${selected.plaka})`
          : 'Henüz seçilmedi'

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-left hover:bg-white/[0.07] transition-colors"
      >
        <MapPin size={15} className="text-accent-300 flex-shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-bold text-zinc-100 truncate">{display}</span>
          <span className="block text-[10px] text-zinc-500">Vakit hesabı için kullanılır</span>
        </span>
        <ChevronDown
          size={15}
          className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-white/[0.08] bg-surface-900 overflow-hidden">
          <button
            type="button"
            onClick={useGps}
            disabled={gpsState === 'loading'}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-primary-200 hover:bg-white/[0.05] transition-colors disabled:opacity-60"
          >
            <LocateFixed size={14} />
            {gpsState === 'loading' ? 'Konum alınıyor…' : 'GPS ile bul'}
            {gpsState === 'ok' && <Check size={13} className="text-primary-400" />}
          </button>
          {gpsMsg && gpsState !== 'idle' && (
            <p
              className={`px-3 pb-2 text-[10px] ${gpsState === 'error' ? 'text-rose-300' : 'text-zinc-400'}`}
              role={gpsState === 'error' ? 'alert' : 'status'}
            >
              {gpsMsg}
            </p>
          )}
          <div className="border-t border-white/[0.06] px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 mb-2">
              <PencilLine size={12} className="text-zinc-400" />
              Manuel koordinat
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[10px] text-zinc-500 mb-1">Enlem</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="41.0082"
                  aria-label="Enlem"
                  className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] text-zinc-500 mb-1">Boylam</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  placeholder="28.9784"
                  aria-label="Boylam"
                  className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50"
                />
              </label>
            </div>
            {manualError && (
              <p className="text-[10px] text-rose-300 mt-1.5" role="alert">
                {manualError}
              </p>
            )}
            <button
              type="button"
              onClick={saveManual}
              className="mt-2 w-full rounded-lg bg-primary-500/15 border border-primary-500/30 px-3 py-1.5 text-xs font-bold text-primary-200 hover:bg-primary-500/25 transition-colors"
            >
              Manuel konumu kaydet
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto border-t border-white/[0.06]">
            {CITIES.map((city) => {
              const active = selected?.name === city.name && value?.source !== 'gps' && value?.source !== 'manual'
              return (
                <button
                  key={city.plaka}
                  type="button"
                  onClick={() => pickCity(city)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    active ? 'bg-primary-500/15 text-primary-200 font-bold' : 'text-zinc-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-zinc-500 font-mono w-6">{city.plaka}</span>
                  <span className="flex-1 text-left">{city.name}</span>
                  {active && <Check size={13} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
