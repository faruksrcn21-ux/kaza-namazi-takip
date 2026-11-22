import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { runMigrations } from './utils/migrations'
// Gömülü fontlar (TD-10): Amiri yalnız besmele (Arapça) + italik alıntılar için
import './theme.css'
import './fonts.css'
import '@fontsource/amiri/arabic-400.css'
import '@fontsource/amiri/latin-400.css'
import '@fontsource/amiri/latin-ext-400.css'
import '@fontsource/amiri/latin-400-italic.css'
import '@fontsource/amiri/latin-ext-400-italic.css'
import './index.css'

// Şema migrasyonu — hook'lar localStorage'ı okumadan ÖNCE çalışmalı (FR-VRI-03).
// Başarısız olursa veriye dokunulmamıştır; uygulama mevcut veriyle açılır.
try {
  const result = runMigrations(window.localStorage)
  if (result.status === 'failed' || result.status === 'newer') {
    console.warn('[kaza] Veri migrasyonu atlandı:', result)
  }
} catch (error) {
  console.warn('[kaza] Depo erişilemedi, migrasyon atlandı.', error)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
