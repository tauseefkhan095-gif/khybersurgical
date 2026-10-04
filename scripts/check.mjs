/** Always check a safe preview build, regardless of a developer's local .env. */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env, KS_IGNORE_ENV_FILE:'true', BUILD_DIR:'dist', SITE_URL:'', BASE_PATH:'',
  INDEXABLE:'false', CONTACT_ENABLED:'false', PUBLIC_TURNSTILE_SITE_KEY:'', DEPLOY_TARGET:'' };
const tests = readdirSync(new URL('../tests/',import.meta.url)).filter(file => file.endsWith('.test.mjs')).sort().map(file => `tests/${file}`);
for (const args of [['scripts/build.mjs'],['scripts/portable.mjs'],['--test',...tests],['scripts/verify.mjs']]) {
  const result = spawnSync(process.execPath,args,{cwd:root,env,stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
