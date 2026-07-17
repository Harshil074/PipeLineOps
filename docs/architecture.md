# Architecture

PipeLineOps is deliberately split into two halves:

1. **The site** — plain HTML/CSS/JS, no framework, no build tool required to
   run it locally. Pages fetch their content from JSON files in `data/` at
   runtime, rather than hardcoding it, so the pipeline has something real to
   update on every build.
2. **The pipeline** — a Jenkins pipeline (`Jenkinsfile`)
   that validates, builds, tests, scans, deploys, and verifies the site on
   every push to `main`.
## Why plain HTML/CSS/JS

No framework or bundler means:
- Every stage of the pipeline (lint, build, test) can be explained in one
  sentence without "and then webpack does X."
- The `data/*.json` files can be inspected directly in the browser or with
  `cat` — there's nothing hidden behind a build step.
- The project stays approachable as a teaching example of CI/CD, which is the
  actual point.

## Data flow

```
push to main
  -> validate   (lint html/css/js, validate json)
  -> build      (writes commit sha + build number into data/version.json)
  -> test       (headless browser hits every page, asserts data renders)
  -> security   (gitleaks + npm audit)
  -> deploy     (sync build to AWS S3 static hosting)
  -> verify     (curl the live URL, diff live version.json vs build's)
```

Each page's JS (`js/app.js`, `js/version.js`) fetches from `data/*.json` on
load. That's the same mechanism whether the data was hand-written or just
overwritten by the build stage seconds ago — the pages don't know or care
which.

## Folder layout

- `index.html`, `pages/*.html` — the site
- `css/` — `style.css` (tokens + layout), `dashboard.css` (stage tracker,
  incident feed, version card), `responsive.css` (breakpoints)
- `js/` — `navigation.js` (nav behavior), `app.js` (fetch + render for
  incidents/pipeline/security), `version.js` (fetch + render for build
  version and deploy history)
- `data/` — the four JSON files every page reads from
- `docs/` — this folder
- `.github/workflows/` — the pipeline definition
