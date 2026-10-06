# Khyber Surgical website update — 6 October 2026

The updated website keeps the white/deep-green design, six product categories and English, Arabic, Persian and Turkish pages. It remains an inquiry catalogue without online purchasing.

## Completed

- Replaced the temporary company name with Khyber Surgical throughout page content and metadata.
- Added the confirmed address: A 187, Shaheen Bagh, Thokar No. 6, Okhla, New Delhi. The Maps link searches this address; it is not a verified business listing.
- Added the displayed telephone +91 72176 48896, call links, and WhatsApp links to +917217648896.
- Added direct contacts beside the form and in the shared footer. WhatsApp is inline to avoid introducing another floating widget.
- The standalone preview inquiry form validates details and prepares a complete WhatsApp message. The static deployment inquiry form submits to the confirmed email inbox. The visitor must review and press Send within WhatsApp; opening the message does not send it.
- Prepared optional FormSubmit email delivery for static hosting, including GitHub repository paths. Kept its default CAPTCHA and provider result page, preserved inquiry drafts, and allowed its form destination in CSP.
- Added clickable mailto contacts for khybersurgicalindia@gmail.com on all pages. A mailto link opens a new message in the visitor’s configured mail app; it does not send automatically.
- Updated product image wording and inquiry-processing privacy text. Existing product photographs remain AI-generated placeholders.

## Surgical logo applied

The owner requested an updated identity visibly related to the surgical industry. The implemented mark is an original stylised scalpel with a short curved blade, grip details, and a restrained sage inset. It is paired with the full Khyber Surgical name in outlined Manrope lettering. The current green palette is retained.

The logo is applied in the shared header/footer, photography-story signature, automated catalogue-guide avatar and favicon. Arabic/Persian pages change layout direction without mirroring the artwork. The standalone preview embeds the same SVG paths and favicon, so the artwork has no image-server or installed-font dependency.

Production SVGs and monochrome/reversed variants, a transparent PNG, editable text master, exact source font and SIL Open Font License are provided in BRAND. The small favicon simplifies the grip from three grooves to two enlarged cutouts. Earlier generic letter/link concepts are superseded and are excluded from this production package. The surgery association is a visual-design choice, not a claim that specific instruments are stocked. No trademark clearance is claimed.

## Email configured; activation and hosting verification pending

The owner confirmed khybersurgicalindia@gmail.com as the business inbox. The static deployment now shows clickable email links and routes inquiry submissions to this inbox through FormSubmit. Inbox activation and real delivery have not been tested. The live website/repository URL is still needed to verify the hosting path. No website has been pushed to GitHub or published by this update.

Run npm run build:deploy to rebuild the static deployment with the confirmed inbox. The build defaults to CONTACT_PROVIDER=formsubmit and CONTACT_EMAIL=khybersurgicalindia@gmail.com; an environment CONTACT_EMAIL can override the recipient. Run npm run check before the final deployment build, because check/export:index generate email-disabled review output. Use dist/ for the real deployment, or the supplied DEPLOY/ files. The source-root portable index.html remains a review file and does not submit email forms. The first hosted submission requires the inbox owner to activate the FormSubmit confirmation email. Confirm activation and test actual inbox delivery before relying on email inquiries. Provider documentation: https://formsubmit.co/ and https://formsubmit.co/documentation . Using email delivery introduces FormSubmit as a submission processor; the privacy page describes this intended setup.

The included deploy package is for the existing root-hosted website. If the actual URL is a GitHub project URL such as https://owner.github.io/repository/, rebuild with BASE_PATH=/repository before deployment. Do not upload a root build to a repository path without rebuilding it. The standalone HTML preview uses hash links and can be opened directly; its email delivery is intentionally disabled.

## Verification

44 Node checks passed in the final check, including HTTP routes at both root and repository paths, locale key completeness, form-provider configuration, backend tests, built links and portable HTML syntax. Static verification checked 46 HTML pages and 1,720 internal references. The scalpel logo SVGs were rendered and visually reviewed. Static integration checks confirmed new header/footer/story/chat artwork on all 46 HTML pages, no duplicate DOM IDs, embedded portable-logo/favicons, and unchanged inquiry recipient and catalogue references. CSS header budgets were checked at 320, 351, 360 and 390 pixels; these are source calculations rather than rendered-browser verification.

The supplied baseline desktop/mobile screenshots were reviewed. New website layouts and browser form interactions have not been visually verified: no local Chromium is installed and the available browser cannot open the local preview URL. Client inquiry logic was tested with a DOM fixture against the actual application: validation, WhatsApp payloads, native form submission configuration, draft retention and failure recovery. Popup behavior, browser navigation, email acceptance and inbox delivery remain unverified. Translation additions have not been reviewed by native speakers.

## Suggested next improvements

Keep the current visual direction. Replace generated product images with actual inventory photos, add confirmed model specifications and packaging, and test a complete real buyer inquiry on the live site. Do not add unconfirmed certifications, response times, stock guarantees, or delivery promises.
