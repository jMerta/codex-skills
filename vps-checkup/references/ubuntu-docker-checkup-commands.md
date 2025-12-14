# Ubuntu + Docker checkup commands (copy/paste)

These commands are intended for interactive SSH sessions. Prefer read-only commands first.

## 0) Safety / identity
- `whoami && hostname -f && date -Is && uptime`
- `id && groups`

## 1) System (read-only)
- OS/kernel:
  - `cat /etc/os-release || true`
  - `uname -a`
- CPU/mem:
  - `free -h`
  - `ps -eo pid,ppid,cmd,%cpu,%mem --sort=-%cpu | head`
- Disk:
  - `df -hT`
  - `lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,ROTA,MODEL`
  - If disk is tight, inspect Docker first: `docker system df`
- Failed services / logs (may require sudo):
  - `systemctl --failed || true`
  - `sudo journalctl -p 3 -xb --no-pager | tail -n 200`

## 2) Security posture (read-only; often requires sudo)
- SSH effective config (preferred):
  - `sudo sshd -T 2>/dev/null | egrep -i '^(port|permitrootlogin|passwordauthentication|kbdinteractiveauthentication|challengeresponseauthentication|pubkeyauthentication|authenticationmethods|allowusers|allowgroups|denyusers|denygroups|x11forwarding|allowtcpforwarding|permittty|loglevel) ' || true`
  - Fallback: `sudo ls -la /etc/ssh/sshd_config /etc/ssh/sshd_config.d || true`
- UFW:
  - `sudo ufw status verbose || true`
  - `sudo ufw status numbered || true`
- Fail2ban:
  - `sudo fail2ban-client status || true`
  - `sudo fail2ban-client status sshd || true`
- Listening ports:
  - `sudo ss -tulpn || ss -tulpn`

## 3) Updates (requires confirmation for `apt update`)
- Confirm first: running `apt update` modifies package lists (safe, but not read-only).
- If approved:
  - `sudo apt update`
  - `apt list --upgradable 2>/dev/null | sed -n '1,200p'`
  - `test -f /var/run/reboot-required && echo 'REBOOT REQUIRED' || echo 'no reboot-required file'`
- Unattended upgrades:
  - `systemctl status unattended-upgrades --no-pager || true`
  - `sudo tail -n 200 /var/log/unattended-upgrades/unattended-upgrades.log 2>/dev/null || true`

## 4) Docker (read-only; may require sudo or docker group)
- Daemon:
  - `systemctl status docker --no-pager || true`
  - `docker info 2>/dev/null | sed -n '1,120p'`
- Containers:
  - `docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.RunningFor}}'`
  - Unhealthy containers: `docker ps --filter health=unhealthy --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'`
  - Restart loops: `docker ps --format '{{.Names}}\t{{.Status}}' | egrep -i 'restarting|restart' || true`
  - Resource snapshot: `docker stats --no-stream`
- Disk:
  - `docker system df`
- Compose overview:
  - `docker compose ls || true`

## 5) High-risk commands (DO NOT run unless user explicitly asks)
- `sudo apt upgrade` / `sudo apt full-upgrade`
- `sudo ufw enable` / rule changes
- SSH config edits + `sudo systemctl restart ssh`
- `docker system prune` / log deletion
- `sudo systemctl restart docker` / container restarts / reboot

