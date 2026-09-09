NAME = ft_transcendence

COMPOSE = docker compose
COMPOSE_DEV = docker compose -f docker-compose.dev.yml

GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
RESET = \033[0m

all: check start

check:
	@printf "$(YELLOW)[CHECK] Verifying Docker...$(RESET)\n"
	@docker info > /dev/null 2>&1 || (printf "$(RED)Docker is not running$(RESET)\n" && exit 1)
	@printf "$(GREEN)[OK] Docker is running$(RESET)\n"

dev: check
	@$(COMPOSE) down 2>/dev/null || true
	@printf "$(GREEN)[DEV] Starting project in development mode...$(RESET)\n"
	@$(COMPOSE_DEV) up --build -d
	@printf "$(GREEN)[OK] Dev environment is running!$(RESET)\n"
	@printf "$(GREEN)Frontend (with React DevTools & HMR): http://localhost:8080$(RESET)\n"
	@printf "$(YELLOW)Run 'make dev-logs' to view logs, 'make dev-down' to stop.$(RESET)\n"

dev-up: check
	@$(COMPOSE) down 2>/dev/null || true
	@printf "$(YELLOW)[DEV] Starting project in foreground development mode...$(RESET)\n"
	@$(COMPOSE_DEV) up --build

dev-down:
	@printf "$(RED)[DEV] Stopping development containers...$(RESET)\n"
	@$(COMPOSE_DEV) down

dev-logs:
	@$(COMPOSE_DEV) logs -f

start:
	@$(COMPOSE_DEV) down 2>/dev/null || true
	@printf "$(GREEN)[START] Building frontend pages...$(RESET)\n"
	docker run --rm \
	-v $(PWD)/frontend:/app:Z \
	-w /app \
	node:20-alpine \
	sh -c "npm install && npm run build"
	@printf "$(GREEN)[START] Building and starting containers...$(RESET)\n"
	@$(COMPOSE) up --build -d
	@printf "$(GREEN)[OK] Project is running$(RESET)\n"

up:
	@$(COMPOSE_DEV) down 2>/dev/null || true
	@printf "$(YELLOW)[UP] Running in foreground...$(RESET)\n"
	@$(COMPOSE) up --build

down:
	@printf "$(RED)[DOWN] Stopping containers...$(RESET)\n"
	@$(COMPOSE_DEV) down 2>/dev/null || true
	@$(COMPOSE) down 2>/dev/null || true

stop:
	@$(COMPOSE) stop

logs:
	@$(COMPOSE) logs -f

clean:
	@printf "$(RED)[CLEAN] Removing unused Docker resources...$(RESET)\n"
	@docker system prune -af

fclean: down clean

re: fclean start

help:
	@echo "$(GREEN)Available commands:$(RESET)"
	@echo "  make          -> check + start project (prod)"
	@echo "  make dev      -> start development mode (React DevTools + HMR + watch)"
	@echo "  make dev-up   -> start dev mode in foreground (debug)"
	@echo "  make dev-down -> stop dev containers"
	@echo "  make dev-logs -> show dev logs"
	@echo "  make start    -> run in background (prod)"
	@echo "  make up       -> run in foreground (prod debug)"
	@echo "  make down     -> stop containers"
	@echo "  make re       -> restart project"
	@echo "  make logs     -> show logs"
	@echo "  make clean    -> clean docker system"
