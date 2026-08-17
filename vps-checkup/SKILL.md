---
name: vps-checkup
description: Audit an Ubuntu VPS and optional Docker workloads through SSH, producing an evidence-based health, exposure, update, and security report. Use for read-only server checkups; mutate or restart only with explicit approval.
---

# VPS checkup

## Confirm scope

Obtain the SSH target, required public services and ports, expected workloads, and whether passwordless `sudo` is available. Treat the audit as read-only. `apt update` changes package indexes and requires explicit approval even during a read-only checkup.

Do not request or expose private keys, tokens, environment values, or container secrets. Redact public output that includes credentials or sensitive hostnames.

## Collect evidence

1. Record host identity, UTC/local time, uptime, OS, kernel, virtualization, load, memory, disk space, inode use, mounts, and failed services.
2. Inspect critical journal entries within a bounded time window; do not dump entire logs.
3. Inspect effective SSH configuration and listening sockets.
4. Detect the active firewall rather than assuming UFW: check UFW, nftables, then iptables as available. Compare exposure with the required port list.
5. Check fail2ban only if installed and report missing tooling as `not installed`, not as failure.
6. Inspect time synchronization, unattended upgrades, pending packages from current indexes, and reboot-required state. Label package results stale when `apt update` was not approved.
7. If Docker exists, inspect daemon/rootless mode, containers, health/restarts, resource snapshot, disk use, logging growth, image age, and Compose projects. Skip Docker sections when absent.
8. Record whether backups exist and their last successful evidence when discoverable; do not trigger a backup or restore test without approval.

Use `references/ubuntu-docker-checkup-commands.md` as a menu and run only commands relevant to the detected host.

## Report and changes

Use `references/report-template.md`. Rank findings by impact and likelihood, cite command evidence, distinguish confirmed findings from unknowns, and list the smallest recommended actions.

Obtain explicit approval for each mutating group, including package-index refresh, upgrades, configuration edits, firewall or SSH changes, service/container restarts, pruning, log deletion, reboot, and backup/restore operations. Before SSH or firewall changes, verify a second access path and configuration syntax. Recheck affected services and access after any approved change.
