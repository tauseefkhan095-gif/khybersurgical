import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {locales,products,pagePaths} from '../src/catalog.mjs';
const flatten=(value,prefix='')=>Object.entries(value).flatMap(([key,v])=>typeof v==='object'&&v!==null?flatten(v,`${prefix}${key}.`):[`${prefix}${key}`]).sort();
const translations=Object.fromEntries(await Promise.all(locales.map(async l=>[l.code,JSON.parse(await readFile(new URL(`../src/locales/${l.code}.json`,import.meta.url),'utf8'))])));
test('All four locale files have complete matching translation keys',()=>{
 const baseline=flatten(translations.en);
 for(const l of locales)assert.deepEqual(flatten(translations[l.code]),baseline,l.code);
});
test('Six stable product identifiers have content in every locale',()=>{
 assert.equal(products.length,6);assert.equal(new Set(products.map(p=>p.id)).size,6);
 for(const l of locales)for(const p of products){const t=translations[l.code].products[p.id];assert.ok(t.name);assert.ok(t.description.length>30);assert.equal(t.focus.length,3);}
});
test('All 44 localized pages are built with language, direction and one h1',async()=>{
 assert.equal(locales.length*pagePaths.length,44);
 for(const l of locales)for(const page of pagePaths){
  const html=await readFile(new URL(`../dist/${l.code}/${page}index.html`,import.meta.url),'utf8');
  assert.ok(html.includes(`lang="${l.tag}" dir="${l.dir}"`));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${l.code}/${page}`);
  assert.ok(!html.includes('undefined'),`${l.code}/${page}`);
  assert.ok(html.includes('id="main"'));assert.ok(html.includes('id="site-data"'));
  for(const [,href] of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
   if(href==='/api/contact')continue;
   const file=new URL(`../dist${href}${href.endsWith('/')?'index.html':''}`,import.meta.url);
   assert.ok((await stat(file)).isFile(),href);
  }
 }
});
test('Static build includes no exposed service secrets, fake contact email or checkout',async()=>{
 const html=await readFile(new URL('../dist/en/contact/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('Email delivery is not connected yet'));
 assert.ok(!html.includes('RESEND_API_KEY'));
 assert.ok(!html.includes('TURNSTILE_SECRET_KEY'));
 assert.ok(!html.includes('mailto:'));
 assert.ok(!html.includes('Add to cart'));
});
test('Source has reduced-motion, semantic direction and live result support',async()=>{
 const css=await readFile(new URL('../src/assets/styles.css',import.meta.url),'utf8');
 const html=await readFile(new URL('../dist/ar/contact/index.html',import.meta.url),'utf8');
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('inset-inline-end'));
 assert.ok(html.includes('dir="rtl"'));
 assert.ok(html.includes('aria-live="polite"'));
});

// Regression: the main navigation is now the first visible page component.
test('Announcement strip is absent while the navigation and language selector remain on all pages',async()=>{
 const pages=locales.flatMap(l=>pagePaths.map(page=>`${l.code}/${page}index.html`));
 pages.push('index.html','404.html');
 for(const page of pages){
  const html=await readFile(new URL(`../dist/${page}`,import.meta.url),'utf8');
  assert.ok(!/class=["'][^"']*\btopbar\b/.test(html),page);
  assert.equal((html.match(/<header class="site-header"/g)||[]).length,1,page);
  assert.equal((html.match(/data-language-selector/g)||[]).length,1,page);
 }
 const css=await readFile(new URL('../src/assets/styles.css',import.meta.url),'utf8');
 assert.ok(!css.includes('.topbar'));
});

// Revision 1.1.0: photographic assets are local files, never product SVG drawings.
test('All product images are valid local WebP assets and details expose a larger-photo dialog',async()=>{
 for(const p of products){
  const image=await readFile(new URL(`../dist/assets/images/${p.art}.webp`,import.meta.url));
  assert.equal(image.toString('ascii',0,4),'RIFF');
  assert.equal(image.toString('ascii',8,12),'WEBP');
  for(const l of locales){
   const html=await readFile(new URL(`../dist/${l.code}/products/${p.id}/index.html`,import.meta.url),'utf8');
   assert.ok(html.includes(`/assets/images/${p.art}.webp`));
   assert.ok(html.includes('<dialog'));
   assert.ok(!/<img[^>]+src="[^"]+\.svg"/.test(html));
   assert.ok(translations[l.code].imagery.disclaimer.length>20);
  }
 }
});
test('Portable HTML embeds WebP images and exposes one replacement map',async()=>{
 const html=await readFile(new URL('../preview.html',import.meta.url),'utf8');
 assert.ok(html.includes('window.KS_IMAGE_OVERRIDES'));
 assert.ok(html.includes('data:image/webp;base64,'));
 assert.ok(html.includes('c.contactEnabled=false'));
 assert.ok(html.includes('data-depth'));
});
