/* Static preview server for site/. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const PORT = process.env.PORT || 3300;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (!path.extname(p)) p += '.html';

  const file = path.join(ROOT, path.normalize(p).replace(/^([/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }

  /* Chrome's media loader asks for a byte range and stalls at readyState 0 if
     the server claims Accept-Ranges and then answers 200 with a chunked body,
     so ranges are honoured properly here and every reply carries a length. */
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found: ' + p); return; }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    let start = 0, end = stat.size - 1, status = 200;
    if (range && (range[1] || range[2])) {
      if (range[1]) { start = Number(range[1]); if (range[2]) end = Number(range[2]); }
      else { start = stat.size - Number(range[2]); }
      start = Math.max(0, Math.min(start, stat.size - 1));
      end = Math.max(start, Math.min(end, stat.size - 1));
      status = 206;
    }
    const headers = {
      'Content-Type': type,
      'Content-Length': end - start + 1,
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes'
    };
    if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  });
}).listen(PORT, () => console.log('INU preview → http://localhost:' + PORT));
