/** Stable identifiers are independent of translations; never use translated text as keys. */
export const products = [
  { id: 'iv-infusion-sets', category: 'infusion', art: 'infusion', ref: 'KS-01' },
  { id: 'iv-cannulas', category: 'access', art: 'cannula', ref: 'KS-02' },
  { id: 'syringes', category: 'access', art: 'syringe', ref: 'KS-03' },
  { id: 'blood-transfusion-sets', category: 'infusion', art: 'blood', ref: 'KS-04' },
  { id: 'medical-gloves', category: 'protection', art: 'glove', ref: 'KS-05' },
  { id: 'measured-volume-sets', category: 'infusion', art: 'burette', ref: 'KS-06' }
];
export const locales = [
  { code: 'en', name: 'English', region: 'India', dir: 'ltr', tag: 'en-IN' },
  { code: 'ar', name: 'العربية', region: 'العراق · الإمارات', dir: 'rtl', tag: 'ar' },
  { code: 'fa', name: 'فارسی', region: 'ایران', dir: 'rtl', tag: 'fa' },
  { code: 'tr', name: 'Türkçe', region: 'Türkiye', dir: 'ltr', tag: 'tr' }
];
export const pagePaths = ['', 'products/', ...products.map(p => `products/${p.id}/`), 'about/', 'contact/', 'privacy/'];
