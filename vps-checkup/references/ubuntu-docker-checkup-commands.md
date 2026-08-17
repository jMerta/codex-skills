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

Discover the active Docker context and endpoint first. Use the current user's active context; do not retry with `sudo` merely because access fails. A `sudo docker` fallback is allowed only after confirming the intended endpoint is the local rootful daemon and receiving authorization. Otherwise report Docker as `unchecked`.

```bash
docker_context=$(docker context show)
docker context inspect "$docker_context" --format '{{.Name}}\t{{.Endpoints.docker.Host}}'
docker info --format 'Server={{.ServerVersion}} RootDir={{.DockerRootDir}} LoggingDriver={{.LoggingDriver}} CgroupDriver={{.CgroupDriver}} SecurityOptions={{json .SecurityOptions}} Containers={{.Containers}} Images={{.Images}}'
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.RunningFor}}' | head -n 101
docker ps --filter health=unhealthy --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | head -n 101
docker ps -q | head -n 100 | xargs -r docker stats --no-stream
docker system df
docker compose ls | head -n 101
docker ps -aq | head -n 100 | while IFS= read -r id; do
  docker inspect --format '{{.Name}}\t{{.RestartCount}}\t{{.HostConfig.LogConfig.Type}}\t{{index .HostConfig.LogConfig.Config "max-size"}}\t{{index .HostConfig.LogConfig.Config "max-file"}}\t{{.LogPath}}' "$id"
done
docker ps -aq | head -n 100 | while IFS= read -r id; do
  log_path=$(docker inspect --format '{{.LogPath}}' "$id")
  test -n "$log_path" && stat -Lc '%s\t%y\t%n' -- "$log_path" 2>/dev/null
done
measure_log_sizes() {
  docker ps -aq | head -n 100 | while IFS= read -r id; do
    log_path=$(docker inspect --format '{{.LogPath}}' "$id")
    log_size=$(stat -Lc '%s' -- "$log_path" 2>/dev/null) && printf '%s\t%s\n' "$id" "$log_size"
  done
}
paste <(measure_log_sizes) <(sleep 10; measure_log_sizes) | awk -F '\t' '$1 == $3 { printf "%s\t%d bytes delta\t%.1f bytes/s\n", $1, $4 - $2, ($4 - $2) / 10 }'
docker image ls --format 'table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}' | head -n 101
```

The log-size loop reports metadata only where the active user can read it; do not elevate merely to fill gaps. Inspect a container's bounded recent logs only when its health or restart state requires it. Do not print log content during the inventory, environment variables, full container configuration, or remote logging options that may contain credentials.

## Mutating commands

Do not run package upgrades, configuration edits, firewall changes, restarts, Docker prune, log deletion, reboot, or backup/restore commands without explicit approval.
