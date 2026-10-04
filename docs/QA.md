# Handoff checks — version 1.2.0

## Completed in this handoff

- 26 Node tests: locale keys, product content, all 44 localized pages, source-secret checks, contact validation/provider mocks, image assets, GitHub-prefix URLs, indexing gates, no-JavaScript preview safeguards and real local HTTP responses.
- The root-domain and repository-prefix builds each contain 46 HTML files. Link verification checks 1,720 local href/src references per build.
- Local HTTP tests fetch all 44 localized pages at both `/` and `/ks-medical-website/`. They check WebP response types and signatures, CSS/JavaScript content types, slash redirects, 404 navigation, denied dotfiles and the email-disabled endpoint.
- 41 Chromium checks against the portable HTML, including 160 viewport/language/page combinations. These cover interactive navigation, filters, localized search, form drafts, form validation, product preselection, automated chatbot replies, image enlargement, keyboard focus, reduced motion and pointer-driven CSS depth.

Raw results: `node-test-results.txt` and `browser-results.json`. Screenshots use the actual generated website, not a new static image mockup.

## What these checks do not establish

They are not a full WCAG audit, security audit, regulatory assessment or business-content sign-off. Provider calls are mocked in Node tests. No real customer enquiry, email service, Turnstile account or production deployment was tested.

The test environment blocked external Google Fonts and direct browser navigation to HTTP URLs. The portable browser suite therefore used `set_content` with embedded images and the fallback fonts. Node's HTTP client separately tested the actual local server. The browser-based `tests/hosted-check.py` could not complete here due to the browser environment's URL-navigation restriction; it is included as a developer-run test, not marked passed.

The GitHub Actions YAML is included and structurally checked locally, but has not been executed in your GitHub repository. Account permissions, Pages availability, organization policies, the actual public URL and live deployment remain to be verified.

## Reproduce the completed checks

```sh
npm run check
```

For optional browser checks on a developer machine with Python:

```sh
python -m pip install playwright
python -m playwright install chromium
python tests/browser-check.py
python tests/hosted-check.py
```

The browser scripts use `CHROMIUM_EXECUTABLE` when supplied, a system Chromium when available, or Playwright's installed browser. Browser dependencies are optional and are not part of the website's build or runtime.

Before launch, test on actual iOS/Safari, keyboard-only input, screen readers, 200% text zoom, your production fonts, real mobile devices and the deployed email flow. Use `LAUNCH-CHECKLIST.md` for the remaining sign-off items.
