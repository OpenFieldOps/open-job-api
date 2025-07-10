CLI = bunx drizzle-kit
COMPOSE = docker compose

db-migrate:
	$(CLI) generate
	$(CLI) migrate
	$(CLI) push

db-rm:
	@$(COMPOSE) down -v --remove-orphans
	@rm -rf ./drizzle

db-start:
	@$(COMPOSE) up -d
	@sleep 2

db-reset:
	make db-rm
	make db-start
	make db-migrate
	make api-dummy-data

db-studio:
	$(CLI) studio

api-install:
	bun install

api-start:
	bun dev

api-dummy-data:
	bun run scripts/dummy.ts

build:
	mkdir -p ./out
	bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile ./out/server \
	./src/index.ts

	chmod +x ./out/server

build-rm:
	rm -rf ./out