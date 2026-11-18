/**
 * Metin dosyasını kullanıcıya verir.
 * preferShare=true ve dokunmatik cihazda dosya paylaşımı destekleniyorsa
 * paylaşım menüsü açılır; diğer durumlarda doğrudan indirilir.
 * @returns {Promise<'shared'|'downloaded'|'cancelled'>}
 */
export async function deliverFile({ name, text, type, preferShare = false, shareTitle }) {
  const file = new File([text], name, { type })

  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  if (preferShare && coarse && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: shareTitle || name })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // paylaşım başarısız → indirmeye düş
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
