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
RUN turbo prune --scope=@apps/web --docker

FROM turbo AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache,id=fivenines-bun-cache-web \
	bun install --ignore-scripts

FROM turbo AS build
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/tools ./tools
COPY --from=installer /app/ .
RUN cp apps/web/.env.sample apps/web/.env && bun run build --filter=@apps/web

FROM oven/bun:1.4.0-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl \
	&& addgroup --system --gid 1001 runner-group \
	&& adduser --system --uid 1001 runner-user \
	&& chown runner-user:runner-group /app

COPY --from=pruner /app/out/json/ .
COPY --from=installer /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/tools ./tools
COPY --from=build /app/apps/web ./apps/web

RUN chmod -R a-w /app \
	&& chown -R runner-user:runner-group /app

USER runner-user
ENV HOST=0.0.0.0
WORKDIR /app/apps/web
CMD ["sh", "-c", "exec bun --bun vite preview --host 0.0.0.0 --port \"${WEB_PORT:-${PORT:-3000}}\""]
