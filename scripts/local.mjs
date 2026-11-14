// Proba pe Mac: node scripts/local.mjs  →  http://localhost:3000
// Fără fișierul .env.local, folosește o bază și un Telegram „de jucărie”, în memorie (nimic nu pleacă în internet).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { raspunsGol } from './apel.mjs';

const radacina = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);

const fisierEnv = path.join(radacina, '.env.local');
if (existsSync(fisierEnv)) {
  for (const linie of readFileSync(fisierEnv, 'utf8').split('\n')) {
    const m = linie.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  console.log('Folosesc cheile reale din .env.local');
} else {
  const { instaleazaFals } = await import('./fals.mjs');
  instaleazaFals();
  console.log('Mod de probă: baza și Telegram sunt simulate în memorie.');
}

const TIPURI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };

async function citesteCorp(req) {
  const bucati = [];
  for await (const b of req) bucati.push(b);
  const text = Buffer.concat(bucati).toString('utf8');
  if (!text) return undefined;
  try { return JSON.parse(text); } catch { return text; }
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${port}`);
  try {
    if (u.pathname.startsWith('/api/')) {
      const fisier = path.join(radacina, `${u.pathname}.js`);
      if (!fisier.startsWith(path.join(radacina, 'api')) || !existsSync(fisier)) { res.writeHead(404).end('{}'); return; }
      const { default: handler } = await import(pathToFileURL(fisier).href);
      const r = raspunsGol();
      const cerere = { method: req.method, headers: req.headers, query: Object.fromEntries(u.searchParams), body: await citesteCorp(req) };
      await handler(cerere, r);
      res.writeHead(r.statusCode, r.antete).end(r.corp ?? '');
      return;
    }
    let cale = u.pathname === '/' ? '/index.html' : u.pathname;
    if (!path.extname(cale)) cale += '.html';
    const fisier = path.join(radacina, 'public', path.normalize(cale));
    if (!fisier.startsWith(path.join(radacina, 'public'))) { res.writeHead(403).end(); return; }
    const continut = await readFile(fisier);
    res.writeHead(200, { 'Content-Type': TIPURI[path.extname(fisier)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(continut);
  } catch (e) {
    if (e.code === 'ENOENT') { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Nu există'); return; }
    console.error(e);
    res.writeHead(500).end('Eroare');
  }
}).listen(port, () => console.log(`Site: http://localhost:${port}   Panou: http://localhost:${port}/admin`));
