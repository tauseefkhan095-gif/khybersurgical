/** Check generated local links, images, page configuration and base-path correctness. */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => entry.isDirectory()
    ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return files.flat();
}
export async function verifyBuild(directory) {
  const manifest = JSON.parse(await readFile(path.join(directory, 'site-manifest.json'), 'utf8'));
  const prefix = manifest.basePath || '';
  let references = 0;
  const htmlFiles = (await walk(directory)).filter(f => f.endsWith('.html'));
  if (htmlFiles.length !== 46) throw new Error(`Expected 46 HTML files, found ${htmlFiles.length}`);
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    if (/<(?:img|script)[^>]+(?:src)="\/assets\//.test(html) && prefix) throw new Error(`Unprefixed asset in ${file}`);
    for (const [, attribute] of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
      const href = attribute.replaceAll('&amp;', '&');
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const pathname = href.split(/[?#]/)[0];
      if (prefix && !pathname.startsWith(prefix + '/')) throw new Error(`Link escapes base path: ${href}`);
      const local = pathname.slice(prefix.length).replace(/^\//, '');
      const target = path.resolve(directory, local, pathname.endsWith('/') ? 'index.html' : '');
      if (!target.startsWith(path.resolve(directory) + path.sep)) throw new Error(`Unsafe local reference: ${href}`);
      if (!(await stat(target)).isFile()) throw new Error(`Missing target: ${href}`);
      references++;
    }
    const data = JSON.parse(html.match(/<script id="site-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1] || '{}');
    if (data.basePath !== prefix) throw new Error(`Incorrect client base path in ${file}`);
    if (data.contactEnabled !== manifest.contactEnabled) throw new Error(`Incorrect contact state in ${file}`);
  }
  return { pages: htmlFiles.length, references, basePath: prefix || '/', contactEnabled: manifest.contactEnabled };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const name = process.env.BUILD_DIR || 'dist';
  if (!/^dist(?:-[A-Za-z0-9_-]+)?$/.test(name)) throw new Error('Invalid BUILD_DIR.');
  const report = await verifyBuild(path.join(root, name));
  console.log(`Verified ${report.pages} HTML pages and ${report.references} local references at ${report.basePath}.`);
}
