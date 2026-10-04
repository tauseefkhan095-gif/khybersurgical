/** Local static server: understands the same base path as the built site. No email. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputName = process.env.BUILD_DIR || 'dist';
if (!/^dist(?:-[A-Za-z0-9_-]+)?$/.test(outputName)) throw new Error('Invalid BUILD_DIR.');
const root = path.join(project, outputName);
let manifest;
try { manifest = JSON.parse(await readFile(path.join(root, 'site-manifest.json'), 'utf8')); }
catch { throw new Error('Build the website first: npm run build'); }
const basePath = manifest.basePath || '';
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.json':'application/json', '.txt':'text/plain', '.xml':'application/xml' };
const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  if (requestUrl.pathname === '/api/contact') {
    res.writeHead(503, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
    res.end(JSON.stringify({ ok:false, code:'not_configured' })); return;
  }
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, {Allow:'GET, HEAD'}); res.end(); return; }
  async function notFound() {
    res.writeHead(404, { 'Content-Type':'text/html; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(path.join(root,'404.html')));
  }
  try {
    let pathname;
    try { pathname = decodeURIComponent(requestUrl.pathname); }
    catch { res.writeHead(400); res.end('Bad request'); return; }
    if (basePath && pathname === '/') { res.writeHead(302, { Location:`${basePath}/` }); res.end(); return; }
    if (basePath && pathname === basePath) { res.writeHead(301, { Location:`${basePath}/${requestUrl.search}` }); res.end(); return; }
    if (basePath && !pathname.startsWith(`${basePath}/`)) { await notFound(); return; }
    const localPath = pathname.slice(basePath.length);
    let file = path.resolve(root, '.' + localPath);
    if ((file !== root && !file.startsWith(root + path.sep)) || localPath.split('/').some(p => p.startsWith('.') && p !== '.nojekyll')) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(301, {Location:requestUrl.pathname+'/'+requestUrl.search}); res.end(); return; }
      file = path.join(file, 'index.html');
    }
    const buffer = await readFile(file);
    res.writeHead(200, { 'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : buffer);
  } catch { await notFound(); }
});
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`KS preview: http://localhost:${port}${basePath}/ — email delivery disabled.`));
