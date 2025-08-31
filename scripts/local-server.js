// Basit yerel statik sunucu (Node 18+).
// Kullanım örnekleri:
//   node scripts/local-server.js              # 5173 portu
//   node scripts/local-server.js 5500         # özel port
//   PORT=5500 node scripts/local-server.js    # env ile
//
// Not: Sunucu kökü, komutu çalıştırdığın klasördür (process.cwd()).
// Bu dosyayı çalıştırmadan önce proje köküne 'cd' yap.

import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || process.argv[2] || 5173);

const mime = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp'
};

function send(res, code, body, headers={}){
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  try{
    const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const filePath = join(root, decodeURIComponent(urlPath));

    if (!existsSync(filePath)) return send(res, 404, 'Not found');

    const st = statSync(filePath);
    if (st.isDirectory()) {
      const idx = join(filePath, 'index.html');
      if (!existsSync(idx)) return send(res, 403, 'Directory listing disabled');
      const st2 = statSync(idx);
      res.writeHead(200, { 'Content-Type': mime['.html'], 'Content-Length': st2.size });
      return createReadStream(idx).pipe(res);
    }

    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream', 'Content-Length': st.size });
    createReadStream(filePath).pipe(res);
  }catch(e){
    send(res, 500, 'Server error');
  }
});

server.listen(port, () => console.log(`Local server → http://localhost:${port} (root: ${root})`));
