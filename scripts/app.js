// Helpers
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// Normalize Turkish & symbols for robust search
const mapTR = { 'ı':'i','İ':'i','I':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c' };
function normalize(str=''){
  return String(str)
    .replace(/[ışğüöçİŞĞÜÖÇI]/g, ch => mapTR[ch] || ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,' ')   // only alnum
    .replace(/\s+/g,' ')         // collapse spaces
    .trim();
}

function between(cc, range){
  if(!Number.isFinite(cc)) return false;
  if(range === '0-125') return cc <= 125;
  if(range === '126-250') return cc >= 126 && cc <= 250;
  if(range === '251-500') return cc >= 251 && cc <= 500;
  if(range === '501-750') return cc >= 501 && cc <= 750;
  if(range === '751-1000') return cc >= 751 && cc <= 1000;
  if(range === '>1000') return cc > 1000;
  return true; // any
}

function ytThumb(id){ return `https://i.ytimg.com/vi/${id}/hq720.jpg`; }

function createCard(item){
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('role','listitem');
  card.dataset.type = item.type;
  if(item.cc) card.dataset.cc = String(item.cc);

  const thumb = document.createElement('div');
  thumb.className = 'thumb';
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = item.bike ? item.bike : item.title;
  img.src = item.thumb || ytThumb(item.id);
  img.onerror = () => { img.src = `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`; };
  thumb.appendChild(img);

  const tag = document.createElement('div'); tag.className = 'tag';
  tag.textContent = item.type === 'inceleme' ? 'İNCELEME' : 'VLOG';
  thumb.appendChild(tag);

  if(item.type === 'inceleme' && Number.isFinite(item.cc)){
    const cc = document.createElement('div'); cc.className = 'cc'; cc.textContent = item.cc + ' cc';
    thumb.appendChild(cc);
  }

  const body = document.createElement('div'); body.className = 'body';
  const h3 = document.createElement('h3'); h3.className = 'title';
  const a = document.createElement('a'); a.href = item.url; a.target = '_blank'; a.rel = 'noopener';
  a.textContent = item.title;
  h3.appendChild(a); body.appendChild(h3);

  const meta = document.createElement('div'); meta.className = 'meta';
  (item.tags||[]).forEach(t=>{ const p = document.createElement('span'); p.className = 'pill'; p.textContent = '#' + t; meta.appendChild(p); });
  if(item.bike){ const p = document.createElement('span'); p.className = 'pill'; p.textContent = item.bike; meta.appendChild(p); }
  body.appendChild(meta);

  if(item.type === 'inceleme' && Array.isArray(item.specs) && item.specs.length){
    const ul = document.createElement('ul'); ul.className = 'specs';
    item.specs.forEach(s=>{ const li = document.createElement('li'); li.textContent = s; ul.appendChild(li); });
    body.appendChild(ul);
  }

  const actions = document.createElement('div'); actions.className = 'actions';
  const left = document.createElement('div'); left.style.color = '#9fb1c9'; left.style.fontSize = '12px'; left.textContent = 'YouTube üzerinden izlenir';
  const btn = document.createElement('a'); btn.className = 'btn'; btn.href = item.url; btn.target = '_blank'; btn.rel = 'noopener';
  btn.innerHTML = '<span class="yt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 15l5.19-3L10 9v6z"/></svg> YouTube</span>'
  actions.append(left, btn);

  card.append(thumb, body, actions);
  return card;
}

function preprocess(data){
  // Precompute normalized fields for fast searching
  return data.map(v => ({
    ...v,
    _normAll: normalize([v.title, v.bike, ...(v.tags||[])].join(' ')),
  }));
}

// Simple debounce
function debounce(fn, ms=200){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}

function applyFilters(data){
  const typeFilter = $('#typeFilter').value; // all | inceleme | vlog
  const ccFilter   = $('#ccFilter').value;   // any | ranges
  const qTokens    = normalize($('#search').value).split(' ').filter(Boolean);

  return data.filter(v=>{
    if(typeFilter !== 'all' && v.type !== typeFilter) return false;
    if(v.type === 'inceleme' && ccFilter !== 'any' && !between(v.cc, ccFilter)) return false;
    if(qTokens.length){
      // all tokens must be present in normalized haystack
      for(const tk of qTokens){ if(!v._normAll.includes(tk)) return false; }
    }
    return true;
  });
}

function render(data){
  const grid = $('#grid');
  const empty = $('#empty');
  grid.innerHTML = '';

  const list = applyFilters(data);
  $('#count-badge').textContent = `${list.length} video`;

  if(!list.length){ empty.hidden = false; return; }
  empty.hidden = true;

  // Chunked render for perf
  const CHUNK = 100;
  let i = 0;
  (function pump(){
    const frag = document.createDocumentFragment();
    for(let n=0; n<CHUNK && i<list.length; n++, i++){
      frag.appendChild(createCard(list[i]));
    }
    grid.appendChild(frag);
    if(i<list.length) requestAnimationFrame(pump);
  })();
}

(function init(){
  $('#year').textContent = new Date().getFullYear();

  // Bind filters
  $('#typeFilter').addEventListener('change', ()=>render(window.__DATA||[]));
  $('#ccFilter').addEventListener('change',   ()=>render(window.__DATA||[]));
  $('#search').addEventListener('input', debounce(()=>render(window.__DATA||[]), 120));

  const banner = document.getElementById('banner');
  const showBanner = (msg) => { banner.textContent = msg; banner.hidden = false; };

  // file:// altında fetch engellenebilir → inline fallback
  const doRender = (data)=>{ window.__DATA = preprocess(data); render(window.__DATA); };

  if (location.protocol === 'file:') {
    showBanner("Yerelde dosyadan açtın. 'data/videos.json' fetch engellenebilir. 'node scripts/local-server.js' ile  http://localhost:5173  üzerinden açmayı dene.");
  }

  fetch('./data/videos.json', { cache: 'no-store' })
    .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(data => doRender(data))
    .catch(err => {
      console.warn('fetch(data/videos.json) başarısız:', err);
      if (Array.isArray(window.__DATA_INLINE)) {
        showBanner("Veri dosyası okunamadı; 'inline' yedek veriyle açıldı. Yerelde test için 'node scripts/local-server.js' çalıştır.");
        doRender(window.__DATA_INLINE);
      } else {
        showBanner("Veri yüklenemedi. 'node scripts/local-server.js' ile yerel sunucu aç veya data/videos.json dosyasını oluştur.");
        doRender([]);
      }
    });
})();
