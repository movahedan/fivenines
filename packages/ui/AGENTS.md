# AGENTS.md

Guidance for `@packages/ui`. Repo map: [root AGENTS.md](../../AGENTS.md). Commands: [CHEATSHEET](../../docs/CHEATSHEET.md). Storybook: [STORYBOOK.md](STORYBOOK.md). **Code review:** [`.github/instructions/ui.instructions.md`](../../.github/instructions/ui.instructions.md) (shared with GitHub Copilot).

## Role

Universal React UI library: **RNR atoms** (NativeWind v5 + `react-native-css`) plus local primitives (`Link`) under `src/atoms/`. Web adapters live on the atoms (`onClick`, `Text` children, Input `onChange`/`disabled`). **Molecules** are ops chrome (HUD, cards, log, game status bar). **Templates** own responsive game-shell placement (`GameTemplate`). Archived web shadcn under `src/shadcn`.

Do **not** run `rnr init` here (it scaffolds Expo). Do **not** add `apps/mobile` from this package. Primitive stories live at `src/atoms/*.stories.tsx`; CLI `add` can overwrite RNR files — re-apply the list below.

## Commands

| Command | What |
|---------|------|
| `bun run turbo run dev --filter=@packages/ui` | Storybook on **:9000** (Node CLI; not Bun — RN Flow). Host vs Docker: only one listener. |
| `bun run turbo run build:storybook --filter=@packages/ui` | Static Storybook → `dist-storybook/` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun test packages/ui` | Atom, molecule, and template tests (`test-rn-preload.ts` via root `bunfig.toml`) |

RNR: from `packages/ui`, `bunx @react-native-reusables/cli@latest doctor -c packages/ui --summary` and `add -a -y -o --styling-library nativewind -p src/atoms` when regenerating atoms.

## Layout

```
packages/ui/
├── src/atoms/          # RNR primitives, Link, web adapters, `*.stories.tsx` / tests
├── src/shadcn/         # Frozen web shadcn (export `./shadcn`)
├── src/molecules/      # Ops chrome + `*.stories.tsx`
├── src/templates/      # Game shell + `*.stories.tsx`
├── src/style.css       # Ops tokens + Tailwind 4 (unlayered utilities for RN-web)
├── src/theme.ts        # THEME / NAV_THEME (mirrors CSS; light and dark are the same ops map)
├── src/utils/          # `cn` (clsx + tailwind-merge)
├── scripts/rn-web.ts   # RN-web Vite interop (Storybook + `@apps/web`)
├── .storybook/         # Storybook config + RN-web stubs
└── test-rn-preload.ts  # Bun test mocks for RN modules
```

## Exports (`package.json`)

| Specifier | Path |
|-----------|------|
| `@packages/ui/atoms` | `src/atoms` |
| `@packages/ui/molecules` | `src/molecules` |
| `@packages/ui/templates` | `src/templates` |
| `@packages/ui/shadcn` | `src/shadcn` |
| `@packages/ui/hooks` | `src/hooks` |
| `@packages/ui/utils` | `src/utils` |
| `@packages/ui/style.css` | `src/style.css` |
| `@packages/ui/theme.ts` | `src/theme.ts` |

Import Button, Card, Input, Label, Link from `@packages/ui/atoms` (not the molecules barrel). Atom `Button` maps `onClick` → `onPress` and wraps string/number children in `Text`. Atom `Input` accepts web `onChange` / `disabled` / `type` (`email` / `password`). `Link` is a local DOM `<a>` (not RNR). Stack label+control with `flex flex-col gap-*` — `space-y-*` on a DOM wrapper does not apply to RN-web Label/Input. Icons in generated atoms: `lucide-react-native` (declare `react-native-svg`). CSS `@import "tailwindcss-safe-area"` needs that package declared. UI Docker installer copies the repo `bun.lock` over prune output so Bun does not ignore a broken nested lock. There is no LoginForm.

**After `rnr add` overwrites `src/atoms/`:** re-apply Button (`onClick` / `Text` children / ignore unused `asChild`/`type`), Input (`onChange` / `disabled` / `type`); restore `link.tsx` if the CLI removed it; restore `*.stories.tsx` / `*.test.tsx` next to those files. Keep `scripts/write-barrels.ts` skipping `*.test.ts(x)` and `*.stories.ts(x)`, plus molecule/template dirs that have no `${name}/${name}.tsx`. Frozen `src/shadcn/sonner.tsx` pins Sonner `theme="dark"` — do not add `next-themes`.

**Ops chrome** (engine-agnostic display props + callbacks; no `@packages/fivenines-engine` / `@packages/auth`): `Hud` (default **9s** mark + `shadow-glow-primary`; optional `logo` slot; lucide Pause/Play icon with accessible names Pause/Play; `speed` `1|2|4` icon buttons ×1/×2/×4), `GameStatusBar` (`placement` `static` in flow or `absolute` stuck to the bottom of a relative parent), `PanelHeader` (tone dot + matching `shadow-glow-*`), `MetricStat`, `ProjectOfferCard` (`disabled` gates Accept only; Decline stays enabled; demand metric is a string, not cores), `ActiveProjectCard` (`slaPercent` 0–100, SLA caption rows, sparkline 0–1 vs `sparklineTarget`, optional service/work/credit/telemetry strings), `ServerCard` (`variant`: `fleet` | `market`; optional disk/GPU stats; fleet GPU may be an unavailable label instead of a bar; optional `dotClassName` token utilities for the SKU glow dot), `EventLog`. Pass region/SKU color via token `className` (`text-info`, `bg-warning shadow-glow-warning`, …), not hex. Barrel: `@packages/ui/molecules`. `GameTemplate` (`@packages/ui/templates`) is a controlled desktop/mobile shell: parent owns destination, panel open/width, and overlay open state; the template owns rails, mobile tabs, overlay chrome, and `react-resizable-panels` handles. Overlay bodies are slots. Hub still uses `Hud` until the later integration slice.

`test-rn-preload.ts` stubs `react-native` → RN-web, lucide, `@rn-primitives/progress`, and `react-native-reanimated` for molecule tests.

## Tokens

Canonical source: `src/style.css` (`:root` and `.dark` share the **ops** navy/neon palette). `@theme inline` maps CSS vars to NativeWind/Tailwind utilities (`bg-background`, `text-primary`, `bg-hud`, `shadow-glow-primary`, …). Glow shadows: `shadow-glow-primary`, `shadow-glow-danger`, `shadow-glow-warning`, `shadow-glow-info`, `shadow-glow-sla` (RGB lockstep with OPS hex; mirrored on `theme.ts` `OPS.glow*`). Fonts: Inter (`font-sans`) and JetBrains Mono (`font-mono`) via Google Fonts `@import` in `style.css`. `src/theme.ts` `THEME.light` / `THEME.dark` and `NAV_THEME` must stay in lockstep with those hex values — do not keep a second light palette.

To add a semantic color: set `--name` on `:root` and `.dark`, add `--color-name: var(--name)` under `@theme inline`, and add the same hex on the `OPS` object in `theme.ts`. Use the utility in JSX (`text-warning`, `bg-panel`); do not hardcode hex in molecules or apps. `tailwind.config.js` is leftover shadcn `hsl(var(--*))` wrappers — do not put a third palette there.

## Storybook

- Framework: `@storybook/react-vite`, globs `src/atoms/**/*.stories.*`, `src/molecules/**/*.stories.*`, and `src/templates/**/*.stories.*`.
- Ops chrome: **Components / Hud**, GameStatusBar, PanelHeader, MetricStat, ProjectOfferCard, ActiveProjectCard, ServerCard, EventLog. Shell: **Templates / GameTemplate**.
- Preview imports `src/style.css`. Do not import `react-native` / `@rn-primitives` in `preview.tsx` (Node CLI, no Vite aliases).
- RN-web + NativeWind: `scripts/rn-web.ts` (single React, CSS component rewrite, SVG stubs). Storybook and `@apps/web` both import it.
