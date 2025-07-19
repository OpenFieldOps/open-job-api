FROM oven/bun:latest AS base
WORKDIR /usr/src/app


FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base as prerelease
COPY --from=install /temp/prod/node_modules node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM base as release
COPY --from=prerelease /usr/src/app ./


USER bun
EXPOSE 4000/tcp
ENTRYPOINT /bin/sh -c "bun run db-push && ./index"