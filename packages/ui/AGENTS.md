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
├── src/style.css       # Tokens + Tailwind 4 (unlayered utilities for RN-web)
├── src/theme.ts        # THEME / NAV_THEME
├── src/utils/          # `cn` (clsx + tailwind-merge)
├── .storybook/         # Vite + react-native-web + NativeWind interop
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

Molecules map web `onClick` → atom `onPress`. Icons in generated atoms: `lucide-react-native` (declare `react-native-svg`). CSS `@import "tailwindcss-safe-area"` needs that package declared. UI Docker installer copies the repo `bun.lock` over prune output so Bun does not ignore a broken nested lock.

## Storybook

- Framework: `@storybook/react-vite`, glob `src/molecules/**/*.stories.*` only.
- Preview imports `src/style.css`. Do not import `react-native` / `@rn-primitives` in `preview.tsx` (Node CLI, no Vite aliases).
- RN-web + NativeWind: `.storybook/rn-web-vite.ts` (single React, CSS component rewrite, SVG stubs).
