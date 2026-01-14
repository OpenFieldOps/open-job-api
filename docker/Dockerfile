FROM oven/bun:latest AS base
WORKDIR /usr/src/app


FROM base AS install
WORKDIR /tmp/prod
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /tmp/prod/node_modules node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM base AS release
COPY --from=prerelease /usr/src/app ./

USER bun
EXPOSE 4000/tcp
ENTRYPOINT ["/bin/sh", "-c", "bun run db-push && ./main"]