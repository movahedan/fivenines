# Dependabot — version updates

GitHub-native replacement for Renovate (`renovate.json` removed). Config: [`.github/dependabot.yml`](../.github/dependabot.yml).

There is **no** Dependabot equivalent for Renovate’s biome.json `$schema` custom manager, OpenSSF PR columns, dependency dashboard (major approval), or automerge of minor/patch. Majors open as normal PRs. Enable **Dependabot security updates** in repo Settings (Alerts) for the old `osvVulnerabilityAlerts` role.

After merge: uninstall the **Mend Renovate** GitHub App (or disable it on this repo) so you do not get duplicate PRs. Keep one updater.

Postgres image majors (17 → 18) need a **volume reset or dump/restore**, and 18 compose mounts `/var/lib/postgresql` (not `/var/lib/postgresql/data`). The 18 server will not start on a 17 data directory.

No extra Actions secrets. Dependabot uses GitHub’s own token.
