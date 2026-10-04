import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildConfig } from '../scripts/config.mjs';
import { normalizeBasePath } from '../src/paths.mjs';
import { verifyBuild } from '../scripts/verify.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = 'dist-subpath-test';
const clean = { ...process.env, SITE_URL:'', BASE_PATH:'', CONTACT_ENABLED:'false', INDEXABLE:'false',
  DEPLOY_TARGET:'', PUBLIC_TURNSTILE_SITE_KEY:'', KS_IGNORE_ENV_FILE:'true', BUILD_DIR:fixture };
function build(extra) {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd:root, env:{...clean,...extra}, encoding:'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
test('Paths normalize and reject URLs, traversal and unsafe characters', () => {
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(normalizeBasePath('/ks-medical-website/'), '/ks-medical-website');
  for (const value of ['https://example.com','//example.com','/../test','/a//b','/a?b','/a\\b']) {
    assert.throws(() => normalizeBasePath(value));
  }
});
test('Build configuration derives project paths without losing the repository name', () => {
  const config = buildConfig({ SITE_URL:'https://example.github.io/ks-medical-website/' });
  assert.equal(config.basePath, '/ks-medical-website');
  assert.equal(config.siteBaseUrl, 'https://example.github.io/ks-medical-website');
  assert.equal(config.preview, true);
  assert.throws(() => buildConfig({ SITE_URL:'https://example.com/a', BASE_PATH:'/b' }));
});
test('Unsafe domain settings and unconfigured email fail closed', () => {
  for (const url of ['http://example.com','https://user:pass@example.com','https://example.com/?secret=x']) {
    assert.throws(() => buildConfig({SITE_URL:url}));
  }
  assert.throws(() => buildConfig({CONTACT_ENABLED:'true'}));
  assert.throws(() => buildConfig({CONTACT_ENABLED:'true',PUBLIC_TURNSTILE_SITE_KEY:'test',DEPLOY_TARGET:'github-pages'}));
  assert.throws(() => buildConfig({CONTACT_ENABLED:'true',PUBLIC_TURNSTILE_SITE_KEY:'test',BASE_PATH:'/ks'}));
  assert.throws(() => buildConfig({INDEXABLE:'true'}));
});
test('Indexing requires explicit approval; GitHub preview never enables it', () => {
  assert.equal(buildConfig({SITE_URL:'https://example.com'}).preview, true);
  assert.equal(buildConfig({SITE_URL:'https://example.com',INDEXABLE:'true'}).preview, false);
  assert.equal(buildConfig({SITE_URL:'https://example.com',INDEXABLE:'true',DEPLOY_TARGET:'github-pages'}).preview, true);
});
test('Complete repository-path build resolves every local reference and canonical', async () => {
  try {
    build({ SITE_URL:'https://example.github.io', BASE_PATH:'/ks-medical-website', DEPLOY_TARGET:'github-pages' });
    const report = await verifyBuild(path.join(root, fixture));
    assert.equal(report.pages,46);
    assert.ok(report.references > 1000);
    const html = await readFile(path.join(root,fixture,'ar/products/iv-cannulas/index.html'),'utf8');
    assert.ok(html.includes('href="https://example.github.io/ks-medical-website/ar/products/iv-cannulas/"'));
    assert.ok(html.includes('src="/ks-medical-website/assets/app.js"'));
    assert.ok(html.includes('noindex,nofollow'));
    const sitemap = await readFile(path.join(root,fixture,'sitemap.xml'),'utf8');
    assert.ok(sitemap.includes('https://example.github.io/ks-medical-website/fa/products/syringes/'));
    assert.ok(!sitemap.includes('/ks-medical-website/ks-medical-website/'));
  } finally { await rm(path.join(root,fixture),{recursive:true,force:true}); }
});
test('A configured production root build generates indexable URLs without changing source', async () => {
  try {
    build({SITE_URL:'https://ks.example',INDEXABLE:'true'});
    assert.equal((await verifyBuild(path.join(root,fixture))).basePath,'/');
    const html = await readFile(path.join(root,fixture,'en/index.html'),'utf8');
    assert.ok(!html.includes('noindex,nofollow'));
    assert.ok(html.includes('href="https://ks.example/en/"'));
    const robots = await readFile(path.join(root,fixture,'robots.txt'),'utf8');
    assert.ok(robots.includes('Sitemap: https://ks.example/sitemap.xml'));
  } finally { await rm(path.join(root,fixture),{recursive:true,force:true}); }
});
test('Preview forms cannot submit while JavaScript is unavailable', async () => {
  const html=await readFile(new URL('../dist/en/contact/index.html',import.meta.url),'utf8');
  assert.ok(/class="button form-submit" type="submit" disabled/.test(html));
});
