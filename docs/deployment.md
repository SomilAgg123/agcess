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

Repository settings must use **Pages → Source → GitHub Actions**. The `Publish demo` workflow runs when changes reach `main` or when manually dispatched. It tests the application, builds with the configured Pages base path, uploads `dist`, and deploys through the `github-pages` environment.

The implementation PR is intentionally left open for review. A successful workflow after merge is the signal that the demo is live. The expected URL for this repository is `https://somilagg123.github.io/agcess/`.

To check the project-path build locally:

```sh
BASE_PATH=/agcess/ npm run build
npm run preview
```

Open the preview server's `/agcess/` path. A custom domain or different repository name is handled by the Pages base-path output. The app uses anchors within a single page, so no SPA fallback is needed.

## Personal website

Link a project card to the source repository and, after a successful deployment, to the live demo. Suggested copy is in [portfolio.md](portfolio.md). No personal website repository was provided or changed during the restoration.

## Review order

1. Merge the parser foundation PR into `main` after review. Prefer a merge commit for this first PR because the demo branch is based on it.
2. Change the demo PR's base to `main` after the first merge. Its remaining diff should contain only the demo, documentation, and deployment changes.
3. Merge the demo PR after review and successful checks. Pages publishes from `main`.

A squash merge of the first PR is also possible, but requires updating the stacked demo branch to avoid showing the parser commits again. No PR is automatically merged by the restoration workflow.
