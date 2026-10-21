# Khyber Surgical — website hosting package

This folder is the complete, already-built website. There is nothing to install or build.
Upload the **contents** of this folder (not the folder itself) to the root of your web host so that
`index.html` sits at the top level, next to `vercel.json`, `assets/`, `en/`, `ar/`, `fa/` and `tr/`.

```text
index.html          ← default entry (English; remembers the visitor's language choice)
404.html            ← branded "page not found"
robots.txt          ← allows search engines (built with INDEXABLE=true)
vercel.json         ← Vercel settings + security headers (ignored by other hosts)
.nojekyll           ← needed only by GitHub Pages; harmless elsewhere
assets/             ← styles.css, app.js, favicon.svg, brand/ (logos), images/ (18 photos), catalogue/ (PDF)
en/ ar/ fa/ tr/     ← 25 pages per language: home, products, 18 product pages, about, team, FAQ, contact, privacy
```

## Hosting on your own domain

### Option A — Vercel (recommended; free tier is enough)
1. Put these files in a GitHub repository (top level = these files), or drag the folder into
   Vercel's "New project → Import" screen.
2. Project settings → Build and Deployment: Framework **Other**, Root Directory **blank**,
   Build Command **empty**, Install Command **empty**, Output Directory **.**
   (`vercel.json` sets the same values, but a Root Directory saved earlier must be cleared by hand.)
3. Settings → Domains → add your domain and follow the DNS instructions (an `A` record to
   `76.76.21.21` or a `CNAME` to `cname.vercel-dns.com`). HTTPS is automatic.

### Option B — Netlify / Cloudflare Pages
Drag-and-drop this folder as a site (no build command, publish directory = this folder), then add
the domain in the dashboard. Netlify ignores `vercel.json`; if you want the same security headers,
add a `_headers` file (the editable source contains one under `public/_headers`).

### Option C — cPanel / shared hosting (Hostinger, GoDaddy, Bluehost, …)
Upload everything into `public_html/` (or the folder your domain points to) with the File Manager
or FTP. The site works as plain files; make sure directory indexes are enabled so that `/en/`
serves `/en/index.html` (this is the default on Apache and Nginx hosts).

After the first deploy, open `/`, `/en/products/`, one product page, `/ar/` and reload the product
page directly — all must load. Then check `/this-page-does-not-exist` shows the branded 404.

## Enquiry form → email (FormSubmit)

Every "Request a quote" / "Send enquiry" submission is posted to **formsubmit.co** for the inbox
configured at build time (`CONTACT_EMAIL`), as a table with name, email, organisation, phone,
country, product, quantity and message; reply-to is the enquirer's address.

**One-time activation:** the first submission from the live site (or from the preview file) makes
FormSubmit send an "Activate form" email to that inbox. Click it once. Until that click, enquiries
are **not** delivered. Submit a second test afterwards and confirm it arrives.

If enquiries do not arrive: check Spam, confirm the activation link was clicked, and check the
browser console for a blocked request to `formsubmit.co` (the Content-Security-Policy in
`vercel.json` already allows it).

## Search engines

This package was built with indexing **on** (`robots.txt` allows crawling, no `noindex` tag).
Once the final domain is known, rebuild from the source with `SITE_URL=https://your-domain.com`
to add canonical links, `hreflang` alternates and a `sitemap.xml`, then submit the sitemap in
Google Search Console.

## Changing content later

Edit the **source package** (the `…-SOURCE.zip`), not these built files:

- Product names, descriptions, options and FAQs: `src/locales/{en,ar,fa,tr}.json`
- Product list, categories, codes and image names: `src/catalog.mjs`
- Images: replace files in `src/assets/images/` (WebP, 1200×900 recommended, same filenames)
- Contact details and indexing: `.env` (`CONTACT_EMAIL`, `CONTACT_PHONE`, `CONTACT_WHATSAPP`,
  `CONTACT_ADDRESS`, `SITE_URL`, `INDEXABLE`)
- Colours, type and layout: `src/assets/styles.css`; page structure: `src/templates/`

Then run `python3 scripts/package.py --out ../packages` (needs Node 22+ and Python 3) to get a new
HOST zip, or `npm run build` for just the `dist/` folder. `npm test` runs the 30 checks.

## Placeholders to replace

Sections marked with an amber **Placeholder** badge hold sample content: trusted-by logos, licences &
certificates, testimonials, team members, and the greyed social icons. Send the real material (scans,
quotes with names, team names/roles/photos, profile URLs) and rebuild from the source.

## Not included / still to do

- Product photos are AI-generated placeholders in a studio style; replace with real photographs
  when available (same filenames in `src/assets/images/`).
- Translations (Arabic, Persian, Turkish) were produced without a native-speaker review.
- The privacy page is a draft: add the legal entity name and retention details before relying on it.
- No cart, checkout, payments, analytics or cookies are included by design.
