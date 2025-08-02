CLI = bunx drizzle-kit
COMPOSE = cd docker && docker compose
TARGET = bun
NAME = open-job-api
OUT = $(NAME)

all:
	( make db-studio & pid=$$!; make api-start; kill $$pid )

compose-up:
	@$(COMPOSE) up -d

compose-prod:
	cp ./docker/Dockerfile ./
	@$(COMPOSE) --profile production up api

compose-prod-rebuild:
	cp ./docker/Dockerfile ./
	@$(COMPOSE) --profile production up --build api

compose-rm:
	@$(COMPOSE) down -v --remove-orphans

db-push:
	$(CLI) push

db-generate:
	$(CLI) generate

db-studio:
	$(CLI) studio

db-reset:
	@./scripts/drop-db.sh
	@$(CLI) push
	@$(CLI) generate

dummy-data:
	bun run scripts/dummy.ts

stress-data:
	@pids=""; \
	for i in {1..100}; do \
		echo "Running stress data with parameter $$i"; \
		bun run scripts/stress_data.ts $$i & \
		pids="$$pids $$!"; \
	done; \
	echo "Waiting for all stress tests to complete..."; \
	for pid in $$pids; do \
		wait $$pid; \
	done; \
	echo "All stress tests completed."

stress-user:
	@for i in {1..50}; do \
		echo "Running stress data with parameter $$i"; \
		bun run scripts/stress_user.ts $$i & \
		sleep 0.7; \
	done; \
	echo "Waiting for all remaining stress tests to complete..."; \
	wait; \
	echo "All stress tests completed."

tests:
	@./scripts/drop-db.sh
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

docker-push:
	cp ./docker/Dockerfile ./
	docker buildx build \
		--platform linux/amd64,linux/arm64/v8 \
		--pull \
		--tag suleymanrs/$(NAME):latest \
		--push \
		.
	rm Dockerfile

build:
	mkdir -p ./out
	bun build --compile --minify-whitespace --minify-syntax --target $(TARGET) --outfile ./out/$(OUT) ./src/main.ts

	chmod +x ./out/$(OUT)

build-linux:
	make build TARGET=bun-linux-x64-modern OUT=server-linux

build-darwin-arm64:
	make build TARGET=bun-darwin-arm64 OUT=server-darwin-arm64

build-darwin-x64:
	make build TARGET=bun-darwin-x64 OUT=server-darwin-x64

build-rm:
	rm -rf ./out
