// Tüm videoları uploads playlist üzerinden çeker → data/videos.json
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isReview, guessCC, extractBikeName } from './util.js';

const API_KEY = process.env.YT_API_KEY || '';
const CHANNEL_ID = 'UCgdr65XToIcWEBSIGk8LstQ'; // ProSofi
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, '../../data/videos.json');
const BASE = 'https://www.googleapis.com/youtube/v3';

const wait = (ms)=> new Promise(r=>setTimeout(r,ms));

async function getUploadsPlaylistId(){
  const url = new URL(BASE + '/channels');
  url.searchParams.set('part','contentDetails');
  url.searchParams.set('id', CHANNEL_ID);
  url.searchParams.set('key', API_KEY);
  const res = await fetch(url, { headers: { 'Accept':'application/json' }});
  if (!res.ok){
    const txt = await res.text();
    throw new Error(`channels.list error: ${res.status} ${res.statusText} — ${txt.slice(0,200)}`);
  }
  const json = await res.json();
  const uploads = json?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error('Uploads playlist ID bulunamadı (contentDetails.relatedPlaylists.uploads)');
  return uploads;
}

async function fetchAllFromPlaylist(playlistId){
  let pageToken = '';
  const items = [];
  do{
    const url = new URL(BASE + '/playlistItems');
    url.searchParams.set('part','snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults','50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', API_KEY);

    const res = await fetch(url, { headers: { 'Accept':'application/json' }});
    if (!res.ok){
      const txt = await res.text();
      throw new Error(`playlistItems.list error: ${res.status} ${res.statusText} — ${txt.slice(0,200)}`);
    }
    const json = await res.json();
    pageToken = json.nextPageToken || '';

    for (const it of json.items || []){
      const vid = it.contentDetails?.videoId;
      if (!vid) continue;

      const sn = it.snippet || {};
      const title = sn.title || '';
      const desc = sn.description || '';
      const publishedAt = sn.publishedAt || it.contentDetails?.videoPublishedAt;

      const type = isReview(title, desc) ? 'inceleme' : 'vlog';
      const cc = type === 'inceleme' ? guessCC(title, desc) : null;
      const bike = type === 'inceleme' ? extractBikeName(title) : null;
      const thumb = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;

      items.push({
        id: vid,
        title,
        url: `https://www.youtube.com/watch?v=${vid}`,
        thumb,
        type,
        cc,
        tags: [],
        bike,
        publishedAt
      });
    }
    await wait(120);
  } while(pageToken);

  items.sort((a,b)=> new Date(b.publishedAt) - new Date(a.publishedAt));
  return items;
}

const ensureDir = async (f) => fs.mkdir(path.dirname(f), { recursive: true });

(async () => {
  if (!API_KEY) throw new Error('YT_API_KEY eksik. PowerShell: $env:YT_API_KEY="..."');
  const uploads = await getUploadsPlaylistId();
  const items = await fetchAllFromPlaylist(uploads);
  await ensureDir(OUT_FILE);
  await fs.writeFile(OUT_FILE, JSON.stringify(items, null, 2), 'utf8');
  console.log(`OK • ${items.length} video yazıldı → ${OUT_FILE}`);
})().catch(e=>{ console.error(e); process.exit(1); });


async function downloadChannelLogo(logoUrl, outPath){
  try{
    const res = await fetch(logoUrl);
    if(!res.ok) throw new Error('logo fetch ' + res.status);
    const ab = await res.arrayBuffer();
    await fs.mkdir(path.dirname(outPath), { recursive:true });
    await fs.writeFile(outPath, Buffer.from(ab));
    console.log('Logo saved →', outPath);
  }catch(e){ console.warn('Logo indirilemedi:', e.message); }
}

async function getChannelLogoUrl(){
  const url = new URL(BASE + '/channels');
  url.searchParams.set('part','snippet');
  url.searchParams.set('id', CHANNEL_ID);
  url.searchParams.set('key', API_KEY);
  const res = await fetch(url);
  if(!res.ok) return null;
  const j = await res.json();
  const sn = j?.items?.[0]?.snippet;
  return sn?.thumbnails?.high?.url || sn?.thumbnails?.default?.url || null;
}
