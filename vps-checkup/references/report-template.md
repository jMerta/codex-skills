# VPS checkup report template

## Summary
- **Host:** `<ssh-alias-or-host>` (`<public-ip>` optional)
- **When:** `<ISO timestamp>`
- **Scope:** read-only (no changes applied) / changes applied (list below)

## System overview
- **OS / kernel:** …
- **Uptime / load:** …
- **CPU / memory:** …
- **Disk:** …
- **Failed services:** …

## Security posture
- **SSHD:** key settings and concerns (root login, password auth, MFA/2FA, allowed users)
- **Firewall (UFW):** status + exposed ports
- **Fail2ban:** status + jails

## Updates
- **Apt security updates pending:** …
- **Reboot required:** yes/no (`/var/run/reboot-required`)
- **Unattended upgrades:** enabled/disabled/unknown + evidence

## Docker
- **Docker daemon:** healthy/unhealthy + evidence
- **Containers:** unhealthy/restarting containers + evidence
- **Resources:** notable CPU/mem usage
- **Disk:** `docker system df` summary + top offenders if known
- **Compose projects:** key projects + status

## Findings (ranked)
| Severity | Area | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| Critical/High/Med/Low | … | … | … | … |

## Recommended actions (no changes yet)
1) …
2) …

## Approved changes applied (only if requested)
- …

## Commands run (high level)
- …

## Follow-ups
- …

