"""Tema renk değişkenlerini üretir: python tools/gen-theme.py  (proje kökünden)

Çıktılar:
  src/theme.css        — CSS değişkenleri (koyu + açık tema)
  src/themeColors.js   — canvas (paylaşım kartı) için aynı tonlar

Tonu değiştirmek: DARK / LIGHT tablolarını düzenle.
Sadeliği değiştirmek: SOFTEN (1.0 = Tailwind'in canlı tonları, 0.6 = sade).
Renk TONU (yeşil/mor) ve açıklık korunur; yalnız doygunluk azalır (K-35).
"""
import colorsys
import os
import sys

os.chdir(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))

# ── Palet (K-35): ORMAN YEŞİLİ + KUM BEJİ + ELEKTRİK MORU ──
#   primary (orman yeşili) : eda & ilerleme — derin, toprak tonlu
#   zinc    (kum beji)     : nötr — metin ve çizgiler (sıcak); açık temada zemin kum
#   accent  (elektrik moru): vurgu & seçim — küçük alanlarda canlı tek renk
# SOFTEN: yeşil + mor doygunluk çarpanı (1.0 = tablodaki gibi; <1 daha sade)
SOFTEN = 1.0

STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
DARK = {
  # Orman yeşili: klasik "Dark Forest" skalası (K-37; önceki grimsi #43845c yerine)
  'primary': ['#f0faf4','#d8f3dc','#b7e4c7','#95d5b2','#74c69d','#52b788','#40916c','#2d6a4f','#1b4332','#133326','#081c15'],
  'accent':  ['#f6eeff','#ecdcff','#dcbcff','#c592ff','#b67aff','#9333ff','#7d16eb','#6610c2','#520d9c','#400b79','#27054b'],
  # Kum tonlu nötr: koyu temada metin (50–500), çizgi/zemin (600–950)
  'zinc':    ['#faf6ee','#f3ede1','#e6dcca','#d6c9b2','#b8ab94','#a1937b','#5e5546','#463f34','#2e2a23','#1d1a16','#0f0d0b'],
  'rose':    ['#fff1f2','#ffe4e6','#fecdd3','#fda4af','#fb7185','#f43f5e','#e11d48','#be123c','#9f1239','#881337','#4c0519'],
  # K-38 süs renkleri (canlı sürümdeki gibi): altın = besmele/dua yazıları, Öğle & Vitir simgesi;
  # turuncu = İkindi simgesi. Yalnız süs/simge — eylem ve seçim rolleri yeşil/morda kalır (K-16).
  'gold':    ['#fdf8ec','#faefd2','#f4dea3','#ecc66e','#e0aa45','#c98d2b','#a96f1f','#85561b','#644119','#4a3016','#2b1b0b'],
  'orange':  ['#fff7ed','#ffedd5','#fed7aa','#fdba74','#fb923c','#f97316','#ea580c','#c2410c','#9a3412','#7c2d12','#431407'],
}
# Açık tema: metin tonları (50–500) koyulaşır, zemin tonları (700–950) açık tinte döner
LIGHT = {
  # K-38: metin tonları bir kademe açıldı (siyahımsı görünüyordu)
  'primary': ['#0f2a1d','#1b4332','#24563f','#29634a','#2c684d','#40916c','#2d6a4f','#95d5b2','#b7e4c7','#d8f3dc','#f0faf4'],
  'accent':  ['#27054b','#400b79','#520d9c','#5c0fb0','#6610c2','#9333ff','#7d16eb','#dcbcff','#ecdcff','#f4ebff','#faf6ff'],
  'zinc':    ['#1c1812','#241f18','#2f291f','#3e362a','#4f4535','#62574a','#7a6e5d','#a89b85','#d6c9b2','#e8dfcf','#f3ede1'],
  'rose':    ['#4c0519','#881337','#9f1239','#be123c','#be123c','#f43f5e','#e11d48','#fda4af','#fecdd3','#ffe4e6','#fff1f2'],
  'gold':    ['#2b1b0b','#4a3016','#5e3d17','#6f4a17','#7d5418','#c98d2b','#a96f1f','#ecc66e','#f4dea3','#faefd2','#fdf8ec'],
  'orange':  ['#431407','#7c2d12','#8a3a10','#9a4a10','#9a4a10','#f97316','#ea580c','#fdba74','#fed7aa','#ffedd5','#fff7ed'],
}
SURFACE_STEPS = ['950', '900', '850', '800', '750', '700']
# Koyu: sıcak kömür (mor pop'u öne çıkarır) · Açık: kum
SURFACE_DARK = ['#0f0e0c', '#171512', '#1d1b17', '#25221d', '#2f2b25', '#3b362e']
SURFACE_LIGHT = ['#f4efe4', '#fffdf8', '#faf6ee', '#ece4d4', '#e2d7c3', '#d2c4aa']
WHITE_DARK, WHITE_LIGHT = '#fffaf0', '#2a2418'
PAGE_DARK, PAGE_LIGHT = SURFACE_DARK[0], SURFACE_LIGHT[0]
SOFTENED = ('primary', 'accent')


def soften(h, k=SOFTEN):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    r, g, b = colorsys.hls_to_rgb(hh, ll, ss * k)
    return '#%02x%02x%02x' % tuple(round(c * 255) for c in (r, g, b))


def prep(pal):
    return {n: [soften(v) if n in SOFTENED else v for v in vals] for n, vals in pal.items()}


D, L = prep(DARK), prep(LIGHT)
trip = lambda h: f"{int(h[1:3],16)} {int(h[3:5],16)} {int(h[5:7],16)}"
idx = {s: i for i, s in enumerate(STEPS)}


def block(pal, surf, white, extra):
    out = []
    for name, vals in pal.items():
        for st, v in zip(STEPS, vals):
            out.append(f"  --c-{name}-{st}: {trip(v)};")
    for st, v in zip(SURFACE_STEPS, surf):
        out.append(f"  --c-surface-{st}: {trip(v)};")
    out.append(f"  --c-white: {trip(white)};")
    out += [f"  --{k}: {trip(v)};" for k, v in extra.items()]
    return '\n'.join(out)


# Anlamsal tonlar: ana düğme her iki temada derin yeşil→mor (üstünde açık yazı);
# grafik/çubuk orta ton; ışıma renkleri.
P, A = D['primary'], D['accent']
SEMANTIC = {
  'c-btn-from': P[idx['700']], 'c-btn-to': A[idx['700']],
  'c-btn-from-hover': P[idx['600']], 'c-btn-to-hover': A[idx['600']],
  'c-bar-from': P[idx['500']], 'c-bar-to': A[idx['500']],
  'c-glow-green': P[idx['800']], 'c-glow-purple': A[idx['800']],
}
SEMANTIC_LIGHT = dict(SEMANTIC, **{'c-glow-green': P[idx['400']], 'c-glow-purple': A[idx['400']]})

css = f"""/*
 * TEMA RENK DEĞİŞKENLERİ (Faz 5 — FR-UX-05, K-32, K-35)
 * Bu dosya tools/gen-theme.py tarafından üretilir — elle düzenlemeyin. Tonlar
 * tailwind.config.js'te `rgb(var(--c-…) / <alpha-value>)` olarak kullanılır; bileşenler
 * sınıf değiştirmeden temaya uyar. Palet: orman yeşili + kum beji + elektrik moru (K-35). Doygunluk çarpanı: {SOFTEN}
 * Varsayılan: sistem teması (K-33). <html data-theme="light|dark">.
 */
:root {{
{block(D, SURFACE_DARK, WHITE_DARK, SEMANTIC)}
  --page-bg: {PAGE_DARK};
  color-scheme: dark;
}}

:root[data-theme='light'] {{
{block(L, SURFACE_LIGHT, WHITE_LIGHT, SEMANTIC_LIGHT)}
  --page-bg: {PAGE_LIGHT};
  color-scheme: light;
}}
"""
open('src/theme.css', 'w', encoding='utf-8').write(css)

# Canvas (paylaşım kartı) her zaman koyu çizilir → koyu tonlar
js = "// tools/gen-theme.py tarafından üretilir — elle düzenlemeyin.\n"
js += f"// Paylaşım kartı (canvas) için koyu tema tonları (K-35).\n"
for name in SOFTENED + ('gold',):
    pairs = ', '.join(f"{st}: '{v}'" for st, v in zip(STEPS, D[name]))
    js += f"export const {name.upper()} = {{ {pairs} }}\n"
js += "export const SAND = { " + ', '.join(f"{st}: '{v}'" for st, v in zip(STEPS, D['zinc'])) + " }\n"
js += f"export const PAGE = '{PAGE_DARK}'\n"
open('src/themeColors.js', 'w', encoding='utf-8').write(js)

# ── Okunabilirlik kontrolü (WCAG 2.x göreli parlaklık) ──
def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def cr(a, b):
    x, y = sorted((lum(a), lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)
bad = []
for tema, pal, surf in (('koyu', D, SURFACE_DARK), ('açık', L, SURFACE_LIGHT)):
    zeminler = surf[:5]  # sayfa..surface-750
    for name in ('zinc', 'primary', 'accent', 'gold'):
        for st in ('100', '200', '300', '400', '500') if name == 'zinc' else ('100', '200', '300', '400'):
            fg = pal[name][idx[st]]
            worst = min(cr(fg, z) for z in zeminler)
            if worst < 4.5:
                bad.append(f"{tema}: {name}-{st} {fg} en kötü {worst:.2f}")
print('Okunabilirlik: ' + ('tüm metin tonları ≥ 4,5:1' if not bad else 'UYARI → ' + '; '.join(bad)))
print('src/theme.css + src/themeColors.js üretildi (SOFTEN=%s)' % SOFTEN)
