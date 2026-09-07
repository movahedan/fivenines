---
applyTo: ".github/workflows/**"
---

Shared review rubric (GitHub Copilot + Cursor). Workflow env: [`docs/GITHUB_WORKFLOW_ENV.md`](../../docs/GITHUB_WORKFLOW_ENV.md).

When performing a code review on GitHub Actions:

- Pin actions to the same style as `Check.yml` (major.minor.patch, not floating `@v4`).
- Least privilege: default `contents: read`; add `security-events: write` only for SARIF upload.
- Do not introduce `POSTGRES_*` or compose ports as Actions secrets. Check uses `.env.sample` defaults.
- Bun version should stay aligned with root `packageManager` (1.4.x).
- Do not add Default Setup CodeQL next to `.github/workflows/codeql.yml` (Advanced).
