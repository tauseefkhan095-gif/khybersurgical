# KS launch checklist

## Business and product content

- [ ] Confirm the final brand name and legal business identity.
- [ ] Add a real business address, phone and direct enquiry email; do not use placeholder contact details.
- [ ] Approve the six product categories and replace AI-generated photographic placeholders with approved photographs of the actual supplied products.
- [ ] Update placeholder disclosures and image alt text in all four languages after replacing the generated images.
- [ ] Confirm model-specific specifications, materials, sizes, packaging and documentation.
- [ ] Verify any certification and market-availability statement before publishing it.
- [ ] Have Arabic, Persian and Turkish reviewed by qualified native-language reviewers.
- [ ] Confirm whether the Iraqi audience also needs Kurdish in a later release.

## Privacy and security

- [ ] Finalize the privacy notice, data controller, contact method, retention schedule and rights information.
- [ ] Review the Google Fonts connection and email/security service providers for the deployment.
- [ ] Confirm that no patient information should be collected.
- [ ] Add a host-side contact-endpoint rate limit.
- [ ] Use a verified sender and fixed recipient, server-side secrets, same-origin submission and required Turnstile validation.
- [ ] Review hosting security headers and apply HSTS only once the real HTTPS domain is correctly configured.

## Configuration

- [ ] Set `SITE_URL` to the real HTTPS origin and keep `BASE_PATH` empty for the live email-enabled site.
- [ ] Set `INDEXABLE=true` only after content and launch approval.
- [ ] Keep source on GitHub and choose an appropriate business host; review GitHub Pages restrictions before using its optional preview workflow.
- [ ] Add the Turnstile public site key and enable contact delivery at build time.
- [ ] Add server-side Resend and Turnstile credentials, recipient inbox and hostname.
- [ ] Deploy using a method that includes the sibling `functions/` directory, not only `dist/`.
- [ ] Rebuild the site and verify canonical URLs, language alternates, sitemap and robots.

## Acceptance testing

- [ ] Submit a genuine enquiry, verify arrival in the real inbox, and check reply-to routing.
- [ ] Verify that invalid security tokens and provider failures never display a success message.
- [ ] Test duplicate clicks, slow connections, expired security tokens and quota limits.
- [ ] Review all four languages on phones, tablets and desktop, with the actual Google Fonts loaded.
- [ ] Test Safari/iOS, keyboard-only navigation and a screen reader.
- [ ] Test 200% text zoom, reduced motion and high-contrast settings.
- [ ] Check that the chatbot is labelled automated, gives no clinical advice and makes no stock or price promises.
- [ ] Verify that there are no cart, checkout, payment or unintended order-placement routes.
