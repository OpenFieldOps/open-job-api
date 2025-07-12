CLI = bunx drizzle-kit
COMPOSE = docker compose
TARGET=bun
OUT=server

all:
	( make db-studio & pid=$$!; make api-start; kill $$pid )

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
	@$(CLI) push > /dev/null
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
	--target $(TARGET) \
	--outfile ./out/$(OUT) \
	--bytecode \
	./src/index.ts

	chmod +x ./out/server

build-linux:
	make build TARGET=bun-linux-x64-modern OUT=server-linux

build-darwin-arm64:
	make build TARGET=bun-darwin-arm64 OUT=server-darwin-arm64

build-darwin-x64:
	make build TARGET=bun-darwin-x64 OUT=server-darwin-x64

build-rm:
	rm -rf ./out