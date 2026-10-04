/** Shared build-time paths. No framework or browser-side router is required. */
let basePath = '';
export function normalizeBasePath(value = '') {
  const input = String(value).trim();
  if (!input || input === '/') return '';
  if (!input.startsWith('/') || input.startsWith('//') || /[?#\\]/.test(input)) {
    throw new Error('BASE_PATH must be a local path such as /ks-medical-website, not a URL.');
  }
  const normalized = input.replace(/\/+$/, '');
  const segments = normalized.slice(1).split('/');
  if (segments.some(s => !/^[A-Za-z0-9._~-]+$/.test(s) || s === '.' || s === '..')) {
    throw new Error('BASE_PATH contains an invalid or unsafe path segment.');
  }
  return normalized;
}
export function setBasePath(value) { basePath = normalizeBasePath(value); }
export const sitePath = (suffix = '') => `${basePath}/${String(suffix).replace(/^\/+/, '')}`;
export const url = (lang, suffix = '') => sitePath(`${lang}/${suffix}`);
export const assetUrl = suffix => sitePath(`assets/${suffix}`);
