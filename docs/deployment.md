# Development and deployment

## Local development

Use Node.js 24 (the version in `.nvmrc`) and Python 3.11 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Everything runs locally; no `.env` file or credentials are required.

```sh
npm test
PYTHONPATH=packages/parser python3 -m unittest discover -s packages/parser/tests -v
npm run build
```

For end-to-end tests, install Chromium once, then run the suite:

```sh
npx playwright install chromium
npm run test:browser
```

The suite builds the app at `/agcess/`, starts the production preview at port 4174, and exercises desktop and mobile layouts. It covers parse/add/reset, validation and stale-preview handling, filtering, CSV download, batch input, reload behavior, and page overflow. CI installs the browser's required Linux dependencies as well.

## GitHub Pages

This repository is configured for **Pages → Source → GitHub Actions**. If you fork it, enable that source in your repository settings. The `Publish demo` workflow runs when changes reach `main` or when manually dispatched. It tests the application, builds with the configured Pages base path, uploads `dist`, and deploys through the `github-pages` environment.

A successful deployment publishes the demo at [somilagg123.github.io/agcess](https://somilagg123.github.io/agcess/). The workflow tests the production build before publishing.

To check the project-path build locally:

```sh
BASE_PATH=/agcess/ npm run build
npm run preview
```

Open the preview server's `/agcess/` path. A custom domain or different repository name is handled by the Pages base-path output. The app uses anchors within a single page, so no SPA fallback is needed.

## Personal website

Link a project card to the source repository and, after a successful deployment, to the live demo. Suggested copy is in [portfolio.md](portfolio.md). No personal website repository was provided or changed during the restoration.

## Future changes

Propose changes in a pull request targeting `main`. Review the changes and wait for the Python, browser, and secret-scan checks before merging. The Pages workflow then tests, builds, and deploys the merged code.
