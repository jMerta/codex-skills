# Ubuntu VPS checkup command menu

Run only commands relevant to the host. Bound output and redact secrets before sharing it.

## Identity and capacity

```sh
whoami; hostname -f; date -Is; uptime
cat /etc/os-release; uname -a
free -h; df -hT; df -ih; lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS,ROTA,MODEL
systemctl --failed --no-pager
journalctl -p 3 --since '24 hours ago' --no-pager -n 200
```

## Exposure and access

```sh
sudo sshd -T
sudo ss -tulpn
command -v ufw >/dev/null && sudo ufw status verbose
command -v nft >/dev/null && sudo nft list ruleset
command -v iptables >/dev/null && sudo iptables -S
command -v fail2ban-client >/dev/null && sudo fail2ban-client status
```

Inspect only relevant effective SSH settings from `sshd -T`; do not copy keys or secrets.

## Updates, time, and backups

```sh
systemctl status unattended-upgrades --no-pager
timedatectl status
test -f /var/run/reboot-required && echo 'reboot required' || echo 'no reboot-required file'
apt list --upgradable 2>/dev/null
```

The package list may be stale. Run `sudo apt update` only after explicit approval. Discover backup service or job status from the host's existing tooling; do not start a backup or restore.

## Docker when installed

```sh
docker info
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.RunningFor}}'
docker ps --filter health=unhealthy --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
docker stats --no-stream
docker system df
docker compose ls
```

Inspect a container's bounded recent logs only when its health or restart state requires it. Do not print environment variables or inspect secrets.

## Mutating commands

Do not run package upgrades, configuration edits, firewall changes, restarts, Docker prune, log deletion, reboot, or backup/restore commands without explicit approval.
