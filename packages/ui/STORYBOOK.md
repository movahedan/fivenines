# Storybook (`@packages/ui`)

Vite + `@storybook/react-vite`. Stories: **`src/molecules/**/*.stories.*` only**. Do not add stories next to RNR atoms (`src/atoms/`).

## Run

From repo root:

```bash
bun run turbo run dev --filter=@packages/ui
```

URL: **http://localhost:9000**. `dev-storybook.ts` launches the Storybook CLI with **Node** (Bun cannot parse React Native Flow). If Docker already binds 9000, stop that listener first (`strictPort`).

Preview CSS: `.storybook/preview.tsx` imports `../src/style.css`. Do not import `react-native` or `@rn-primitives` in preview (the Node CLI loads that file without Vite aliases).

## RN-web + NativeWind

Shared Vite config: `.storybook/rn-web-vite.ts`.

- Alias `react-native` → `react-native-web`
- One React instance (virtual ESM modules) so Pressable does not get a second copy
- Rewrite `react-native` View/Text/Pressable/… to `react-native-css/components/*` so `className` maps to RN-web `$$css`
- Stubs for styleq, SVG transform, assets registry under `.storybook/stubs/`
- `style.css`: unlayered `@import "tailwindcss/utilities.css"` so utilities beat RN-web unlayered resets

## Scripts

| Script | Output |
|--------|--------|
| `dev` / `dev:storybook` | Dev server :9000 |
| `build:storybook` | `dist-storybook/` |
| `start` | Build then serve static |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `Cannot read properties of null (reading 'useState')` | Duplicate React — keep `shareSingleReact` in `rn-web-vite.ts` |
| Unstyled canvas / RN-web `.css-view-*` wins | Utilities must be unlayered in `src/style.css` |
| `Can't resolve nativewind/dist/module/plugin.js` | Do not `@plugin` that path; NativeWind v5 uses `react-native-css` |
| Flow parse errors | Storybook must run under Node, not Bun |
| LoginForm / lucide SVG CJS errors | SVG stubs + aliases in `rn-web-vite.ts` |
| `react-native-svg` / `ReactNativeSVG.web.js` missing | Keep `react-native-svg` in `@packages/ui` dependencies (lucide peer is not pruned into Docker) |
