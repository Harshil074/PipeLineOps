# Security

The security-scan stage runs before deploy and has no manual override for a
finding above zero severity. Two tools do the actual work:

## Gitleaks

Scans the diff for anything that looks like a committed secret — API keys,
tokens, private keys — using entropy and pattern-based rules. Configured to
run on every push and on pull requests, so a leaked credential never reaches
`main` in the first place.

## npm audit (or equivalent for a no-dependency site)

Because this site has no runtime dependencies, `npm audit` mostly guards the
pipeline's own tooling (lint/test packages) rather than the site itself. It's
kept in the pipeline anyway, because a real project's dependency footprint
grows, and it's better to have the check in place before it's needed.

## What's intentionally out of scope

This is a static, read-only site with no backend, no user input, and no
authentication — so things like SQL injection or CSRF don't apply here.
Scoping security checks to what's actually exploitable, rather than running
every possible scanner, is itself part of the design: noisy security tooling
that flags things that can't happen just trains people to ignore it.
