FROM oven/bun:1.4.2-alpine AS base
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

FROM nginx:alpine AS runner
USER root
RUN apk add --no-cache curl
COPY --chown=nginx:nginx --chmod=644 apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx --chmod=755 /app/apps/web/dist/client/ /usr/share/nginx/html/
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /run && \
	chmod -R 755 /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /run && \
	find /usr/share/nginx/html -type d -exec chmod 755 {} \; && \
	find /usr/share/nginx/html -type f -exec chmod 444 {} \;

USER nginx
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
