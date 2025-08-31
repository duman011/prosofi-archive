// scripts/build/embed_inline.mjs
// Amaç: data/videos.json içeriğini scripts/data-inline.js dosyasına gömerek
// file:// ile açıldığında da verinin görünmesini sağlamak.
// Kullanım (PowerShell):
//   $env:YT_API_KEY="..."; node scripts/build/fetch_prosofi_videos.mjs
//   node scripts/build/embed_inline.mjs
// Sonra index.html'i çift tıklayıp açsan da (file://) veri görünür.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IN = path.resolve(__dirname, '../../data/videos.json');
const OUT = path.resolve(__dirname, '../data-inline.js');

const main = async () => {
  const raw = await fs.readFile(IN, 'utf8');
  let json;
  try { json = JSON.parse(raw); }
  catch(e){ throw new Error('data/videos.json okunamadı veya geçersiz JSON. Önce fetch_prosofi_videos.mjs çalıştırın.'); }

  // Büyük dosya olabilir; inline JS'ye minimal yazalım.
  const js = 'window.__DATA_INLINE = ' + JSON.stringify(json) + ';\n';
  await fs.writeFile(OUT, js, 'utf8');
  console.log('OK • scripts/data-inline.js güncellendi (', json.length, 'kayıt )');
};

main().catch(e=>{ console.error(e); process.exit(1); });
