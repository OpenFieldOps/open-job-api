CLI = bunx drizzle-kit
COMPOSE = docker compose

compose-up:
	@$(COMPOSE) up -d
	@sleep 2

compose-rm:
	@$(COMPOSE) down -v --remove-orphans


db-migrate:
	$(CLI) generate
	$(CLI) migrate
	$(CLI) push

db-rm:
	make compose-up
	@rm -rf ./drizzle

db-reset:
	make db-rm
	make compose-up
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

tests:
	@./scripts/drop-db.sh > /dev/null
	@rm -rf ./drizzle > /dev/null
	@$(CLI) generate > /dev/null
	@$(CLI) migrate > /dev/null
	@bun test $(ARGS)

pre-commit:
	@echo "Starting pre-commit checks..."
	@{ bun run lint && make tests; } && \
		clear && echo "Pre-commit checks passed successfully." || \
		{ echo "Pre-commit checks failed. See the messages above."; exit 1; }

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