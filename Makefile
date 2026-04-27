NAME = ft_transcendence

COMPOSE = docker compose

GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
RESET = \033[0m

all: check start

check:
	@printf "$(YELLOW)[CHECK] Verifying Docker...$(RESET)\n"
	@docker info > /dev/null 2>&1 || (printf "$(RED)Docker is not running$(RESET)\n" && exit 1)
	@printf "$(GREEN)[OK] Docker is running$(RESET)\n"

start:
	@printf "$(GREEN)[START] Building and starting containers...$(RESET)\n"
	@$(COMPOSE) up --build -d
	@printf "$(GREEN)[OK] Project is running$(RESET)\n"

up:
	@printf "$(YELLOW)[UP] Running in foreground...$(RESET)\n"
	@$(COMPOSE) up --build

down:
	@printf "$(RED)[DOWN] Stopping containers...$(RESET)\n"
	@$(COMPOSE) down

stop:
	@$(COMPOSE) stop

re: down start

logs:
	@$(COMPOSE) logs -f

clean:
	@printf "$(RED)[CLEAN] Removing unused Docker resources...$(RESET)\n"
	@docker system prune -af

fclean: down clean

help:
	@echo "$(GREEN)Available commands:$(RESET)"
	@echo "  make        -> check + start project"
	@echo "  make start  -> run in background"
	@echo "  make up     -> run in foreground (debug)"
	@echo "  make down   -> stop containers"
	@echo "  make re     -> restart project"
	@echo "  make logs   -> show logs"
	@echo "  make clean  -> clean docker system"/
