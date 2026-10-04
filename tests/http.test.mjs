/** Actual local HTTP checks, independent of a browser or third-party test runner. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { locales, pagePaths } from '../src/catalog.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
async function availablePort() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return port;
}
for (const basePath of ['', '/ks-medical-website']) {
  test(`Local HTTP serves pages, WebP assets, redirects and 404 at ${basePath || '/'}`, { timeout: 20000 }, async () => {
    const folder = 'dist-server-test';
    const port = await availablePort();
    const env = { ...process.env, KS_IGNORE_ENV_FILE:'true', BUILD_DIR:folder, BASE_PATH:basePath,
      SITE_URL:'https://test.example', CONTACT_ENABLED:'false', PUBLIC_TURNSTILE_SITE_KEY:'', INDEXABLE:'false', DEPLOY_TARGET:'', PORT:String(port) };
    const built = spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,env,encoding:'utf8'});
    assert.equal(built.status,0,built.stderr);
    const server = spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
    try {
      await new Promise((resolve,reject) => {
        server.stdout.once('data',resolve);
        server.once('error',reject);
        server.once('exit',code => reject(new Error(`Server exited early: ${code}`)));
      });
      const origin = `http://127.0.0.1:${port}`;
      const imagePaths = new Set();
      for (const locale of locales) for (const page of pagePaths) {
        const response = await fetch(`${origin}${basePath}/${locale.code}/${page}`);
        assert.equal(response.status,200);
        assert.ok(response.headers.get('Content-Type').startsWith('text/html'));
        const html = await response.text();
        assert.ok(html.includes(`lang="${locale.tag}" dir="${locale.dir}"`));
        for (const [,src] of html.matchAll(/<img[^>]+src="([^"]+)"/g)) imagePaths.add(src);
      }
      assert.equal(imagePaths.size,7);
      for (const imagePath of imagePaths) {
        const response = await fetch(origin+imagePath);
        assert.equal(response.status,200);
        assert.equal(response.headers.get('Content-Type'),'image/webp');
        const image = Buffer.from(await response.arrayBuffer());
        assert.equal(image.toString('ascii',8,12),'WEBP');
      }
      const css = await fetch(`${origin}${basePath}/assets/styles.css`);
      assert.equal(css.status,200);
      assert.ok(css.headers.get('Content-Type').startsWith('text/css'));
      const script = await fetch(`${origin}${basePath}/assets/app.js`);
      assert.equal(script.status,200);
      assert.ok(script.headers.get('Content-Type').startsWith('text/javascript'));
      const redirect = await fetch(`${origin}${basePath}/en/products`,{redirect:'manual'});
      assert.equal(redirect.status,301);
      assert.equal(redirect.headers.get('Location'),`${basePath}/en/products/`);
      const missing = await fetch(`${origin}${basePath}/missing-page/`);
      assert.equal(missing.status,404);
      assert.ok((await missing.text()).includes(`href="${basePath}/en/"`));
      assert.equal((await fetch(`${origin}${basePath}/.env`)).status,403);
      const contact = await fetch(`${origin}/api/contact`,{method:'POST'});
      assert.equal(contact.status,503);
      assert.equal((await contact.json()).code,'not_configured');
    } finally {
      if (server.exitCode === null) { server.kill(); await once(server,'exit'); }
      await rm(path.join(root,folder),{recursive:true,force:true});
    }
  });
}
