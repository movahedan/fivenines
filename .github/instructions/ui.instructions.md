---
applyTo: "packages/ui/**"
---

Shared review rubric (GitHub Copilot + Cursor). Implementation truth: [`packages/ui/AGENTS.md`](../../packages/ui/AGENTS.md).

When performing a code review on `@packages/ui`:

- No `@packages/fivenines-engine` imports. Display props and callbacks only (`slaPercent` 0–100, sparkline 0–1).
- NativeWind / RNR atoms: `Button`/`Input` web adapters live on the atom (`onClick` → `onPress`). Primitive stories sit in `src/atoms/*.stories.tsx`. Molecules are ops chrome only.
- Prefer semantic token classes (`hud`, `panel`, `warning`, `info`, `sla`) over hardcoded greens/reds. There is no light theme.
- Flag `space-y-*` on RN-web Label/Input stacks; use `flex flex-col gap-*`.
- Semantic HTML and a11y (labels, contrast, no click-only `div` buttons) matter more than visual nits already covered by Storybook.
