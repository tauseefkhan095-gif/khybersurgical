# Version 1.2.0 — GitHub project handoff

The visual direction from v1.1.0 is preserved. The announcement bar remains removed; images remain AI-generated photographic-style placeholders and the enquiry-only flow has no cart or checkout.

Added repository configuration, reproducible lockfile, GitHub validation workflow and an opt-in Pages preview workflow. Generated links, product assets, locale switching, chatbot routes and canonical URLs now support a repository prefix. A local HTTP server can simulate the same prefix.

The build uses an explicit indexing opt-in. Live contact delivery is disabled for GitHub Pages and guarded against unsupported subpath configurations. Real secrets never enter the public build. Preview form submission is disabled until JavaScript initializes, avoiding accidental no-JavaScript submissions. Language preferences and temporary form drafts are scoped by deployment prefix.

See START-HERE.md, docs/DEPLOYMENT.md and docs/QA.md for the current publishing instructions and test scope. Earlier implementation notes follow for reference.

---

# Revision 1.1.0 — photography applied to the actual website

## Implemented

- Replaced product SVG illustrations in all six catalogue categories and every localized product page with embedded WebP photographic-style placeholders.
- Rebuilt the hero as live HTML surrounding a photograph, with two real linked product-photo tiles. The mockup screenshot itself is not used as the website.
- Replaced decorative illustrated brand-card compositions with a layered photographic stack.
- Added subtle CSS perspective tilt to the hero and product-image surfaces for fine pointers. Pointer and motion-preference listeners are cleaned up on navigation; there is no continuous render loop, external 3D engine or device-motion access.
- Added native larger-image dialogs, Escape handling, focus restoration and localized controls.
- Added translated placeholder disclosures in English, Arabic, Persian and Turkish.
- Kept RTL layout, language switching, enquiry preselection/draft handling, filters, search, the contact form and the local support guide.
- Retained the removed announcement strip and the enquiry-only flow; no cart or checkout.
- Added a single image override map to the standalone HTML so future product photography can replace the placeholders without changing templates.

## Media and delivery status

The assets are cropped photographic regions of the AI-generated KS design concept from this conversation, not sourced manufacturer photographs or confirmed KS stock images. They are temporary visual placeholders and are not technically accurate product references. The current images should be replaced before public launch.

Email sending remains disconnected in the portable HTML. Backend credentials and a verified recipient/sender are still required for the separately supplied source deployment. No public deployment was performed.

## Validation

17 Node tests passed. 41 targeted Chromium checks passed, including 160 viewport/language/page combinations with no horizontal overflow. Browser tests also exercise photo dialogs, focus restoration, actual pointer-driven transforms, reduced motion, localization, form validation and chatbot behavior. This is not a complete accessibility or security audit. Tests used the standalone file content with fallback fonts; live email and production hosting were not tested.

## Earlier revision 1.0.1

Removed the slim announcement strip while preserving main navigation, language selection, brand mark and enquiry action.
