# Help build Five Nines

[← Back to the game](../README.md)

## Inside the machine

**React · TanStack Start · TypeScript · Bun · NestJS · Turborepo**

[Simulation engine](../packages/fivenines-engine) · [Player app](../apps/web) · [Design reference](../apps/figma-design) · [Shared UI](../packages/ui) · [Auth](../apps/auth) · [Control plane](../apps/nestjs)  


## Help build the next hour

The visual direction and product rules are defined; implementation follows [ten milestones](milestones/README.md). The engine runs in the browser today, with an operations console at `/hub` and a debug harness at `/lab`. The Figma app is a separate design mockup; server-authoritative gameplay comes later.

Start with the [product overview](product/index.md), [project board](https://github.com/users/movahedan/projects/5), and [repository guidance](../AGENTS.md).

## Run locally

Use **Bun 1.4.2**, **Node ≥ 26**, and Git; Docker is needed for the full stack.

```bash
git clone https://github.com/movahedan/fivenines.git
cd fivenines
bun install

# Design preview — no backend, login, or Figma account required
bun run turbo run dev --filter=@apps/figma-design
```

Open [127.0.0.1:3010](http://127.0.0.1:3010). Use the bottom arrows to explore the frames; some interactions are placeholders. [Preview guide →](../apps/figma-design/README.md)

For the full stack, configure [local hostnames](CHEATSHEET.md#docker-compose), then:

```bash
bun run container setup
bun run container up
```

Open the [player console](http://play.fivenines.com:3000/hub) or [engine harness](http://play.fivenines.com:3000/lab).

Run `bun run overall` before committing: lint, types, tests, and builds. The same gate runs before pushing and in CI. [Commands and troubleshooting →](CHEATSHEET.md)



[Player guide](https://github.com/movahedan/fivenines/wiki) · [Commands](CHEATSHEET.md) · [Development scripts](SCRIPTING.md) · [Issues](https://github.com/movahedan/fivenines/issues)
