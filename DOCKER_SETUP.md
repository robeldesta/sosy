# Docker Setup Guide

## Quick Start

### 1. Create Environment File (Optional)

Create a `.env` file in the root directory for custom configuration:

```bash
cp .env.example .env  # if .env.example exists
# or create manually
```

```env
SECRET_KEY=your-secret-key-change-in-production
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
CORS_ORIGINS=http://localhost:3000,https://your-telegram-miniapp-url.com
```

**Note**: The docker-compose.yml has defaults, so this is optional for development.

### 2. Start All Services

**Using Makefile (recommended):**
```bash
make dev
```

**Or using docker-compose directly:**
```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Backend API** on port 8000
- **Frontend** on port 3000

### 3. Run Database Migrations

After services are up, run migrations:

```bash
make migrate
```

**Or manually:**
```bash
docker-compose exec backend alembic upgrade head
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API ReDoc**: http://localhost:8000/redoc

## Common Commands

### Start Services

```bash
# Development mode (with logs)
make dev

# Detached mode (background)
make up
# or
docker-compose up -d
```

### Stop Services

```bash
make down
# or
docker-compose down
```

### View Logs

```bash
# All services
make logs

# Backend only
make logs-backend

# Frontend only
make logs-frontend

# Or directly
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Migrations

```bash
# Run migrations
make migrate

# Create new migration
make migrate-create message="add new field"

# Upgrade to latest
make migrate-upgrade

# Rollback one migration
make migrate-downgrade
```

### Access Container Shells

```bash
# Backend shell
make shell-backend
# or
docker-compose exec backend /bin/bash

# PostgreSQL shell
make shell-postgres
# or
docker-compose exec postgres psql -U postgres -d sosy
```

### Clean Up

```bash
# Stop and remove containers
make down

# Stop, remove containers AND volumes (⚠️ deletes data)
make down-volumes

# Full cleanup (containers, volumes, and unused images)
make clean
```

## Troubleshooting

### Port Already in Use

If ports 3000, 8000, 5432, or 6379 are already in use:

1. Stop the conflicting service
2. Or modify ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Change frontend port
     - "8001:8000"   # Change backend port
   ```

### Database Connection Issues

If backend can't connect to database:

1. Check if postgres is healthy:
   ```bash
   docker-compose ps
   ```

2. Wait for postgres to be ready (healthcheck):
   ```bash
   docker-compose logs postgres
   ```

3. Verify DATABASE_URL in backend container:
   ```bash
   docker-compose exec backend env | grep DATABASE_URL
   ```

### Frontend Build Issues

If frontend fails to build:

1. Check Node.js version in Dockerfile (should be 20)
2. Clear node_modules and rebuild:
   ```bash
   docker-compose down
   docker-compose build --no-cache frontend
   docker-compose up
   ```

### Migration Errors

If migrations fail:

1. Check if database exists:
   ```bash
   docker-compose exec postgres psql -U postgres -l
   ```

2. Verify alembic can connect:
   ```bash
   docker-compose exec backend alembic current
   ```

3. Check migration files exist:
   ```bash
   docker-compose exec backend ls -la alembic/versions/
   ```

## Development Workflow

### Hot Reload

Both frontend and backend support hot reload:
- **Backend**: Uses `--reload` flag in uvicorn
- **Frontend**: Next.js dev server with hot reload

Changes to code are automatically reflected (no need to restart containers).

### Database Changes

When you modify models:

1. Create migration:
   ```bash
   make migrate-create message="description of changes"
   ```

2. Review the generated migration file in `backend/alembic/versions/`

3. Apply migration:
   ```bash
   make migrate
   ```

### Viewing Database

Connect to PostgreSQL:
```bash
make shell-postgres
```

Then run SQL queries:
```sql
\dt                    -- List tables
SELECT * FROM product; -- View products
\d product            -- Describe product table
```

## Production Considerations

For production deployment:

1. **Change SECRET_KEY** in `.env` to a strong random value
2. **Set proper CORS_ORIGINS** to your actual domain
3. **Use production Dockerfiles** (separate from dev)
4. **Set up proper volumes** for data persistence
5. **Configure SSL/TLS** for database connections
6. **Use environment-specific configs**

## Service URLs

When services communicate with each other inside Docker:

- Backend → Postgres: `postgres:5432`
- Backend → Redis: `redis:6379`
- Frontend → Backend: `http://backend:8000` (internal) or `http://localhost:8000` (from host)

## Volumes

Data is persisted in Docker volumes:
- `postgres_data`: PostgreSQL database files
- `redis_data`: Redis data
- `frontend/node_modules`: Node modules (excluded from host mount)
- `frontend/.next`: Next.js build cache (excluded from host mount)

To backup data:
```bash
docker-compose exec postgres pg_dump -U postgres sosy > backup.sql
```


