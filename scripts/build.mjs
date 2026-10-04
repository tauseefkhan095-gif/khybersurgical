/** Render the complete static site. Run from any working directory with Node 22+. */
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, locales, pagePaths } from '../src/catalog.mjs';
import { layout, e } from '../src/templates/components.mjs';
import { home, catalog, detail, about, contact, privacy, notFound } from '../src/templates/pages.mjs';
import { setBasePath, url } from '../src/paths.mjs';
import { buildConfig } from './config.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.KS_IGNORE_ENV_FILE !== 'true') {
  try { process.loadEnvFile(path.join(root, '.env')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const config = buildConfig();
setBasePath(config.basePath);
// Alternate output names are used by isolated deployment tests. Never delete outside this project.
const outputName = process.env.BUILD_DIR || 'dist';
if (!/^dist(?:-[A-Za-z0-9_-]+)?$/.test(outputName)) throw new Error('BUILD_DIR must be dist or dist-<name>.');
const dist = path.join(root, outputName);
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await cp(path.join(root, 'src/assets'), path.join(dist, 'assets'), { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });
await writeFile(path.join(dist, 'assets/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#163d35"/><text x="32" y="43" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="30" fill="#e6efdb">KS</text></svg>`);
let count = 0;
for (const locale of locales) {
  const t = JSON.parse(await readFile(path.join(root, 'src/locales', `${locale.code}.json`), 'utf8'));
  for (const page of pagePaths) {
    let body, title;
    if (page === '') { body = home(t, locale.code); title = ''; }
    else if (page === 'products/') { body = catalog(t, locale.code); title = t.nav.products; }
    else if (page === 'about/') { body = about(t, locale.code); title = t.nav.about; }
    else if (page === 'contact/') { body = contact(t, locale.code, config); title = t.nav.contact; }
    else if (page === 'privacy/') { body = privacy(t, locale.code); title = t.common.privacy; }
    else {
      const product = products.find(p => page === `products/${p.id}/`);
      if (!product) throw new Error(`No template for ${page}`);
      body = detail(t, locale.code, product); title = t.products[product.id].name;
    }
    const dir = path.join(dist, locale.code, page);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), layout(t, locale, page, body, config, title));
    count++;
  }
  if (locale.code === 'en') {
    await writeFile(path.join(dist, 'index.html'), layout(t, locale, '', home(t, 'en'), config));
    await writeFile(path.join(dist, '404.html'), layout(t, locale, '', notFound(t, 'en'), { ...config, preview: true, siteUrl: '' }, '404'));
  }
}
// Noindex is intentional for this review build. Set INDEXABLE=true after approval.
await writeFile(path.join(dist, 'robots.txt'), !config.preview && config.siteBaseUrl
  ? `User-agent: *\nAllow: /\nSitemap: ${config.siteBaseUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
if (config.siteUrl) {
  const absolute = (lang, page) => e(new URL(url(lang, page), config.siteUrl).href);
  const entries = locales.flatMap(l => pagePaths.map(p => `<url><loc>${absolute(l.code,p)}</loc>${locales.map(alt => `<xhtml:link rel="alternate" hreflang="${alt.tag}" href="${absolute(alt.code,p)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${absolute('en',p)}"/></url>`)).join('');
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries}</urlset>`);
}
await writeFile(path.join(dist, '.nojekyll'), '');
await writeFile(path.join(dist, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }, null, 2));
await writeFile(path.join(dist, 'site-manifest.json'), JSON.stringify({
  version: '1.2.0', localizedPages: count, basePath: config.basePath,
  siteBaseUrl: config.siteBaseUrl, preview: config.preview,
  contactEnabled: config.contactEnabled, contactEndpoint: config.contactEndpoint,
  locales: locales.map(l => l.code)
}, null, 2));
console.log(`Built ${count} localized pages + entry point + 404 into ${outputName}/.`);
console.log(`Base path: ${config.basePath || '/'} | Indexing: ${config.preview ? 'off' : 'on'} | Email: ${config.contactEnabled ? 'configured; requires live backend' : 'not connected'}`);
