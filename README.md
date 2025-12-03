# SOSY - Stock Management & Invoicing System

A Telegram Mini App for stock management, invoicing, and tax compliance designed for Ethiopian micro retail businesses.

## Development Status: Day 17 Complete ✅

**Current Implementation:** Real-Time Multi-Device Sync Engine, Full Admin Panel, WebSocket Support, Subscription Management, Business Administration, System Health Monitoring, and more.

## Features

### Core Features
- 📦 **Stock Management**: Track inventory with real-time updates, low-stock alerts, SKU/barcode support
- 🧾 **Invoicing**: Create and manage invoices with automatic tax calculation (15% VAT), multiple templates, PDF generation
- 🏢 **Business Management**: Store business information, tax details, shop settings
- 🌍 **Multi-language Support**: English, Amharic (አማርኛ), Afaan Oromo, Tigrigna
- 🔐 **Telegram Authentication**: Secure login via Telegram Mini App with dev mode for testing

### Advanced Features (Days 1-17)
- 🛒 **Point of Sale (POS)**: Lightning-fast sales screen with instant product search and cart management
- 📊 **Dashboard & Analytics**: Real-time KPIs, daily sales flow, top products, low stock alerts
- 💰 **Payment Management**: Multiple payment methods (Cash, Mobile Money, Card, Credit), partial payments, payment tracking
- 📈 **Cashbook & Expenses**: Daily cash in/out tracking, expense categories, reconciliation
- 👥 **Multi-User & RBAC**: Owner/Manager/Staff roles, invite system, permission-based access control
- 🏪 **Multi-Branch Support**: Branch management, branch-specific inventory and sales
- 📦 **Purchase Management**: Supplier directory, purchase orders, Goods Received Notes (GRN)
- 📋 **Stock Taking**: Full stock count workflow with shrinkage detection and reporting
- 🔄 **Offline-First Sync**: Multi-device sync engine with conflict resolution, works offline
- ⚡ **Real-Time Sync**: WebSocket-based live sync across all devices (300-600ms latency)
- 📱 **Activity Logging**: Complete audit trail of all user actions
- 💳 **Subscription System**: Plan management, payment integration (Telebirr, Chapa, PayPal), access control
- 🛡️ **Admin Panel**: Full SaaS administration dashboard with business management, subscription control, system health monitoring
- 📄 **Invoice Templates**: Multiple professional PDF templates, sharing via Telegram
- 🔍 **Advanced Search**: Debounced product search by name, SKU, barcode
- 📊 **Reports**: Daily/weekly/monthly sales, expense reports, profit estimates, credit aging
- 🚨 **Notifications**: Low-stock alerts, daily summary digest via Telegram

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
- `POST /auth/dev-login` - Development login for testing (dev mode only)
- `POST /auth/verify-pin` - Verify PIN for staff access
- `POST /auth/set-pin` - Set/update PIN

### Stock & Inventory
- `GET /stock` - Get all stock items
- `POST /stock` - Create a new stock item
- `PUT /stock/:id` - Update stock item
- `DELETE /stock/:id` - Delete stock item
- `POST /stock/:id/adjust` - Adjust stock levels
- `GET /stock/search?q=` - Search products by name/SKU/barcode
- `GET /stock/analytics` - Stock analytics (top sellers, slow movers, dead stock)

### Invoice
- `GET /invoice` - Get all invoices (with filters)
- `POST /invoice` - Create a new invoice
- `GET /invoice/:id` - Get invoice details
- `PUT /invoice/:id/status` - Update invoice status
- `GET /invoice/:id/pdf` - Download invoice PDF

### Purchase & Suppliers
- `GET /suppliers` - List all suppliers
- `POST /suppliers` - Create supplier
- `GET /purchase` - List purchase orders
- `POST /purchase` - Create purchase order
- `GET /purchase/:id/pdf` - Download GRN PDF

### POS
- `GET /pos/search?q=` - Search products for POS
- `POST /pos/checkout` - Process POS sale
- `GET /pos/sessions` - List POS sessions

### Payments & Cashbook
- `POST /payment` - Record payment on invoice
- `GET /cashbook` - Get cashbook summary
- `GET /cashbook/reconcile` - Cash reconciliation
- `POST /expense` - Record expense
- `GET /expense` - List expenses

### Dashboard & Analytics
- `GET /dashboard` - Dashboard data (sales, purchases, low stock, top products)
- `GET /analytics` - Advanced analytics
- `POST /quick_sell` - Quick sell flow
- `GET /reports/daily` - Daily sales report
- `GET /reports/weekly` - Weekly summary
- `GET /reports/monthly` - Monthly overview

### Stock Taking
- `POST /stocktake/start` - Start stock take session
- `POST /stocktake/session/:id/count` - Add counts to session
- `GET /stocktake/session/:id` - Get session details
- `POST /stocktake/session/:id/approve` - Approve stock adjustments
- `GET /stocktake/session/:id/report` - Shrinkage report

### Sync (Offline-First)
- `POST /sync/push` - Push local changes to server
- `GET /sync/pull?since=` - Pull server changes
- `GET /sync/state` - Get sync state

### Subscription
- `GET /subscription/billing/status` - Get subscription status
- `GET /subscription/plans` - List available plans
- `POST /subscription/subscribe/init` - Initialize payment
- `POST /subscription/subscribe/verify` - Verify payment

### Admin
- `GET /admin/stats/dashboard` - Get system-wide statistics
- `GET /admin/businesses` - List all businesses
- `GET /admin/businesses/{id}` - Get business details
- `POST /admin/businesses/{id}/suspend` - Suspend a business
- `POST /admin/businesses/{id}/upgrade` - Upgrade business plan
- `GET /admin/businesses/{id}/metrics` - Get business metrics
- `GET /admin/subscriptions` - List all subscriptions
- `GET /admin/subscriptions/{id}` - Get subscription details
- `POST /admin/subscriptions/{id}/extend` - Extend subscription
- `POST /admin/subscriptions/{id}/cancel` - Cancel subscription
- `POST /admin/subscriptions/{id}/activate` - Activate subscription
- `GET /admin/subscriptions/{id}/payments` - Get payment history
- `GET /admin/subscriptions/plans` - List subscription plans

### WebSocket
- `WS /ws/{business_id}` - Real-time sync WebSocket connection

### User Management & Permissions
- `GET /permissions/capabilities` - Get user permissions
- `GET /staff` - List staff members
- `POST /invite` - Create staff invite
- `GET /branch` - List branches
- `POST /branch` - Create branch
- `GET /activity` - Activity log

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

## Development Roadmap

### Completed (Days 1-17)
- ✅ **Day 1-7**: Core stock management, invoicing, i18n, UI/UX overhaul
- ✅ **Day 8**: Invoice templates, sharing, audit trail, numbering rules
- ✅ **Day 9**: Stock engine upgrade (SKU, barcode, purchase price, low-stock alerts)
- ✅ **Day 10**: Payment management, cashbook, expenses, credit sales, daily summaries
- ✅ **Day 11**: RBAC, multi-user access, invites, activity logging, staff restrictions
- ✅ **Day 12**: Subscription system, payment providers (Telebirr, Chapa, PayPal)
- ✅ **Day 13**: Point of Sale (POS) mode with atomic stock deduction
- ✅ **Day 14**: Offline-first sync engine with multi-device support
- ✅ **Day 15**: Stock taking workflow, shrinkage management, adjustment approval
- ✅ **Day 16**: Customer accounts, credit ledgers, loyalty points, aging reports
- ✅ **Day 17**: Real-time WebSocket sync, full admin panel, subscription management, system health monitoring

### Testing & Development
- 🔧 **Dev Mode**: Test user authentication for development outside Telegram
  - Test User: Telegram ID `684087296` (Robel Desta)
  - Auto-login when running outside Telegram WebApp
  - **Note**: Remove dev login before production deployment

## License

MIT

