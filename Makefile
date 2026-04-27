NAME = ft_transcendence

COMPOSE = docker compose

up:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

start:
	$(COMPOSE) up -d

stop:
	$(COMPOSE) stop

re: down up

logs:
	$(COMPOSE) logs -f

clean:
	docker system prune -af
	docker volume prune -f

fclean: down clean
