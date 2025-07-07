CLI = bunx drizzle-kit
COMPOSE = docker compose

.PHONY: update_db rm_db start_db restart_db run_studio

update_db:
	$(CLI) generate
	$(CLI) migrate
	$(CLI) push

rm_db:
	@$(COMPOSE) down -v --remove-orphans
	@rm -rf ./drizzle

start_db:
	@$(COMPOSE) up -d
	@sleep 2
	@make update_db

restart_db:
	make rm_db
	make start_db

run_studio:
	$(CLI) studio
