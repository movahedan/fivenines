# AGENTS.md

Guidance for `@packages/ui`. Repo map: [root AGENTS.md](../../AGENTS.md). Commands: [CHEATSHEET](../../docs/CHEATSHEET.md). Storybook: [STORYBOOK.md](STORYBOOK.md).

## Role

Universal React UI library: **RNR atoms** (NativeWind v5 + `react-native-css`) for Web and future native, **molecules** wrapping those atoms, archived web shadcn under `src/shadcn`.

Do **not** run `rnr init` here (it scaffolds Expo). Do **not** add `apps/mobile` from this package. Do **not** add Storybook files under `src/atoms/` (CLI `add` overwrites atoms).

## Commands

| Command | What |
|---------|------|
| `bun run turbo run dev --filter=@packages/ui` | Storybook on **:9000** (Node CLI; not Bun — RN Flow). Host vs Docker: only one listener. |
| `bun run turbo run build:storybook --filter=@packages/ui` | Static Storybook → `dist-storybook/` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun test packages/ui` | Molecule tests (`test-rn-preload.ts` via root `bunfig.toml`) |

RNR: from `packages/ui`, `bunx @react-native-reusables/cli@latest doctor -c packages/ui --summary` and `add -a -y -o --styling-library nativewind -p src/atoms` when regenerating atoms.

## Layout

```
packages/ui/
├── src/atoms/          # RNR primitives (CLI output)
├── src/shadcn/         # Frozen web shadcn (export `./shadcn`)
├── src/molecules/      # Wrappers + `*.stories.tsx` only
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
| `@packages/ui/shadcn` | `src/shadcn` |
| `@packages/ui/hooks` | `src/hooks` |
| `@packages/ui/utils` | `src/utils` |
| `@packages/ui/style.css` | `src/style.css` |
| `@packages/ui/theme.ts` | `src/theme.ts` |

Molecules map web `onClick` → atom `onPress`. Stack label+control with `flex flex-col gap-*` — `space-y-*` on a DOM wrapper does not apply to RN-web Label/Input. Icons in generated atoms: `lucide-react-native` (declare `react-native-svg`). CSS `@import "tailwindcss-safe-area"` needs that package declared. UI Docker installer copies the repo `bun.lock` over prune output so Bun does not ignore a broken nested lock.

**Ops chrome** (engine-agnostic display props + callbacks; no `@packages/fivenines-engine` / `@packages/auth`): `Hud`, `PanelHeader`, `MetricStat`, `ProjectOfferCard` (`disabled` gates Accept only; Decline stays enabled), `ActiveProjectCard` (`slaPercent` 0–100, SLA caption rows, `sparkline` 0–1 vs `sparklineTarget`), `ServerCard` (`variant`: `fleet` | `market`), `EventLog`. Pass region color via token `className` (`text-info`, …), not hex. Barrel: `@packages/ui/molecules`.

`test-rn-preload.ts` stubs `react-native` → RN-web, lucide, `@rn-primitives/progress`, and `react-native-reanimated` for molecule tests.

## Tokens

Canonical source: `src/style.css` (`:root` and `.dark` share the **ops** navy/neon palette). `@theme inline` maps CSS vars to NativeWind/Tailwind utilities (`bg-background`, `text-primary`, `bg-hud`, `shadow-glow-primary`, …). Fonts: Inter (`font-sans`) and JetBrains Mono (`font-mono`) via Google Fonts `@import` in `style.css`. `src/theme.ts` `THEME.light` / `THEME.dark` and `NAV_THEME` must stay in lockstep with those hex values — do not keep a second light palette.

To add a semantic color: set `--name` on `:root` and `.dark`, add `--color-name: var(--name)` under `@theme inline`, and add the same hex on the `OPS` object in `theme.ts`. Use the utility in JSX (`text-warning`, `bg-panel`); do not hardcode hex in molecules or apps. `tailwind.config.js` is leftover shadcn `hsl(var(--*))` wrappers — do not put a third palette there.

## Storybook

- Framework: `@storybook/react-vite`, glob `src/molecules/**/*.stories.*` only.
- Ops chrome: **Components / Hud**, PanelHeader, MetricStat, ProjectOfferCard, ActiveProjectCard, ServerCard, EventLog.
- Preview imports `src/style.css`. Do not import `react-native` / `@rn-primitives` in `preview.tsx` (Node CLI, no Vite aliases).
- RN-web + NativeWind: `scripts/rn-web.ts` (single React, CSS component rewrite, SVG stubs). Storybook and `@apps/web` both import it.
