# SOSY - Stock Management & Invoicing System

A Telegram Mini App for stock management, invoicing, and tax compliance designed for Ethiopian micro retail businesses.

## Features

- 📦 **Stock Management**: Track inventory with real-time updates
- 🧾 **Invoicing**: Create and manage invoices with automatic tax calculation (15% VAT)
- 🏢 **Business Management**: Store business information and tax details
- 🌍 **Multi-language Support**: English, Amharic (አማርኛ), and Afaan Oromo
- 🔐 **Telegram Authentication**: Secure login via Telegram Mini App

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- i18next (Internationalization)
- Zustand (State Management)
- @telegram-apps/sdk-react (Telegram Mini App SDK)

### Backend
- FastAPI
- SQLModel (ORM)
- PostgreSQL
- Redis (Sessions & Rate Limiting)
- Alembic (Database Migrations)
- JWT Authentication

## Project Structure

```
sosy/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and API client
│   ├── locales/      # i18n translation files
│   └── stores/       # Zustand state stores
├── backend/          # FastAPI backend application
│   ├── app/
│   │   ├── api/      # API route handlers
│   │   ├── core/     # Core configuration and utilities
│   │   ├── db/       # Database session and setup
│   │   ├── models/   # SQLModel database models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic services
│   └── alembic/      # Database migrations
├── docker-compose.yml # Docker services configuration
└── Makefile          # Development commands
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Make (optional, for using Makefile commands)

### Environment Variables

Create a `.env` file in the root directory:

```env
SECRET_KEY=your-secret-key-change-in-production
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
CORS_ORIGINS=http://localhost:3000,https://your-telegram-miniapp-url.com
```

### Quick Start

1. **Start all services:**
   ```bash
   make dev
   ```
   Or manually:
   ```bash
   docker-compose up --build
   ```

2. **Run database migrations:**
   ```bash
   make migrate
   ```
   Or manually:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Makefile Commands

- `make dev` - Start all services in development mode
- `make up` - Start services in detached mode
- `make down` - Stop all services
- `make migrate` - Run database migrations
- `make migrate-create message="migration name"` - Create a new migration
- `make logs` - View logs from all services
- `make clean` - Clean up containers and volumes

## API Endpoints

### Authentication
- `POST /auth/telegram-login` - Authenticate via Telegram login widget

### Stock
- `GET /stock` - Get all stock items
- `POST /stock` - Create a new stock item

### Invoice
- `GET /invoice` - Get all invoices
- `POST /invoice` - Create a new invoice

### Business
- `GET /business` - Get business information
- `PUT /business` - Update business information

## Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Database Migrations

Create a new migration:
```bash
make migrate-create message="add new field"
```

Apply migrations:
```bash
make migrate-upgrade
```

Rollback migration:
```bash
make migrate-downgrade
```

## Docker Services

- **frontend**: Next.js development server (port 3000)
- **backend**: FastAPI application (port 8000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)

## License

MIT

