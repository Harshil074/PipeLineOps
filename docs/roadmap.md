# Roadmap

## Done
- Static site with 8 pages, all data-driven from `data/*.json`
- 6-stage GitHub Actions pipeline: validate, build, test, security scan,
  deploy, verify

## Next
- Wire up real tooling per stage (see `README.md` for the exact list) instead
  of the illustrative `echo`/placeholder steps in the initial workflow
- Add branch protection requiring the pipeline to pass before merge to `main`
- Add a scheduled (cron) run of the security-scan stage independent of pushes,
  so a newly-disclosed CVE in an existing dependency gets caught even with no
  new commits
- Add a rollback path: if the verify stage fails, automatically redeploy the
  previous successful build artifact instead of leaving the site broken

## Explicitly not planned
- A CMS or backend — the site is static on purpose
- Multi-environment (staging/prod) split — out of scope for a portfolio-scale
  project, but documented here so it's clear it was a choice, not an oversight
