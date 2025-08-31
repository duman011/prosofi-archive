export const BRANDS = [
  'Honda','Yamaha','Kawasaki','Suzuki','CF ?Moto','CFMOTO','KTM','TVS','Bajaj','Hero','Haojue','Mondial','RKS','Yuki','Brixton','Benelli','SYM','Kymco','QJMotor','Yadea','Zontes','Keeway','Husqvarna','Aprilia','Ducati','BMW','Harley','Royal Enfield'
];
export const REVIEW_KEYWORDS = [/\bincele(me|mesi)?\b/i, /review/i, /test\b/i, /top\s*speed/i];
export const CC_REGEXES = [/(\d{2,4})\s*cc\b/i, /(\d{2,4})\s*\bcc/i, /\b(50|100|110|125|150|200|250|300|350|390|400|450|500|650|700|750|800|900|1000|1100|1200|1300|1340)\b/];

export function isReview(title, desc){
  const hay = `${title}\n${desc}`;
  if (REVIEW_KEYWORDS.some(rx => rx.test(hay))) return true;
  if (BRANDS.some(b => new RegExp(b,'i').test(hay))) return true;
  return false;
}
export function guessCC(title, desc){
  const hay = `${title} ${desc}`;
  for (const rx of CC_REGEXES){
    const m = hay.match(rx);
    if (m){ const n = parseInt(m[1] || m[0], 10); if (Number.isFinite(n) && n >= 49 && n <= 2000) return n; }
  }
  return null;
}
export function extractBikeName(title){
  for (const brand of BRANDS){
    const ix = title.toLowerCase().indexOf(brand.toLowerCase());
    if (ix !== -1){
      const tail = title.slice(ix + brand.length, ix + brand.length + 50);
      const cutoff = tail.search(/[\-|\(|\[|\{|,|;|:]/);
      const model = (cutoff === -1 ? tail : tail.slice(0, cutoff)).trim();
      const name = `${brand} ${model}`.replace(/\s+/g,' ').trim();
      return name;
    }
  }
  return null;
}
