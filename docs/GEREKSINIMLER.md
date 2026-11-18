# Kaza Namazı Takip — Yazılım Gereksinimleri Belirtimi (SRS)

| Alan | Değer |
|---|---|
| Sürüm | 0.4 (taslak) — Faz 3 tamamlandı (K-21..K-24) |
| Tarih | 19.11.2026 |
| Dayanak | ISO/IEC/IEEE 29148 yapısı · MoSCoW önceliklendirme |
| İlişkili belge | [PLANLAMA.txt](../PLANLAMA.txt) — karar günlüğü (K-xx) ve ilerleme günlüğü burada kalır |
| Çalışma dalı | `feat/summary-phase` (iç depo) |

> Bu belge **ne yapılacağını ve nasıl doğrulanacağını** tanımlar. **Neden** öyle karar verildiği
> PLANLAMA.txt'deki K-xx kayıtlarında durur; burada yalnızca ID ile referans verilir.

---

## 1. Amaç ve Kapsam

### 1.1 Ürün vizyonu
Kaza namazı borcu olan bir Müslümanın borcunu **doğru hesaplamasını**, **günlük ilerlemesini
zahmetsizce kaydetmesini** ve **ne kadar sürede biteceğini görerek motive kalmasını** sağlayan,
çevrimdışı çalışan, verisi cihazından çıkmayan bir mobil web uygulaması (PWA).

### 1.2 Bu çalışmanın hedefi
Canlıdaki v1 uygulamasını, canlıya dokunmadan, ayrı dalda **v2**'ye dönüştürmek:
geçmiş, özet/istatistik, vakit hesabı, bildirim ve veri güvenliği eklenmiş, görsel olarak
olgunlaşmış bir sürüm. v2'nin ne zaman ve nasıl yayına alınacağı ayrı bir karardır (bkz. §9).

### 1.3 Kapsam dışı
- Yerel (native) iOS/Android uygulaması, ana ekran widget'ı (web'de mümkün değil — PLANLAMA §3B)
- Kullanıcı hesabı, giriş, bulut senkronizasyonu
- Kaza dışı ibadet takibi (oruç kazası vb.) — ileride ayrıca değerlendirilebilir

---

## 2. Paydaşlar ve Kullanıcı Profilleri

| Paydaş | İlgisi |
|---|---|
| **Geliştirici / ürün sahibi** | Tüm kararlar; yayın onayı yalnızca onda |
| **Mevcut kullanıcılar (v1)** | Verileri cihazlarında; v2 geçişinde **veri kaybı yaşamamalı** |
| **Yeni kullanıcılar** | İlk açılışta borcunu kolayca hesaplayabilmeli |

**Persona A — Düzenli kılan:** Her gün birkaç vakit kaza kılar, hızlıca +1 basıp çıkmak ister,
ilerlemesini görmek motive eder.
**Persona B — Yeni başlayan:** Borcunu bilmiyor; doğum tarihi/ergenlik yaşından hesap ister,
dini doğruluğa hassastır.
**Persona C — Unutkan:** Vakit hatırlatması ve "bugün ne kılsam" önerisi ister.

---

## 3. Kısıtlar (değiştirilemez)

| ID | Kısıt | Kaynak |
|---|---|---|
| C-01 | Canlı uygulama (Vercel) bu süreçte **değişmez**: push, deploy, main'e commit yok | Sabit kural, K-01 |
| C-02 | Git commit/push yalnızca **açık onayla** | Sabit kural |
| C-03 | Sunucusuz; tüm veri cihazda (localStorage). Sunucu yalnızca Faz 4 Web Push için ve ayrı onayla | K-04, D1 |
| C-04 | Çevrimdışı tam çalışma (PWA) | Mevcut mimari |
| C-05 | Vakit hesabı Diyanet yöntemi (adhan `Turkey` + Hanefi) | Faz 2 |
| C-06 | Nafile listesi yalnızca sahih nafileler (Teheccüd, Kuşluk, Evvâbin) | Faz 2 düzeltmesi |
| C-07 | Arayüz dili Türkçe | — |
| C-08 | Ek bağımlılıklarda tutumlu olunur (grafik elle SVG) | K-14 |

---

## 4. Mevcut Durum Analizi (As-Is, 19.11.2026)

### 4.1 Ölçümler
| Ölçüt | Değer |
|---|---|
| Kaynak kod | ~4.500 satır, 26 dosya (React 18 + Vite 5 + Tailwind 3) |
| JS paketi | 271,5 KB (gzip 78,7 KB) · CSS 45,5 KB (gzip 8,1 KB) |
| Derleme | ✅ Başarılı |
| Birim test (`tools/test-history.mjs`) | ✅ Tümü geçiyor |
| Uçtan uca test (`test-faz1/2.mjs`, CDP) | Mevcut; Chrome yolu sabit, npm script yok |
| Tamamlanan fazlar | Faz 0 (geçmiş + tab bar), Faz 1 (Özet + Ayarlar), Faz 2 (vakit hesabı) |
| Sıradaki | Faz 3 (bildirimler) |

### 4.2 Teknik borç ve riskler
| ID | Bulgu | Etki | Önem |
|---|---|---|---|
| TD-01 | **Yedekleme/geri yükleme yok.** Tüm veri tek tarayıcının localStorage'ında. Tarayıcı verisi temizlenince veya telefon değişince borç kaydı kaybolur. Safari'de ana ekrana eklenmemiş sitelerde 7 gün etkileşimsizlikte depolama silinebilir. | Kullanıcının yıllık emeği kaybolur | ✅ Çözüldü (Faz 2.5) |
| TD-02 | **Şema sürümleme/migrasyon katmanı yok.** Anahtarlar `-v1` adlı ama v1→v2 geçişini yöneten merkezi kod yok. v2 yayına alınınca mevcut kullanıcı verisinin güvenle taşınması garanti değil. | Yayında veri bozulması | ✅ Çözüldü (Faz 2.5) |
| TD-03 | **İç içe iki git deposu.** Dış klasör (`KAZA NAMAZ`) ayrı bir depo, remote'u yer tutucu (`KULLANICI_ADINIZ`), kökte başıboş `node_modules` ve `package.json` var; aynı dosyaları iki depo izliyor. | Yanlış depoda commit/push, kafa karışıklığı | Orta |
| TD-04 | Test altyapısı dağınık: test çerçevesi yok, `npm test` yok, birim testler kaynak dosyaları geçici kopyalayarak çalışıyor. Uçtan uca testler `%TEMP%\kaza-chrome-faz*` profilini yeniden kullandığı için yeni derlemeden sonra eski service worker sayfayı yeniden yüklüyor ve test kararsızlaşıyor (profil silinince geçiyor). | Regresyon yakalamak zorlaşır | ✅ Büyük ölçüde çözüldü: `npm test` (Vitest, 40 test) + `npm run test:e2e`; e2e temiz profil + font engelleme |
| TD-05 | `App.jsx` tüm durumu tutuyor; `TrackingScreen` 13 prop alıyor. Faz 3 ile bildirim durumu da eklenince büyüyecek. | Bakım zorluğu | Orta |
| TD-06 | Sıfırlama; konum ve vakit sapma ayarlarını **silmiyor** (bilinçli mi belirsiz). Sıfırla butonu hem Takip hem Ayarlar ekranında var. | Beklenmeyen davranış, yıkıcı eylemin iki yerde durması | ✅ Çözüldü (K-19) |
| TD-07 | Bildirim kodu `BirthdayBanner.jsx` içine gömülü; Faz 3 için ortak bir bildirim servisi yok. | Kod tekrarı | ✅ Çözüldü: `src/utils/notifications.js` |
| TD-08 | Erişilebilirlik kısmi: bazı `aria` etiketleri var, kontrast ve dokunma hedefi denetimi yapılmamış. | Kullanılabilirlik | Düşük |
| TD-09 | PLANLAMA.txt başlığı güncel değil ("KOD AŞAMASI BAŞLIYOR"); ASCII/Türkçe karışık. | Belge tutarlılığı | Düşük |
| TD-10 | **Harici font sayfayı bloke ediyor.** `index.html` Google Fonts stil dosyasını render-blocking yüklüyor; yavaş ağda uygulama saniyelerce boş ekran gösteriyor (testte ~6 sn ölçüldü), çevrimdışı ilk açılışta font gelmiyor. Öneri: fontları uygulamaya gömmek (self-host) ve PWA önbelleğine almak. | NFR-02, NFR-03 ihlali | ✅ Çözüldü (K-21): fontlar gömülü, açılış ~0,6 sn |

---

## 5. Fonksiyonel Gereksinimler

**Öncelik:** M = Must (olmazsa olmaz) · S = Should · C = Could · W = Won't (bu sürümde yok)
**Durum:** ✅ Var · 🟡 Kısmi · ⬜ Yok

### 5.1 Borç kurulumu ve takip (FR-TAK)
| ID | Gereksinim | Önc. | Durum |
|---|---|---|---|
| FR-TAK-01 | Kullanıcı ilk açılışta borcunu **elle** ya da **doğum tarihi + ergenlik yaşı + cinsiyet** ile hesaplayarak girebilmeli. | M | ✅ |
| FR-TAK-02 | 6 vakit (5 vakit + vitir) için ayrı kalan borç sayacı gösterilmeli. | M | ✅ |
| FR-TAK-03 | Sayaç ±1 / ±5 ile değiştirilebilmeli; yanlış dokunuşa karşı **kilit modu** olmalı. | M | ✅ |
| FR-TAK-04 | Her değişiklik birkaç saniye içinde **geri alınabilmeli** (Undo). | M | ✅ |
| FR-TAK-05 | Toplu borç ekleme (yıl/ay/gün hesabıyla) yapılabilmeli. | M | ✅ |
| FR-TAK-06 | Genel ilerleme (yüzde, kalan toplam) her an görünmeli. | M | ✅ |
| FR-TAK-07 | "Bugünün önerisi": en çok borcu kalan vakitten ne kılınabileceği önerilmeli. | C | ⬜ |
| FR-TAK-08 | Günlük hedef belirleme ve hedef ilerlemesi. | C | ⬜ |

### 5.2 Geçmiş ve özet (FR-GEC / FR-OZT)
| ID | Gereksinim | Önc. | Durum |
|---|---|---|---|
| FR-GEC-01 | Her sayaç değişimi o günün kaydına anlık yazılmalı (kaza / bulk ayrı kova, kalan borç anlık görüntüsü). | M | ✅ K-03, K-05, K-06 |
| FR-GEC-02 | Geri alma, geçmiş kaydını da geri almalı. | M | ✅ |
| FR-GEC-03 | Geçmiş sınırsız saklanmalı. | M | ✅ K-04 |
| FR-OZT-01 | Günlük / Haftalık / Aylık seçici ile tek renk sütun grafiği. | M | ✅ K-08, K-15 |
| FR-OZT-02 | Vakit dağılımı (yatay çubuk: ad + sayı + yüzde). | M | ✅ K-11 |
| FR-OZT-03 | Önceki döneme göre karşılaştırma (yön + yüzde). | M | ✅ K-09 |
| FR-OZT-04 | Tahmini bitiş tarihi (ortalama hız) + en iyi gün. | M | ✅ K-10 |
| FR-OZT-05 | İlerleme kartını görsel olarak paylaşma (Web Share). | C | ⬜ |
| FR-OZT-06 | Seri (streak) / rozet. | W | — K-08 gereği bu sürümde yok |

### 5.3 Vakit hesabı (FR-VKT)
| ID | Gereksinim | Önc. | Durum |
|---|---|---|---|
| FR-VKT-01 | Konum: 81 il listesi + GPS + elle koordinat. | M | ✅ K-13 |
| FR-VKT-02 | 5 vakit + vitir + sahih nafile vakitleri Diyanet yöntemiyle hesaplanmalı. | M | ✅ C-05, C-06 |
| FR-VKT-03 | Her vakit için ± dakika sapma ayarı. | S | ✅ D7 |
| FR-VKT-04 | Gece yarısı otomatik yeniden hesaplama. | M | ✅ |

### 5.4 Bildirimler (FR-BLD) — Faz 3 / Faz 4
| ID | Gereksinim | Önc. | Durum |
|---|---|---|---|
| FR-BLD-01 | Bildirim izni yalnızca kullanıcı bir düğmeye bastığında istenmeli (açıklama ekranıyla). | M | ✅ Faz 3 |
| FR-BLD-02 | Kullanıcı hangi vakitler ve hangi nafileler için hatırlatma istediğini seçebilmeli. | M | ✅ Faz 3 |
| FR-BLD-03 | Uygulama açıkken vakit girince bildirim gösterilmeli. | M | ✅ Faz 3 |
| FR-BLD-04 | Seçili vakitler için alarmlı `.ics` takvim dosyası indirilebilmeli (uygulama kapalıyken de çalışan sunucusuz yol). | S | ✅ Faz 3 |
| FR-BLD-05 | Bildirimden sayaç artırma **varsayılan kapalı**, açıkça onaylanırsa çalışmalı. | C | ⬜ Ertelendi (K-22): yanlışlıkla kaza düşme riski |
| FR-BLD-06 | Uygulama kapalıyken Web Push. | C | ⬜ Faz 4, **ayrı onay** (C-03) |
| FR-BLD-07 | Ana ekran ikonunda kalan borç rozeti (Badging API, destekleyen cihazlarda). | C | ⬜ |

### 5.5 Veri yönetimi (FR-VRI)
| ID | Gereksinim | Önc. | Durum |
|---|---|---|---|
| FR-VRI-01 | Tüm veri (sayaçlar, geçmiş, profil, ayarlar) tek bir **JSON dosyası olarak dışa aktarılabilmeli**. | **M** | ✅ Faz 2.5 |
| FR-VRI-02 | Dışa aktarılan dosya **içe aktarılabilmeli**; içe aktarmadan önce özet gösterilip onay istenmeli, geçersiz dosya reddedilmeli. | **M** | ✅ Faz 2.5 |
| FR-VRI-03 | Uygulama açılışında depolanmış veri sürümü kontrol edilip gerekirse **otomatik migrasyon** yapılmalı; migrasyon başarısız olursa eski veri silinmemeli. | **M** | ✅ Faz 2.5 |
| FR-VRI-04 | Sıfırlama yalnızca tek yerde (Ayarlar) olmalı, neyin silineceğini açıkça listelemeli ve iki adımlı onay istemeli. | S | ✅ Faz 2.5 (K-19) |
| FR-VRI-05 | Son yedekten bu yana uzun süre geçtiyse nazik bir "yedek al" hatırlatması. | C | ⬜ |

### 5.6 Görsel ve deneyim olgunlaştırma (FR-UX) — "daha güzel" hedefi
| ID | Gereksinim | Önc. | Durum |
|---|---|---|---|
| FR-UX-01 | Tutarlı tasarım dili: renk, tipografi, boşluk ve köşe yuvarlaklığı tek yerden (Tailwind token) yönetilmeli; ekranlar arası tutarsızlık giderilmeli. | S | 🟡 Renk ✅ (K-16); tipografi/boşluk ⬜ |
| FR-UX-07 | Renk sistemi **yeşil + mor** (K-16): yeşil = eda/ilerleme, mor = kimlik/yapı; yeşil→mor imza gradyanı yalnızca öne çıkan öğelerde; üçüncü bir vurgu rengi (turkuaz, sarı) kullanılmaz. Hata/silme için kırmızı (rose) istisnadır. | M | ✅ |
| FR-UX-08 | Ana eylem (−1/−5 = kaza kılındı) görsel olarak en belirgin düğme olmalı; borç ekleme (+1/+5) ikincil görünmeli. | M | ✅ |
| FR-UX-02 | Takip ekranı sadeleştirilmeli: ana eylem (kaza kılındı → −1) en fazla **1 dokunuş** (kilit açıkken) olmalı; ikincil öğeler (kurulum, doğum günü kartı) katlanabilir olmalı. | S | 🟡 |
| FR-UX-03 | Boş durum, yükleniyor ve hata durumları her ekranda tasarlanmış olmalı. | S | 🟡 |
| FR-UX-04 | Hicri tarih ve özel gün (Ramazan, Kandil, Bayram) geri sayımı. | C | ⬜ |
| FR-UX-05 | Açık tema seçeneği. | C | ⬜ |
| FR-UX-06 | Hafif mikro etkileşimler (titreşim, animasyon); `prefers-reduced-motion` gözetilmeli. | C | 🟡 |

---

## 6. Fonksiyonel Olmayan Gereksinimler

| ID | Kategori | Gereksinim | Ölçüt / Doğrulama |
|---|---|---|---|
| NFR-01 | Güvenilirlik | Hiçbir güncelleme mevcut kullanıcı verisini silmemeli ya da bozmamalı. | v1 verisiyle açılış testi; migrasyon birim testleri |
| NFR-02 | Çevrimdışı | Bildirim (Web Push) hariç tüm özellikler internetsiz çalışmalı. | Uçak modunda uçtan uca test |
| NFR-03 | Performans | İlk yükleme orta seviye telefonda 4G'de < 2,5 sn; JS paketi gzip ≤ 100 KB. | Lighthouse ≥ 90 (Performans) · build çıktısı |
| NFR-04 | Performans | Sayaç dokunuşu ile ekran güncellemesi arası < 100 ms. | Elle ölçüm / DevTools |
| NFR-05 | Gizlilik | Kişisel veri (doğum tarihi, borç, konum) cihaz dışına çıkmamalı. Analitik yalnızca anonim sayfa görüntüleme. | Ağ isteği incelemesi |
| NFR-06 | Erişilebilirlik | WCAG 2.2 AA: metin kontrastı ≥ 4.5:1, dokunma hedefi ≥ 44×44 px, tüm düğmelerde erişilebilir ad. | Lighthouse Erişilebilirlik ≥ 95 + elle kontrol |
| NFR-07 | Uyumluluk | iOS Safari 16.4+, Android Chrome son 2 sürüm; 360 px genişlikte yatay kaydırma yok. | Cihaz/emülatör testi |
| NFR-08 | Doğruluk | Vakitler Diyanet takvimiyle ±2 dk içinde olmalı. | 5 il × 4 mevsim tarihi karşılaştırma testi |
| NFR-09 | Doğruluk | Borç hesaplama formülü (gün × vakit) dini kaynakla tutarlı ve birim testli olmalı. | `prayerCalculations` birim testleri |
| NFR-10 | Bakım | İş mantığı (`utils/`) birim testle korunmalı; `npm test` tek komutla çalışmalı. | utils kapsama ≥ %80 |
| NFR-11 | Kullanılabilirlik | Yeni kullanıcı kurulumu 1 dakikadan kısa sürede bitirebilmeli. | 3 kişiyle gayriresmî kullanılabilirlik testi |

---

## 7. Temel Kullanım Senaryoları

**UC-01 — Günlük kaza kaydı** (Persona A)
1. Uygulamayı açar → Takip ekranı. 2. Kilidi açar. 3. Kıldığı vaktin −1 düğmesine basar.
4. Sayaç ve ilerleme güncellenir, geri al bildirimi çıkar. 5. Kayıt bugünün geçmişine yazılır.
*Kabul:* Uygulama kapatılıp açıldığında sayaç ve Özet ekranındaki bugünkü sütun değişikliği yansıtır.

**UC-02 — İlk kurulum** (Persona B)
1. İlk açılış → sihirbaz. 2. "Hesapla" seçer, doğum tarihi/ergenlik yaşı/cinsiyet girer.
3. Hesaplanan borcu görür, onaylar → Takip ekranı.
*Kabul:* Girilen değerlerle `prayerCalculations` sonucu birebir aynı.

**UC-03 — Telefon değiştirme** (TD-01 çözümü)
1. Eski telefonda Ayarlar → Veri → "Dışa aktar" → JSON dosyası paylaşılır/kaydedilir.
2. Yeni telefonda kurulum ekranında veya Ayarlar'da "İçe aktar" → dosya seçilir.
3. Özet gösterilir (toplam borç, geçmiş gün sayısı) → onay.
*Kabul:* Sayaçlar, geçmiş, profil ve ayarlar eksiksiz aynı; bozuk dosyada hiçbir veri değişmez.

**UC-04 — Vakit hatırlatması** (Persona C)
1. Ayarlar → Bildirimler → "Hatırlatmaları aç" → açıklama → tarayıcı izni.
2. Vakitleri seçer. 3. Vakit girince bildirim; dokununca uygulama ilgili vakitle açılır.
*Kabul:* İzin reddedilirse uygulama hata vermez, alternatif olarak `.ics` önerilir.

---

## 8. Yol Haritası (revize)

Önceki faz sırası korunur; tek fark **Faz 2.5** eklenmesi. Gerekçe: Faz 3–5 yeni özellik eklerken
TD-01/TD-02 çözülmeden v2'nin hiçbir zaman güvenle yayına alınamaması.

| Faz | İçerik | Karşıladığı gereksinimler | Durum |
|---|---|---|---|
| 0 | Geçmiş veri modeli + tab bar | FR-GEC-01..03 | ✅ |
| 1 | Özet ekranı + Ayarlar (konum, sıfırlama) | FR-OZT-01..04 | ✅ |
| 2 | Vakit hesabı | FR-VKT-01..04 | ✅ |
| **2.5** | **Temel sağlamlaştırma:** `npm test` (Vitest) + mevcut testlerin taşınması · şema sürümü + migrasyon katmanı · JSON dışa/içe aktarma · sıfırlamanın tek yere toplanması | FR-VRI-01..04, NFR-01, NFR-10 | ✅ |
| 3 | Bildirimler (açıkken) + `.ics` + izin akışı; bildirim kodunun tek serviste toplanması | FR-BLD-01..05, TD-07 | ✅ |
| 4 | Web Push — ayrı dal, ayrı Vercel preview, **ayrı onay** | FR-BLD-06 | ⬜ |
| 5 | Görsel olgunlaştırma + cila: tasarım token'ları, takip ekranı sadeleştirme, erişilebilirlik denetimi, hicri geri sayım, paylaşım, öneri/hedef | FR-UX-*, FR-TAK-07/08, FR-OZT-05, NFR-03/06 | ⬜ |

Her faz için **Bitti Tanımı (Definition of Done):**
1. İlgili gereksinimlerin kabul ölçütleri sağlandı.
2. `npm run build` başarılı, tüm testler geçiyor, önceki fazların regresyon testleri geçiyor.
3. PLANLAMA.txt ilerleme günlüğü ve bu belgedeki durum sütunları güncellendi.
4. Commit yalnızca açık onayla; push/deploy yok (C-01, C-02).

---

## 9. Yayın Kapısı (ileride, ayrı karar)

v2 canlıya ancak ürün sahibi **açıkça karar verdiğinde** ve şu koşullar sağlandığında çıkar:
- Tüm **M** gereksinimleri ✅
- v1 verisiyle migrasyon testi geçti (NFR-01)
- Önce Vercel **preview** ortamında en az bir hafta gerçek cihazda kullanıldı
- Geri dönüş planı hazır (önceki sürüme dönüş + verinin korunması)

Bu bölüm bir taahhüt değil; canlıya dokunma yasağı (C-01) ürün sahibi kaldırana kadar geçerlidir.

---

## 10. Açık Sorular (ürün sahibinin kararı gerekiyor)

| # | Soru | Etkilediği |
|---|---|---|
| ~~Q-1~~ | ✅ Cevaplandı (K-17): görsel yenileme + yenilikler birlikte; renk sistemi yeşil + mor (K-16). | — |
| Q-2 | Faz 2.5 (yedekleme + migrasyon + test) Faz 3'ten önce yapılsın mı? | Yol haritası sırası |
| Q-3 | Sıfırlama konum ve vakit sapma ayarlarını da silsin mi? → **Varsayılan: korur** (K-19); istenirse değiştirilir. | FR-VRI-04 |
| Q-4 | Dış klasördeki depo (`KAZA NAMAZ/.git`, kökteki `package.json`/`node_modules`) ne olacak — kaldırılsın mı, olduğu gibi kalsın mı? | TD-03 |
| Q-5 | Yedekleme sırasında dosya mı (indir/paylaş) yoksa ek olarak panoya kopyala mı istenir? → **Varsayılan: yalnız dosya** (K-20). | FR-VRI-01 |

---

## 11. İzlenebilirlik

| Gereksinim | Karar | Ana dosyalar | Test |
|---|---|---|---|
| FR-GEC-01..03 | K-03..06 | `src/hooks/useHistory.js`, `src/utils/history.js` | `tools/test-history.mjs` |
| FR-OZT-01..04 | K-08..11, K-15 | `src/screens/SummaryScreen.jsx`, `src/components/BarChart.jsx` | `tools/test-faz1.mjs` |
| FR-VKT-01..04 | K-13, D4, D7 | `src/utils/prayerTimes.js`, `src/hooks/usePrayerTimes.js`, `src/components/LocationPicker.jsx` | `tools/test-faz2.mjs` |
| FR-TAK-01 | — | `src/components/SetupWizard.jsx`, `src/utils/prayerCalculations.js` | ⬜ yok (NFR-09) |
| FR-VRI-01..04 | K-18..K-20 | `src/constants/storage.js`, `src/utils/migrations.js`, `src/utils/backup.js`, `src/components/BackupPanel.jsx`, `src/components/RestoreBackupButton.jsx` | `src/utils/*.test.js`, `tools/test-faz25.mjs` |
| FR-BLD-01..04 | D1, K-22..K-24 | `src/utils/notifications.js`, `src/utils/reminders.js`, `src/hooks/useReminders.js`, `src/utils/ics.js`, `src/components/NotificationSettings.jsx`, `public/sw-notifications.js` | `src/utils/reminders.test.js`, `src/utils/ics.test.js`, `tools/test-faz3.mjs` |

### Değişiklik yönetimi
Yeni bir gereksinim veya değişiklik → önce PLANLAMA.txt'ye K-xx kararı olarak yazılır → bu belgede
ilgili satır eklenir/güncellenir (ID'ler asla yeniden kullanılmaz; kaldırılan gereksinim **W** olarak işaretlenir).
