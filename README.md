# PipeLineOps

A simulated production site, run the way a real one would be: every push goes
through a 6-stage GitHub Actions pipeline — **validate → build → test →
security scan → deploy → verify** — before it reaches production.

This is not a company website. It's a small, honest static site whose real
purpose is the pipeline wrapped around it.

## Live pages

- **Home** — overview + live pipeline status
- **About the Pipeline** — the reasoning behind the project
- **CI/CD Stages** — all 6 stages, in detail
- **Security Checks** — latest scan results
- **Cost Optimization** — how the pipeline stays cheap to run
- **Incident Dashboard** — sample postmortems the pipeline was built to catch
- **Deployment History** — every build, logged automatically

## Running it locally

No build step is required to view the site as-is:

```bash
# from the project root
npx serve .
# or: python3 -m http.server
```

Then open `http://localhost:3000` (or whichever port your server prints).

## The pipeline

Defined in `.github/workflows/pipeline.yml`. Each stage only runs if the
previous one succeeded:

| # | Stage | Tooling |
|---|---|---|
| 1 | Validate | HTMLHint, Stylelint, ESLint, JSON.parse |
| 2 | Build | Node script that stamps `data/version.json` |
| 3 | Test | Playwright headless smoke tests |
| 4 | Security Scan | Gitleaks, npm audit |
| 5 | Deploy | `actions/deploy-pages` to GitHub Pages |
| 6 | Verify | curl + version match against the live site |

## Setting it up on your own repo

1. Push this project to a GitHub repo.
2. In **Settings → Pages**, set the source to "GitHub Actions."
3. Push to `main` — the workflow runs automatically and deploys to
   `https://<your-username>.github.io/<repo-name>/`.
4. Watch the run under the **Actions** tab; each of the 6 jobs shows up as a
   separate stage.

## Why this exists

Built as a portfolio piece to have something concrete to point to for
"tell me about a CI/CD project" — see `docs/roadmap.md` for what's built vs.
what's next, and `docs/architecture.md` for how the pieces fit together.

## License

MIT — see `LICENSE`.
