CLI = bunx drizzle-kit
COMPOSE = cd docker && docker compose
TARGET = bun
NAME = job-api
OUT = $(NAME)

all:
	( make db-studio & pid=$$!; make api-start; kill $$pid )

compose-up:
	@$(COMPOSE) up -d
	@sleep 2

compose-prod:
	@$(COMPOSE) --profile production up api

compose-prod-rebuild:
	@$(COMPOSE) --profile production up --build api

compose-rm:
	@$(COMPOSE) down -v --remove-orphans

db-push:
	$(CLI) push

db-generate:
	$(CLI) generate

db-studio:
	$(CLI) studio

dummy-data:
	bun run scripts/dummy.ts

tests:
	@./scripts/drop-db.sh
	@rm -rf ./drizzle > /dev/null
	@$(CLI) push
	@bun test

pre-commit:
	@echo "Starting pre-commit checks..."
	@{ bun run lint && make tests; } && \
		clear && echo "Pre-commit checks passed successfully." || \
		{ echo "Pre-commit checks failed. See the messages above."; exit 1; }

docker-build:
	cp ./docker/Dockerfile ./
	docker build --pull -t $(NAME) .
	rm Dockerfile

build:
	mkdir -p ./out
	bun build --compile --minify-whitespace --minify-syntax --target $(TARGET) --outfile ./out/$(OUT) ./src/index.ts

	chmod +x ./out/$(OUT)

build-linux:
	make build TARGET=bun-linux-x64-modern OUT=server-linux

build-darwin-arm64:
	make build TARGET=bun-darwin-arm64 OUT=server-darwin-arm64

build-darwin-x64:
	make build TARGET=bun-darwin-x64 OUT=server-darwin-x64

build-rm:
	rm -rf ./out