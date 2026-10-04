# KS — complete, ready-to-upload website

This package replaces ALL previous KS deployment packages. It is already built.
Upload these files to the top level of your GitHub repository and let Vercel serve them directly.
There are no dependencies, installation commands, build commands, or generated folders to manage.

## Replace the old repository contents

1. Keep a backup of any custom changes you have made. Remove the old website files from the working tree, including the old package.json, public/, src/, scripts/, dist/, functions/, wrangler.jsonc, and .github/workflows/ when present. Do not remove your local .git directory or delete your GitHub repository/account.
2. Extract this ZIP on your computer. Upload everything INSIDE the extracted folder, not the ZIP itself and not an extra wrapper folder. The repository's top level must show index.html and vercel.json side by side, along with assets/, en/, ar/, fa/, and tr/.
3. Commit the replacement to the branch Vercel tracks for production. Remove the obsolete files and add the replacements in the same commit when practical.

Expected repository layout:

```text
index.html
vercel.json
404.html
robots.txt
README.md
.nojekyll
assets/
  app.js
  styles.css
  favicon.svg
  images/
    hero.webp
    infusion.webp
    cannula.webp
    syringe.webp
    blood.webp
    glove.webp
    burette.webp
en/
ar/
fa/
tr/
```

The four language folders contain REAL HTML pages, including product-detail pages.
Do not move assets into public/ or put the complete website inside dist/.

## Vercel: check this once before redeploying

Open your Vercel project → Settings → Build and Deployment.

| Setting | Value for THIS package |
| --- | --- |
| Root Directory | Repository root. Leave blank, or use ./ when that is how the dashboard displays root. |
| Framework Preset | Other |
| Build Command | Empty — no build. Remove the old npm run build value. |
| Install Command | Empty — no installation. Remove the old npm ci value. |
| Output Directory | . (one period, meaning the root folder) |

The included vercel.json explicitly sets Other, skips install/build, and publishes the current folder. It overrides the matching build settings for deployments that read this file. It CANNOT reset a Root Directory that is still pointing to an old subfolder. Clear that old subfolder path in the dashboard.

Also ensure the project is still connected to the intended GitHub repository and production branch. This package does not alter your account, domain, branch, or project settings.

Deploy the commit containing THIS package. Open the new successful production deployment, not an earlier failed preview URL. Changes to settings require a new deployment. Do not run the previous GitHub Actions build or Cloudflare build instructions for this package.

Official references (checked 4 October 2026):
- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/project-configuration/vercel-json

## What is included

- Homepage, six-category product catalogue, individual product pages, About, Contact, privacy draft, and branded 404.
- English, Arabic, Persian, and Turkish. Arabic and Persian use right-to-left layouts.
- Temporary AI-generated photographic-style product assets, image enlargement, and restrained 3D-style tilt effects with reduced-motion support.
- Responsive layouts, search and category filters, localized validation, and the automated catalogue chatbot.
- No cart, checkout, or payments.

The site files can be edited directly. Styling is in assets/styles.css and behaviour is in assets/app.js. Each language/page has its own HTML file.

## Product photographs

Replace assets/images/hero.webp, infusion.webp, cannula.webp, syringe.webp, blood.webp, glove.webp, and burette.webp with approved WebP photographs using the same filenames. All pages reference these files. The current images are AI-generated placeholders, not photographs of actual KS stock. After replacing every placeholder, update the image disclosures and alt text in each language appropriately. Do not remove the disclosures while generated placeholders remain.

## Important launch limitations

The contact form is included but EMAIL DELIVERY IS NOT CONNECTED. It validates information and explicitly says that the enquiry has not been sent. No inbox, API key, or live sending backend is configured. This package has no server function. Do not try to enable email by changing only a frontend flag; a secure backend or form service and end-to-end inbox test are still required. Never put API keys into HTML or JavaScript.

The chatbot is a rule-based product guide, not generative AI or live staff.

Confirm product specifications, company identity/contact details, privacy content, and translations before public business launch. The current pages deliberately contain noindex,nofollow and robots.txt blocks crawling. Those settings need to be reviewed when the content is approved; a live domain alone does not make this an approved/indexable production site.

Google Fonts are requested from Google; local fallback fonts are available when those requests fail. Font files are not bundled.

## Local preview (optional)

This is a root-hosted multi-page website, not the old portable single-file preview. Do not judge it by double-clicking an individual HTML file: its /assets and /en links expect a web server rooted in this folder. From this folder, a local static server such as `python3 -m http.server 8080` will work. Vercel serves that root automatically when configured above.

Open the root, /en/products/, a product detail page, and /ar/ after deployment. Reload the detail page to verify its direct URL.

## Verification and boundaries

The supplied pages and assets were checked locally. The accompanying CHECKS.txt records file, link, image, JavaScript-syntax, and static-HTTP checks; browser navigation was blocked in this environment. The finished ZIP was then cleanly extracted and compared byte-for-byte with the checked files. This is not confirmation of a live Vercel deployment. Domain configuration, project permissions, and repository linkage cannot be changed by a ZIP file.
