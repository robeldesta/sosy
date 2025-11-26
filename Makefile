.PHONY: dev up down migrate migrate-create migrate-upgrade migrate-downgrade clean

# Development mode - start all services
dev:
	docker-compose up --build

# Start services in detached mode
up:
	docker-compose up -d

# Stop services
down:
	docker-compose down

# Stop services and remove volumes
down-volumes:
	docker-compose down -v

# Run database migrations
migrate:
	docker-compose exec backend alembic upgrade head

# Create a new migration
migrate-create:
	docker-compose exec backend alembic revision --autogenerate -m "$(message)"

# Upgrade database to latest migration
migrate-upgrade:
	docker-compose exec backend alembic upgrade head

# Downgrade database by one migration
migrate-downgrade:
	docker-compose exec backend alembic downgrade -1

# Clean up containers and volumes
clean:
	docker-compose down -v
	docker system prune -f

# View logs
logs:
	docker-compose logs -f

# View backend logs
logs-backend:
	docker-compose logs -f backend

# View frontend logs
logs-frontend:
	docker-compose logs -f frontend

# Access backend shell
shell-backend:
	docker-compose exec backend /bin/bash

# Access postgres shell
shell-postgres:
	docker-compose exec postgres psql -U postgres -d sosy

