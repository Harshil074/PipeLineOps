# PipeLineOps

A simulated production site, run the way a real one would be: every push goes
through a 6-stage Jenkins pipeline — **validate → build → test →
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

Defined in `Jenkinsfile`, running on a self-hosted Jenkins instance. Each
stage only runs if the previous one succeeded:

| # | Stage | Tooling |
|---|---|---|
| 1 | Validate | HTMLHint, Stylelint, ESLint, JSON.parse |
| 2 | Build | Node script that stamps `data/version.json` |
| 3 | Test | Playwright headless smoke tests |
| 4 | Security Scan | Gitleaks, npm audit |
| 5 | Deploy | `aws s3 sync` to an S3 static-hosting bucket |
| 6 | Verify | curl + version match against the live site |

## Setting it up yourself

1. Run Jenkins (Docker is the easiest route: `docker run -d -p 8080:8080
   -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock
   jenkins/jenkins:lts`).
2. Create an S3 bucket with static website hosting enabled, plus a bucket
   policy allowing public `s3:GetObject` reads.
3. Create an IAM user scoped to just that bucket (`PutObject`,
   `DeleteObject`, `ListBucket`), and add its access key as two Jenkins
   credentials: `aws-jenkins-deploy-id` and `aws-jenkins-deploy-secret`.
4. In Jenkins, create a **Pipeline** job → "Pipeline script from SCM" → point
   it at this repo, branch `main`, script path `Jenkinsfile`.
5. Update the `S3_BUCKET` / `AWS_REGION` values at the top of the
   `Jenkinsfile` to match your own bucket.
6. Hit **Build Now** — the stage view shows all 6 stages running live.

See `docs/troubleshooting.md` for a full log of what actually went wrong
setting this up and how each issue was fixed — genuinely useful if you're
setting up something similar yourself.

## Why this exists

Built as a portfolio piece to have something concrete to point to for
"tell me about a CI/CD project" — see `docs/roadmap.md` for what's built vs.
what's next, and `docs/architecture.md` for how the pieces fit together.

## License

MIT — see `LICENSE`.