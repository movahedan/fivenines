---
applyTo: "**/*.test.ts,**/*.spec.ts"
---

Shared review rubric (GitHub Copilot + Cursor). Test style details: [`tools/tests-preset/AGENTS.md`](../../tools/tests-preset/AGENTS.md).

When performing a code review on tests:

- Runner is `bun:test`. Names: `describe('<module> - <unit>')`, `it('<outcome> when <condition>')`.
- Assert observable behavior. Mock network/DB/fs/env only, not pure kernel logic.
- No flaky time/random: mock clocks and RNG at the boundary the code already injects.
- `test.each` / `describe.each`, not `it.each`.
