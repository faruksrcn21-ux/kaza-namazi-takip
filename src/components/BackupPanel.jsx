import { useState } from 'react'
import { Download, CheckCircle2, Clock3 } from 'lucide-react'
import RestoreBackupButton from './RestoreBackupButton'
import { backupFileName, createBackup, getLastBackupAt, markBackupDone } from '../utils/backup'
import { deliverFile } from '../utils/download'

const safeLastBackup = () => {
  try {
    return getLastBackupAt(window.localStorage)
  } catch {
    return null
  }
}

const relative = (iso) => {
  if (!iso) return null
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (!Number.isFinite(days) || days < 0) return null
  if (days === 0) return 'bugün'
  if (days === 1) return 'dün'
  return `${days} gün önce`
}

/**
 * Ayarlar → Veri: yedeği indir / yedekten geri yükle (FR-VRI-01, FR-VRI-02).
 * Dosya mobilde paylaşım menüsüyle (destekleniyorsa), diğer durumlarda
 * doğrudan indirme olarak verilir. Veri cihaz dışına kendiliğinden çıkmaz.
 */
export default function BackupPanel() {
  const [lastBackup, setLastBackup] = useState(safeLastBackup)
  const [msg, setMsg] = useState('')

  const exportBackup = async () => {
    setMsg('')
    try {
      const now = new Date()
      const text = JSON.stringify(createBackup(window.localStorage, now), null, 2)
      const name = backupFileName(now)
      const result = await deliverFile({
        name,
        text,
        type: 'application/json',
        preferShare: true,
        shareTitle: 'Kaza Namazı Takip yedeği'
      })
      if (result === 'cancelled') return

      markBackupDone(window.localStorage, now)
      setLastBackup(now.toISOString())
      setMsg(`${name} hazırlandı. Dosyayı güvenli bir yerde sakla.`)
    } catch {
      setMsg('Yedek oluşturulamadı. Tarayıcı dosya indirmeyi engellemiş olabilir.')
    }
  }

  const rel = relative(lastBackup)

  return (
    <div className="mb-4">
      <div
        className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-3 text-[11px] border ${
          rel
            ? 'bg-primary-500/[0.07] border-primary-500/20 text-primary-200'
            : 'bg-accent-500/[0.07] border-accent-400/20 text-accent-200'
        }`}
        data-testid="last-backup"
      >
        {rel ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
        {rel
          ? `Son yedek: ${rel}`
          : 'Henüz yedek alınmadı. Telefon değişirse veya tarayıcı verisi silinirse borç kaydın kaybolur.'}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={exportBackup}
          className="flex flex-1 items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-b from-primary-500/25 to-primary-600/15 border border-primary-400/35 text-primary-100 text-xs font-bold hover:from-primary-500/35 active:scale-[0.98] transition-all"
        >
          <Download size={15} />
          Yedeği indir
        </button>
        <RestoreBackupButton variant="panel" />
      </div>

      {msg && <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{msg}</p>}
    </div>
  )
}
