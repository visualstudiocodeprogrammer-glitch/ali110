#!/usr/bin/env node
/**
 * Minimal static server for local development.
 *   npm run serve                      -> http://localhost:8080/
 *   node scripts/serve.js --base=/ali110 --port=8081
 *     serves the site under /ali110/ exactly like a GitHub Pages project site.
 *   node scripts/serve.js --dir=dist   -> serve the built folder
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1] || fallback;
const PORT = Number(arg('port', 8080));
const BASE = arg('base', '').replace(/\/$/, '');
const DIR = resolve(process.cwd(), arg('dir', '.'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json'
};

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const notFound = () => {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(existsSync(join(DIR, '404.html')) ? readFileSync(join(DIR, '404.html')) : 'Not found');
  };
  if (BASE) {
    if (!path.startsWith(`${BASE}/`) && path !== BASE) return notFound();
    path = path.slice(BASE.length) || '/';
  }
  let file = normalize(join(DIR, path));
  if (!file.startsWith(DIR)) return notFound();
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) { res.writeHead(301, { Location: `${BASE}${path}/` }); return res.end(); }
    file = join(file, 'index.html');
  }
  if (!existsSync(file)) return notFound();
  const type = TYPES[extname(file)] || 'application/octet-stream';
  const body = readFileSync(file);
  // HTTP Range support, so audio seeking behaves like it does on GitHub Pages.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] === '' ? Math.max(body.length - Number(range[2]), 0) : Number(range[1]);
    const end = range[1] === '' || range[2] === '' ? body.length - 1 : Math.min(Number(range[2]), body.length - 1);
    if (start > end || start >= body.length) { res.writeHead(416, { 'Content-Range': `bytes */${body.length}` }); return res.end(); }
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Content-Length': end - start + 1 });
    return res.end(body.subarray(start, end + 1));
  }
  res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': body.length, 'Cache-Control': 'no-cache' });
  res.end(body);
}).listen(PORT, () => console.log(`ali110 on http://localhost:${PORT}${BASE}/  (serving ${DIR})`));
