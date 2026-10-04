/** Standalone HTML: all 44 localized pages, embedded photo-style media, CSS and JS.
 *  Works by opening the file directly. No dev server, package install or image CDN.
 *  Contact delivery deliberately stays disabled in the standalone review file.
 */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {locales,pagePaths} from '../src/catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages={};
const manifest=JSON.parse(await readFile(path.join(root,'dist/site-manifest.json'),'utf8'));
const prefix=manifest.basePath || '';
const unbase=html=>prefix ? html.split('="'+prefix+'/').join('="/') : html;
for(const l of locales)for(const p of pagePaths){
 const html=await readFile(path.join(root,'dist',l.code,p,'index.html'),'utf8');
 const [,body]=html.match(/<body[^>]*>([\s\S]*)<\/body>/);
 pages[`/${l.code}/${p}`]={body:unbase(body),title:html.match(/<title>([\s\S]*?)<\/title>/)[1],lang:l.tag,dir:l.dir,page:p.split('/')[0]||'home'};
}
const assets={};
for(const name of await readdir(path.join(root,'dist/assets/images'))){
 if(!/\.webp$/i.test(name))continue;
 assets[`/assets/images/${name}`]=`data:image/webp;base64,${(await readFile(path.join(root,'dist/assets/images',name))).toString('base64')}`;
}
const css=await readFile(path.join(root,'src/assets/styles.css'),'utf8');
const app=await readFile(path.join(root,'src/assets/app.js'),'utf8');
const safeJson=obj=>JSON.stringify(obj).replace(/</g,'\\u003c');
const setup=`
/* OPTIONAL: REPLACE PRODUCT IMAGES HERE.
   Leave empty to use the embedded temporary photo-style assets.
   To use your own photos, set a relative path ("images/infusion.webp"),
   an HTTPS URL, or a data:image/... URL. A change applies to EVERY language/page.
   The current images are AI-generated visual placeholders, not KS product photos.
*/
window.KS_IMAGE_OVERRIDES = {
  hero: "", infusion: "", cannula: "", syringe: "",
  blood: "", glove: "", burette: ""
};
`;
const bootstrap=`
window.__KS_PORTABLE=true;
const KS_PAGES=${safeJson(pages)};
const KS_ASSETS=${safeJson(assets)};
let ksRoute='';
function ksAttribute(value){return String(value).replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));}
function ksImage(src){
 const key=src.split('/').pop().replace(/\\.webp$/,'');
 return window.KS_IMAGE_OVERRIDES?.[key] || KS_ASSETS[src] || src;
}
function renderKS(href, replace=false){
 const next=new URL(href,'https://ks-preview.invalid');
 let pathname=next.pathname.endsWith('/')?next.pathname:next.pathname+'/';
 if(!KS_PAGES[pathname])pathname='/en/';
 const page=KS_PAGES[pathname];
 window.__KS_URL=pathname+next.search;
 document.documentElement.lang=page.lang;document.documentElement.dir=page.dir;
 document.title=page.title;
 // Resolve every image before adding it to the document: no broken local-file requests.
 document.body.innerHTML=page.body.replace(/(<img\\b[^>]*?\\bsrc=)"([^"]*)"/g,(_,prefix,src)=>prefix+'"'+ksAttribute(ksImage(src))+'"');
 document.body.dataset.page=page.page;
 const data=document.getElementById('site-data');const c=JSON.parse(data.textContent);c.contactEnabled=false;c.basePath='';data.textContent=JSON.stringify(c);
 ksRoute=window.__KS_URL;
 const hash='#'+ksRoute;
 try{if(replace)history.replaceState(null,'',hash);else if(location.hash!==hash)history.pushState(null,'',hash);}catch{}
 window.scrollTo(0,0);
 document.dispatchEvent(new Event('ks:navigate'));
}
window.__KS_NAVIGATE=renderKS;
document.addEventListener('click',event=>{
 const a=event.target.closest('a[href]');if(!a||event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
 const href=a.getAttribute('href');
 if(href==='#main'){event.preventDefault();document.getElementById('main')?.focus();return;}
 if(!/^\\/(en|ar|fa|tr)\\//.test(href)||a.hasAttribute('data-locale-link'))return;
 event.preventDefault();renderKS(href);
 // Move keyboard/assistive-technology context to the new page without moving the viewport.
 document.getElementById('main')?.focus({preventScroll:true});
});
window.addEventListener('popstate',()=>{const route=location.hash.slice(1);if(route!==ksRoute)renderKS(route||'/en/',true);});
renderKS(location.hash.startsWith('#/')?location.hash.slice(1):'/en/',true);
`;
const output=`<!DOCTYPE html>
<!-- KS / PHOTOGRAPHY EDITION / v1.2.0
     This is the functional website, not a screenshot. All pages and product media
     are embedded. Temporary photo-style images are AI-generated and should be
     replaced with approved KS photos before publication. No cart or checkout.
     Contact form delivery requires the backend configuration in the source project.
-->
<html lang="en-IN" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#18574a"><meta name="description" content="Explore the KS medical-supplies catalogue and prepare a product enquiry in English, Arabic, Persian or Turkish."><title>KS Medical Supplies</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${css}</style></head><body><noscript><main style="max-width:650px;margin:80px auto;padding:24px"><h1>KS Medical Supplies</h1><p>This standalone edition uses JavaScript to display its product catalogue and language options. Please enable JavaScript, or use the static pages in the source package.</p></main></noscript><script>${setup.replace(/<\/script/gi,'<\\/script')}</script><script>${bootstrap.replace(/<\/script/gi,'<\\/script')}</script><script>${app.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
await writeFile(path.join(root,'preview.html'),output);
console.log('Created preview.html: 44 localized pages, 7 embedded photo-style assets, interactive depth, no email delivery.');
