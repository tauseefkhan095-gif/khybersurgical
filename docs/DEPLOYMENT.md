# Deployment and live enquiry delivery

## Separate source control from hosting

GitHub stores and versions the code. The live site can be built from that repository on a host such as Cloudflare Pages. That is the intended live-business route for this package; it can run the included server-side contact function. The optional GitHub Pages workflow only publishes an email-disabled static preview.

GitHub Pages is a static hosting service, and its usage policy restricts online-business hosting and sites primarily facilitating commercial transactions. Do not assume the absence of a cart makes the live business catalogue eligible. Review `https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits` for your actual usage.

## Cloudflare Git integration

Connect the GitHub repository to a Cloudflare Pages project. Use a framework preset of None, branch `main`, root directory blank, build command `npm run build`, and output directory `dist`. Set `NODE_VERSION=22` in the build environment. The repository's `wrangler.jsonc` identifies the Pages build output and runtime compatibility date.

Do not use a static-files-only upload when enabling email: the sibling `functions/` directory must be deployed. A Git-connected Pages project includes the Pages Functions build. See `https://developers.cloudflare.com/pages/get-started/git-integration/` and `https://developers.cloudflare.com/pages/functions/get-started/`.

## Public build values

For a production domain-root deployment, set:

```text
SITE_URL=https://YOUR-REAL-DOMAIN
BASE_PATH=
INDEXABLE=false
CONTACT_ENABLED=false
PUBLIC_TURNSTILE_SITE_KEY=
```

Replace the domain; do not deploy that placeholder literally. Begin with indexing and delivery disabled. These settings are intentionally harmless without account configuration.

`SITE_URL` must be HTTPS with no credentials, query or fragment. For static review builds it can include a repository prefix, or `BASE_PATH` can supply the prefix separately. They must agree. Live contact delivery with the supplied same-origin function is supported at the domain root only.

After content approval, set `INDEXABLE=true` and rebuild to enable indexing metadata. Merely providing a real domain does not remove `noindex`.

## Connect real email

The implementation uses a Cloudflare Pages Function at `/api/contact`, the Resend email API, and Cloudflare Turnstile. You must configure your own accounts and verified domain. No services or credentials are provisioned in this package.

1. Select the actual recipient inbox and verify a sending domain with Resend.
2. Create a Turnstile widget for the live site's hostname.
3. Add the public Turnstile site key and set `CONTACT_ENABLED=true` in the build environment.
4. Add these server-side values through the Cloudflare Pages settings; keep secret credentials encrypted and out of the repository:

| Server-side setting | Purpose |
|---|---|
| `RESEND_API_KEY` | Secret email-service key |
| `CONTACT_FROM` | Verified sender, for example `KS Enquiries <enquiries@YOUR-DOMAIN>` |
| `CONTACT_TO` | Actual inbox that should receive enquiries |
| `TURNSTILE_SECRET_KEY` | Secret verification key |
| `TURNSTILE_HOSTNAME` | Exact live hostname, without scheme or path |

5. Redeploy to apply the build-time and runtime settings. Keep preview and production settings separate.
6. Apply an appropriate host-side rate limit to POST requests at `/api/contact`.
7. Send an end-to-end enquiry and verify arrival, reply-to routing and failure states in the actual account.

Never put a secret in `PUBLIC_TURNSTILE_SITE_KEY`, client JavaScript, translation files or a committed `.env`. The request controls neither the recipient nor the sender. Server-side validation, request-size bounds, same-origin checks and mandatory Turnstile verification fail closed when configuration is missing.

The function accepts only JSON browser requests from the same origin. A separately hosted API on another domain is **not** plug-and-play: it would require an intentional CORS, allowlist and security review rather than changing a public URL alone.

Provider acceptance is not a guarantee of inbox delivery. Actual service configuration, account eligibility, limits, deliverability and applicable obligations must be checked for the intended business and destinations.

Provider documentation:

- `https://resend.com/docs/api-reference/emails/send-email`
- `https://developers.cloudflare.com/turnstile/get-started/server-side-validation/`
- `https://developers.cloudflare.com/pages/functions/bindings/`

## GitHub Pages preview workflow

Enable Pages with Source = GitHub Actions and manually run `Deploy GitHub Pages preview`. It rebuilds for the actual `origin` and `base_path` supplied by `actions/configure-pages`, then uploads **only `dist/`**. It forces `CONTACT_ENABLED=false`, `INDEXABLE=false`, and `DEPLOY_TARGET=github-pages`.

For later automatic deployments, opt in with `ENABLE_PAGES_PREVIEW=true`. Without that variable, pushing the repository runs validation but does not publish. The deployment needs Pages write and OIDC permissions; the included workflow scopes those permissions to the deployment job.

The source-level `_headers` file is a Cloudflare feature, not a portable HTTP-header guarantee. GitHub Pages does not apply those configuration files as Cloudflare does. Review the actual response headers on the chosen live host.

A preview is still public when deployed; `noindex` is not authentication or privacy protection. Keep all confidential data out of the static build and repository.

## Replacing or moving a deployment

For a root domain, leave `BASE_PATH` empty. For a static subdirectory, use `/your-prefix` without a trailing slash; the builder normalizes it. The local server reads the generated `site-manifest.json` so it can simulate the same URL prefix. The code scopes stored language preferences and temporary language-switch drafts to that prefix.

To test a subdirectory locally, set `BASE_PATH=/ks-medical-website` in an ignored `.env`, rebuild, and run `npm run preview`. The server prints the correct local URL. Reset the value before a root-domain production build.

`npm run check` always generates a safe default review build. After running checks, run `npm run build` again with the production settings before a manual deployment.
