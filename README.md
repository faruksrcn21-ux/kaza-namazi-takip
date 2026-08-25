# Kaza Namazı Takip

Modern, mobile-first, PWA uyumlu kaza namazı takip uygulaması.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` açılır.

## Üretim için derleme

```bash
npm run build
npm run preview
```

## Ücretsiz yayına alma (Vercel/Netlify)

1. Bu klasörü bir GitHub reposuna yükle.
2. Vercel veya Netlify'da "New Project" ile repoyu bağla.
3. Build komutu: `npm run build`, çıktı klasörü: `dist`.
4. Deploy sonrası sana verilen linki arkadaşınla paylaş.
5. Telefonda linki açıp tarayıcı menüsünden "Ana Ekrana Ekle" seçilirse
   gerçek bir uygulama gibi ikon olarak durur.

## Notlar

- Tüm veriler `localStorage`'da saklanır, sunucu/veritabanı gerekmez.
- `public/icons/` altındaki ikonlar basit placeholder'dır, istersen
  kendi logonla değiştirebilirsin (192x192 ve 512x512 px, PNG).
