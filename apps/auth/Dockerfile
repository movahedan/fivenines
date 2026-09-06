FROM oven/bun:1.4.0-alpine AS base
RUN bun install -g turbo@2.5.5

FROM base AS turbo
WORKDIR /app
COPY ./turbo.json ./turbo.json

FROM turbo AS pruner
WORKDIR /app
COPY ./apps ./apps
COPY ./packages ./packages
COPY ./tools ./tools
COPY ./package.json ./bun.lock ./
RUN turbo prune --scope=@apps/auth --docker

FROM turbo AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache,id=fivenines-bun-cache-auth \
	bun install --ignore-scripts

FROM turbo AS build
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/tools ./tools
COPY --from=installer /app/ .
ENV AUTH_DATABASE_URL=postgresql://127.0.0.1:5432/fivenines_auth
RUN bun run build --filter=@apps/auth

FROM oven/bun:1.4.0-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 runner-group \
	&& adduser --system --uid 1001 runner-user \
	&& chown runner-user:runner-group /app

COPY --from=pruner /app/out/json/ .
COPY --from=installer /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/packages/auth ./packages/auth
COPY --from=build /app/apps/auth ./apps/auth

RUN chmod -R a-w /app \
	&& chown -R runner-user:runner-group /app

USER runner-user
ENV HOST=0.0.0.0
CMD ["bun", "run", "./apps/auth/dist/index.js"]
