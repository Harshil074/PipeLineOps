# Incidents

`data/incidents.json` holds sample postmortems in the format used on the
Incident Dashboard page. Each entry follows the same shape a real on-call
postmortem would:

- **What broke** (`title`, `impact`) — user-facing effect, not just the
  technical cause.
- **Why** (`root_cause`) — the actual mechanism, not "human error."
- **What changed** (`resolution`) — a concrete pipeline or process change,
  not just "we fixed it."

## Severity scale

| Severity | Meaning |
|---|---|
| `sev1` | User-facing outage or data loss |
| `sev2` | Degraded experience or a failed deploy that didn't reach users |
| `sev3` | Caught in CI before it ever reached production |

## Adding a new incident

Append an object to the `incidents` array in `data/incidents.json` with a new
`INC-XXXX` id. The dashboard re-renders from this file on every page load —
no code change needed.
