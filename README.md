# ProSofi — Full Static Site

- **Tam statik**: HTML/CSS/JS
- **Veri**: `data/videos.json` (YouTube'dan otomatik üretilir)
- **Toplayıcı**: `scripts/build/fetch_prosofi_videos.mjs` (uploads playlist → TÜM videolar)
- **Yerel önizleme**: `node scripts/local-server.js` (file:// yerine http:// ile açmak için)

## 1) Veri üret (yerelde)
```powershell
cd C:\...\prosofi-archive
$env:YT_API_KEY="BURAYA_ANAHTAR"
node scripts/build/fetch_prosofi_videos.mjs
```
`data/videos.json` dolunca `node scripts/local-server.js` ile sunucu aç → http://localhost:8080

## 2) GitHub Actions (opsiyonel)
- Repo → Settings → Secrets → Actions → `YT_API_KEY` ekle.
- Push yap → Action otomatik `data/videos.json` üretir.

## Notlar
- Tarayıcıda dosyayı **file://** ile açarsan `fetch('./data/videos.json')` engellenebilir; bu yüzden yerel sunucuyla aç.
- Thumbnails: `i.ytimg.com/vi/<id>/hq720.jpg` → hata olursa `img.youtube.com/vi/<id>/hqdefault.jpg` fallback.


## 3) Offline (file://) açmak için
```powershell
node scripts/build/embed_inline.mjs
start index.html
```
