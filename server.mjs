// Servidor local: node server.mjs [puerto] [carpeta=site]  ->  http://localhost:4000
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[3] || 'site');
const PORT = +process.argv[2] || 4000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.eot': 'application/vnd.ms-fontobject', '.pdf': 'application/pdf', '.xml': 'application/xml',
};
let urlMap = {};
try { urlMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'url-map.json'), 'utf8')); } catch {}

function find(reqUrl) {
  const u = new URL(reqUrl, 'http://x');
  let pathname;
  try { pathname = decodeURIComponent(u.pathname).replace(/\/+$/, '') || '/'; } catch { return null; }
  const candidates = [
    urlMap[u.pathname + u.search], urlMap[pathname],
    pathname === '/' ? 'en.html' : null,
    pathname, pathname + '.html', path.posix.join(pathname, 'index.html'),
  ];
  for (const c of candidates) {
    if (!c) continue;
    const f = path.join(ROOT, c);
    if (!f.startsWith(ROOT + path.sep)) continue;
    try { if (fs.statSync(f).isFile()) return f; } catch {}
  }
  return null;
}

http.createServer((req, res) => {
  const file = find(req.url);
  if (!file) { console.log(`404 ${req.url}`); res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  const size = fs.statSync(file).size;
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] ? +range[1] : size - +range[2];
    const end = range[1] && range[2] ? Math.min(+range[2], size - 1) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`Sirviendo en http://localhost:${PORT}/  (solo accesible desde este equipo; raíz: ${ROOT})`));
