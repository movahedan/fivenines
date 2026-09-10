# Figma design reference

This workspace preserves the design supplied on 2026-09-10 as `Design product based on docs`. It is a local visual reference for Five Nines, with a minimal Vite wrapper. It is not the playable application or a second simulation engine.

From the repository root after the normal `bun install`:

```bash
bun run turbo run dev --filter=@apps/figma-design
```

Open [the local preview](http://127.0.0.1:3010). It binds only to loopback and fails if the port is already occupied. No Docker, login, API credentials or Figma account is needed for this mockup.

```bash
bun run turbo run typecheck build --filter=@apps/figma-design
bun run --filter=@apps/figma-design preview
```

The preview command serves the built `dist` on the same port; stop the development server first. The stylesheet retains Google Fonts imports, so offline font rendering can use its fallback fonts.

## What to follow

Use the [interface brief](../../docs/product/interface-design-brief.md) and [interaction specification](../../docs/product/interaction-specification.md) with this app. Implementation belongs to the existing [delivery milestones](../../docs/milestones/README.md).

The main project workspace rack (`src/InfraCanvas.tsx`, `ServerRack`) is the shared visual reference for servers in project, acquisition, Inventory and details. Adapt that design to each context; incomplete or unstyled server views elsewhere in the export are not independent approved designs.

Layout is the approved reference. Mock numbers, callbacks and imported prompts do not override Gameplay, the domain model or the numeric baseline. Preserve the original here; implement corrected production behavior in the real application and shared components.

## Preservation

All 24 files under `src`, including four images and two pasted reference documents, are copied byte-for-byte. [provenance.json](provenance.json) records every copied file's SHA-256 and the omitted export files with their hashes and reasons. The original dependency/configuration files were replaced by a local wrapper using versions already adopted in this repository. Figma editor tooling, MCP settings, deployment scripts and export agent instructions are not active repository configuration. There is no production deployment configured for this workspace.

The original `baseUrl` setting was removed for TypeScript 6 compatibility; its relative alias remains equivalent. All generated TypeScript is checked with `strict: true`, including inactive modules. Only preserved `src/**` is excluded from Biome, avoiding automatic changes to the snapshot. The wrapper remains linted.

To check the preserved source from the repository root:

```bash
bun -e 'import { createHash } from "node:crypto"; const base = "apps/figma-design/"; const manifest = await Bun.file(base + "provenance.json").json(); for (const file of manifest.files) { const hash = createHash("sha256").update(new Uint8Array(await Bun.file(base + file.path).arrayBuffer())).digest("hex"); if (hash !== file.sha256) throw new Error(file.path); } console.log(`${manifest.files.length} source hashes match`);'
```

## Prototype limits

Use the bottom journey arrows to inspect its 13 scenario frames. They are design-navigation controls, not production gameplay. The illustrative clock does not run the scenario, and many buttons are placeholders. In particular:

- Acceptance does not open a usable empty setup workspace, and Contract Review Back does not return correctly.
- Server/service selection does not open a complete inspector; install/configure, Park/Resume, growth and recovery are not connected.
- Acquisition references old missing drawer styles. Mobile racks/headers can overflow; the journey control can cover navigation.
- Finance, research and monitoring fixtures are illustrative; use the product rules and catalogs for actual values and visibility.
- `InspectorPanel.tsx`, `Navigation.tsx` and `OfferDrawer.tsx` remain archived but are not used by the entry tree.

These limitations remain visible so the export is an honest reference. Missing capabilities remain in the delivery milestones; passing this workspace's build is not evidence that those capabilities are implemented.
