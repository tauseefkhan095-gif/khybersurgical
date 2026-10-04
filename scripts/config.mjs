/** Only this allowlisted public configuration can enter generated pages. */
import { normalizeBasePath } from '../src/paths.mjs';
export function buildConfig(env = process.env) {
  let origin = '';
  let urlPath = '';
  if (env.SITE_URL) {
    const candidate = new URL(env.SITE_URL);
    if (candidate.protocol !== 'https:' || candidate.username || candidate.password || candidate.search || candidate.hash) {
      throw new Error('SITE_URL must be an HTTPS site URL without credentials, query or fragment.');
    }
    origin = candidate.origin;
    urlPath = normalizeBasePath(candidate.pathname);
  }
  const basePath = normalizeBasePath(env.BASE_PATH || urlPath);
  if (urlPath && basePath !== urlPath) throw new Error('BASE_PATH must match the path in SITE_URL.');
  const contactEnabled = env.CONTACT_ENABLED === 'true';
  const turnstileSiteKey = env.PUBLIC_TURNSTILE_SITE_KEY || '';
  const githubPreview = env.DEPLOY_TARGET === 'github-pages';
  if (contactEnabled && githubPreview) throw new Error('GitHub Pages cannot run the included email function. Keep CONTACT_ENABLED=false.');
  if (contactEnabled && basePath) throw new Error('The included contact function expects a domain-root deployment. Leave BASE_PATH empty for live email.');
  if (contactEnabled && !turnstileSiteKey) throw new Error('PUBLIC_TURNSTILE_SITE_KEY is required when CONTACT_ENABLED=true.');
  if (env.INDEXABLE === 'true' && !origin) throw new Error('Set SITE_URL before enabling INDEXABLE.');
  return {
    siteUrl: origin,
    siteBaseUrl: origin ? `${origin}${basePath}` : '',
    basePath,
    contactEnabled,
    turnstileSiteKey,
    // Explicit opt-in: adding a real domain must not accidentally index draft content.
    preview: githubPreview || env.INDEXABLE !== 'true',
    contactEndpoint: '/api/contact'
  };
}
