# Jenkins Pipeline — Troubleshooting Log

A real record of every issue hit getting this pipeline from "written" to
"actually passing end-to-end," in the order they came up. Kept deliberately
detailed — this is as much a part of the CI/CD learning story as the
Jenkinsfile itself.

## 1. Wrong branch specifier (`*/master` vs `*/main`)
**Symptom:** `fatal: couldn't find remote ref refs/heads/master`
**Cause:** Jenkins job's Branch Specifier defaulted to the old `master`
convention; the repo's actual default branch is `main`.
**Fix:** Changed Branch Specifier to `*/main` in the job configuration.

## 2. `Invalid agent type "docker"` — Groovy compile error
**Symptom:** `Invalid agent type "docker" specified. Must be one of [any, label, none]`
**Cause:** The `agent { docker { ... } }` syntax requires the **Docker
Pipeline** plugin, which wasn't installed yet.
**Fix:** Installed the Docker Pipeline plugin via Manage Jenkins → Plugins.

## 3. Docker CLI missing inside the Jenkins container
**Symptom:** `docker: command not found` style failures once the plugin
could actually try to invoke Docker.
**Cause:** The official `jenkins/jenkins:lts` image doesn't ship the Docker
CLI — mounting the host's `docker.sock` only gives *access*, not the
`docker` binary itself.
**Fix:** `apt-get install -y docker.io` inside the Jenkins container (as root).

## 4. Docker socket permission denied
**Symptom:** `permission denied while trying to connect to the Docker daemon socket`
**Cause:** The `jenkins` user inside the container could see
`/var/run/docker.sock` but lacked permission to use it.
**Fix:** `chmod 666 /var/run/docker.sock` on the host (temporary — resets on
daemon restart, a known trade-off for a personal setup).

## 5. `stylelint --config '{...}'` — ENOENT
**Symptom:** `ENOENT: no such file or directory, open '.../{"extends":...}'`
**Cause:** Assumed `stylelint`'s `--config` flag accepted inline JSON. It
doesn't — it expects a **path** to a config file, same as ESLint's
`--config`.
**Fix:** Added a real `.stylelintrc.json` file instead of passing JSON on
the command line.

## 6. ESLint legacy flags incompatible with ESLint v9
**Symptom:** Would have failed next, since `--no-eslintrc` / `--env` /
`--parser-options` were removed when ESLint moved to flat config in v9.
**Cause:** No version pin on `npm install eslint` meant it always grabbed
the latest major version.
**Fix:** Added `eslint.config.js` (flat config) and dropped the legacy flags
entirely — `npx eslint js/*.js` now just works.

## 7. Config files referenced but never actually committed
**Symptom:** `ConfigurationError: No configuration provided for .../dashboard.css`
**Cause:** The Jenkinsfile was updated to expect `.stylelintrc.json`, but the
file itself hadn't been created/pushed yet.
**Fix:** Created and committed the missing config files.

## 8. `stylelint-config-standard` — 96 real style findings
**Symptom:** A wall of formatting violations once stylelint could actually run.
**Cause:** Most were cosmetic preferences (`rgba()` vs `rgb()`, one
declaration per line, BEM `--modifier` class names flagged as "not
kebab-case") that conflicted with intentional choices — but one was a
genuine bug: `.stage` was accidentally declared twice in `dashboard.css`.
**Fix:** Merged the duplicate `.stage` rule properly; relaxed only the
purely-cosmetic rules in `.stylelintrc.json`, keeping real bug-catching
rules (like `no-duplicate-selectors`) active.

## 9. Docker-in-Docker: `Failed to kill container` (permission denied)
**Symptom:** Every stage's lint/build/test steps *succeeded*, but the
pipeline still failed at container teardown — and every past container was
found still running, un-killed.
**Cause:** First suspected a Docker client/server version mismatch (client
was `26.x`, server `29.x`) — fixed that, but the real error underneath was a
daemon-level permission block on `stop`/`kill` specifically (Docker-in-Docker
signal-sending restriction), not a simple file permission.
**Fix:** Rather than keep fighting this specific class of bug, restructured
the whole Jenkinsfile to run all stages directly on Jenkins' built-in node
(`agent any`) instead of spinning a Docker container per stage. Simpler, and
sidesteps this entire problem.

## 10. Leaked containers wouldn't clean up via Jenkins
**Symptom:** `docker exec jenkins docker rm -f ...` failed with the same
permission denied as #9.
**Fix:** Ran the cleanup from the **host** directly (`docker rm -f
<ids>`), bypassing the nested permission issue entirely.

## 11. Missing tools after switching to `agent any`
**Symptom:** `node`, `gitleaks`, `aws` all reported "not found."
**Cause:** Removing per-stage Docker containers meant nothing provided
these tools anymore — they needed to live on the Jenkins host itself.
**Fix:** One-time setup inside the Jenkins container (as root): installed
Node.js 22 via NodeSource, Playwright's system deps, the `gitleaks` binary,
and AWS CLI v2.

## 12. `gitleaks` download 404
**Symptom:** `gitleaks: command not found` even after the "install" ran.
**Cause:** Hardcoded a specific version number (`8.18.4`) in the download
URL; the actual latest release had moved on to `8.30.1`, so the URL 404'd
and `tar` silently extracted nothing from the error page.
**Fix:** Resolved the current version dynamically via the GitHub API
instead of hardcoding a version string.

## 13. Wrong AWS region + wrong website endpoint format
**Symptom:** `NoSuchBucket` error during Deploy.
**Cause:** Jenkinsfile had `AWS_REGION = 'us-east-1'` hardcoded, but the
bucket was created in `ap-south-1` (Mumbai). Also, S3 website endpoint URLs
use a **hyphen** before the region for old regions (`us-east-1`) but a
**dot** for newer regions (`ap-south-1`) — an easy detail to get wrong.
**Fix:** Corrected `AWS_REGION` to `ap-south-1` and fixed the endpoint
format to `s3-website.${AWS_REGION}.amazonaws.com`.

## 14. Wrong S3 bucket name
**Symptom:** Same `NoSuchBucket` error persisted after the region fix.
**Cause:** `S3_BUCKET` was set to `'pipelineops-site'`, but the real bucket
(names must be globally unique) was `'pipelineops-site-harshil74'`.
**Fix:** Corrected the variable to match the real bucket name.

## 15. Verify stage false failure — duplicate `commit_sha` match
**Symptom:** Deploy succeeded, but Verify failed claiming a version
mismatch — even though both values printed identically.
**Cause:** `data/version.json` contains `commit_sha` **twice** (once at the
top level, once inside the `history` array). The original `grep -o` matched
both occurrences, producing a doubled, newline-joined string that failed
the equality check even though the underlying commit was the same.
**Fix:** Added `-m 1` to `grep` to only capture the first match.

## 16. Lost backslash in `sed` backreference
**Symptom:** After fixing #15, `LIVE_SHA` came back completely empty.
**Cause:** Groovy's triple-single-quoted strings convert `\\` → `\`; the
`sed` backreference `\1` needs to be written as `\\1` in the Jenkinsfile
source so the shell actually receives `\1`. This got lost during editing.
**Fix:** Restored `\\1` in the `sed` expression — and separately caught that
the fix existed locally but hadn't been pushed yet before a rebuild was
triggered, which looked like the same bug recurring but was really just an
un-pushed commit.

## Bonus: AWS credentials committed to the Jenkinsfile (security incident)
**Symptom:** GitHub's push protection blocked a push, flagging a literal
AWS Access Key ID and Secret Access Key in the `Jenkinsfile`.
**Cause:** At some point the file was hand-edited to hardcode real
credentials instead of using Jenkins' `credentials('id')` lookup.
**Fix:** Rotated the exposed AWS key immediately (deactivated + deleted in
IAM, issued a new pair) regardless of whether the push technically
succeeded, restored the `credentials(...)` syntax, and used `git reset
--soft` to rewrite local history so the secret never entered a pushed
commit at all.

---

**Pattern across almost all of these:** most failures were config/detail
mismatches (branch names, bucket names, regions, version pins, escaping)
rather than conceptual misunderstandings of CI/CD — which is a fairly
realistic picture of what real pipeline maintenance looks like.
