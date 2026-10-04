# Publish the KS project

## 1. Extract and upload the source to GitHub

Unzip `KS-GitHub-project.zip`. Open the `ks-medical-website` folder.

Create a new GitHub repository named `ks-medical-website` (another name also works). For the terminal route below, start with an **empty** repository: do not pre-add a README, license or .gitignore. These project files already include the relevant handoff documents and Git configuration.

Upload the **contents inside** `ks-medical-website` to the repository root, not the ZIP itself and not another wrapper folder. At the repository's top level you should see:

```text
README.md
START-HERE.md
package.json
package-lock.json
src/
scripts/
functions/
public/
tests/
docs/
.github/
```

Hidden files matter. Include `.github/`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`, and `.nvmrc`. Do not add a real `.env` or any service credentials.

### Browser upload

Use **Add file → Upload files**, drag in the extracted folder's contents, and commit to `main`. Show hidden files in your file browser before dragging so `.github/` is included. The project has fewer than 100 source files. GitHub's upload instructions are at `https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository`.

### Terminal alternative

From inside the extracted project folder, replace `YOUR-USERNAME` and the repository name as needed:

```sh
git init
git branch -M main
git add .
git commit -m "Add KS medical supplies website"
git remote add origin https://github.com/YOUR-USERNAME/ks-medical-website.git
git push -u origin main
```

Authenticate using your normal Git/GitHub sign-in method. These commands are for a new empty repository, not an existing project with its own history.

The `Validate website` workflow should run after the push. It does not publish the site by itself.

## 2. Choose where the website is hosted

### For the live KS business site: connect GitHub to Cloudflare Pages

Keep the code on GitHub. In Cloudflare Pages, connect the repository using Git integration and enter:

```text
Framework preset: None
Production branch: main
Root directory: leave blank
Build command: npm run build
Build output directory: dist
Build environment: NODE_VERSION=22
BASE_PATH: leave empty
CONTACT_ENABLED: false until the email backend is configured
INDEXABLE: false until the content and launch checks are approved
```

Create the Pages project using the Git-connected workflow, not by uploading only static files, so the supplied `functions/api/contact.js` is included. The official flow is described at `https://developers.cloudflare.com/pages/get-started/git-integration/`.

Email setup and domain details are in `docs/DEPLOYMENT.md`. Once connected, new pushes can trigger fresh deployments.

### For an optional GitHub Pages design preview

First review the GitHub Pages usage policy. It restricts online-business hosting and sites primarily facilitating commercial transactions; a no-checkout catalogue is not automatically exempt. Use an appropriate business host for the live KS site.

To enable the optional preview workflow:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages preview → Run workflow** on `main`.
4. When the run succeeds, open the URL shown by the `github-pages` deployment or Pages settings.

The included workflow finds the real repository prefix automatically. Do not manually rename image URLs. Do not choose **Deploy from a branch / root** for this source repository; the website needs the supplied build workflow.

For later automatic preview updates, create the repository variable `ENABLE_PAGES_PREVIEW` with the exact value `true` in **Settings → Secrets and variables → Actions → Variables**. After that, pushes to `main` trigger preview deployment. This opt-in variable is not an API secret.

GitHub's current workflow instructions: `https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site`.

## 3. Understand what is still a placeholder

The enquiry form does not send email until the backend, sender, receiver and security-check credentials are configured. The chatbot is an automated catalogue guide, not live staff or generative AI.

Product images are temporary AI-generated photographic-style assets. Replace them in `src/assets/images/` when you have approved KS photographs. Confirm product data, business contact details, translated copy and the privacy notice before launch.

All public previews are intentionally non-indexable. Enable `INDEXABLE=true` only on the approved business deployment with the real `SITE_URL`.

## Run on your computer

Install Node.js 22 or newer, open a terminal in the project folder, then run:

```sh
npm run dev
```

The terminal prints the local preview URL. To generate a portable, single-file HTML after a build:

```sh
npm run portable
```

Open the generated `preview.html` in a browser. This file is always email-disabled, including when generated from a production-configured build.

## Common problems

**Nothing appears under Actions:** confirm `.github/workflows/ci.yml` and `pages-preview.yml` are present at the repository root, and that Actions are permitted for the repository.

**Pages deployment says the site is not configured:** choose Source = GitHub Actions in Pages settings before running the preview workflow. Access can depend on repository visibility, plan and organization settings.

**GitHub shows a README instead of the website:** that is the repository page. Open the deployment URL, not the code repository URL.

**Images are missing under a repository URL:** deploy with the supplied workflow rather than copying a domain-root build. The workflow sets `BASE_PATH` from the Pages metadata.

**No enquiries arrive:** hosting the static pages does not activate email. Complete the server setup and a real inbox test in `docs/DEPLOYMENT.md`.
