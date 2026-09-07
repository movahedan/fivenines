---
applyTo: ".github/workflows/**"
---

Shared review rubric (GitHub Copilot + Cursor). Workflow env: [`docs/GITHUB_WORKFLOW_ENV.md`](../../docs/GITHUB_WORKFLOW_ENV.md).

When performing a code review on GitHub Actions:

- Pin actions to a version tag (`@v2.2.0`), not a floating `@v2`. Dependabot owns bumps. Do not SHA-pin third-party actions unless we opt into that later. Workflows need an explicit `permissions` block.
- Least privilege: default `contents: read`; add `security-events: write` only for SARIF upload.
- Do not introduce `POSTGRES_*` or compose ports as Actions secrets. Check uses `.env.sample` defaults.
- Bun version should stay aligned with the root `packageManager` field.
- Do not add Default Setup CodeQL next to `.github/workflows/codeql.yml` (Advanced).
- Copilot coding agent must run `bun run overall` before commit (Lefthook does not run on GitHub-authored Copilot commits). Setup: `.github/workflows/copilot-setup-steps.yml`.
