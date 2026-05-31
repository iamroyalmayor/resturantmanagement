# RestaurantOS API

Production-ready FastAPI foundation for the RestaurantOS platform (Phase **P0**).

## Stack

- **FastAPI** — HTTP API
- **SQLAlchemy 2.x (async)** + **asyncpg** — PostgreSQL access
- **Alembic** — schema migrations
- **Pydantic Settings** — configuration
- **structlog** — structured logging
- **Firebase Admin SDK** — Authentication + FCM (infrastructure ready)

## Project structure

```
backend/
├── app/
│   ├── main.py              # App factory & lifespan
│   ├── core/                # Config, logging, security, exceptions, events
│   ├── db/                  # Engine, session, base mixins
│   ├── models/              # SQLAlchemy ORM (foundation tables)
│   ├── schemas/             # Pydantic DTOs
│   ├── api/                 # Routers, deps, middleware, exception handlers
│   ├── services/            # Firebase & FCM services
│   └── repositories/        # Data access base
├── alembic/                 # Migrations
├── tests/
├── scripts/                 # Seed & bootstrap (future)
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml
```

## Prerequisites

- Python 3.12+
- Docker & Docker Compose (recommended)
- PostgreSQL 15+ (local or Supabase)

## Quick start (Docker)

1. Copy environment file:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Start database, run migrations, and start API:

   ```bash
   docker compose up --build
   ```

3. Verify:

   - Liveness: [http://localhost:8000/health](http://localhost:8000/health)
   - Readiness: [http://localhost:8000/ready](http://localhost:8000/ready)
   - OpenAPI: [http://localhost:8000/docs](http://localhost:8000/docs)

`docker-compose.yml` sets `FIREBASE_ENABLED=false` and `FCM_ENABLED=false` for local containers without credentials.

## Local development (without Docker)

1. Create a virtual environment and install dependencies:

   ```bash
   cd backend
   python3.12 -m venv .venv
   source .venv/bin/activate
   pip install -e ".[dev]"
   ```

2. Start PostgreSQL and configure `.env`:

   ```bash
   cp .env.example .env
   # Edit DATABASE_URL to match your local instance
   ```

3. Run migrations:

   ```bash
   alembic upgrade head
   ```

4. Start the API with hot reload:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Database migrations

```bash
# Apply all migrations
alembic upgrade head

# Create a new revision (after model changes)
alembic revision --autogenerate -m "describe change"

# Roll back one revision
alembic downgrade -1
```

Initial migration `20260531_0001` creates:

- `restaurants`
- `users`
- `staff_permissions`
- `fcm_device_tokens`

## Firebase Authentication

1. Create a Firebase project and download a service account JSON key.
2. Set in `.env`:

   ```env
   FIREBASE_ENABLED=true
   FIREBASE_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
   ```

3. Clients send `Authorization: Bearer <firebase_id_token>` on protected routes.

4. Use `get_firebase_token` from `app.api.deps` in future auth routers.

For the Auth emulator:

```env
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

## Firebase Cloud Messaging (FCM)

1. Enable FCM in the same Firebase project.
2. Set `FCM_ENABLED=true` (requires `FIREBASE_ENABLED=true` and valid credentials).
3. Use `NotificationService` from `app.services.notification_service` in domain modules.

Device tokens will be stored in `fcm_device_tokens` when the notifications API is implemented (P1+).

## Environment variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Async Postgres URL (`postgresql+asyncpg://...`) |
| `RESTAURANT_ID` | UUID of the single restaurant (after seeding) |
| `CORS_ORIGINS` | Comma-separated frontend origins |
| `FIREBASE_ENABLED` | Enable Firebase Admin SDK |
| `FCM_ENABLED` | Enable push notifications |
| `LOG_JSON` | `true` for JSON logs in production |
| `READY_CHECK_MIGRATIONS` | If `true`, `/ready` checks `alembic_version` |

## API conventions

- Versioned REST under `/api/v1`
- Success envelope: `{ "data": ..., "meta": { "request_id", "timestamp" } }`
- Error envelope: `{ "error": { "code", "message", "details" }, "meta": ... }`
- Correlation ID: `X-Request-ID` request/response header

## Tests

```bash
pip install -e ".[dev]"
pytest
```

Health tests mock database readiness; integration tests against a real database can be added in CI later.

## Phase P1 — Identity & Access API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/session` | Bearer Firebase (or dev token) | Bootstrap / link user, return role & permissions |
| GET | `/api/v1/auth/me` | Bearer | Current session payload |
| GET | `/api/v1/users/me` | Bearer | User profile |
| GET | `/api/v1/users` | Bearer (staff) | List staff members |
| GET | `/api/v1/users/{id}` | Bearer | User detail (self or staff) |
| GET | `/api/v1/settings` | Bearer (staff) | Restaurant settings + hours |
| PATCH | `/api/v1/settings` | Bearer + `settings` permission | Update restaurant config |

**Development auth** (when `FIREBASE_ENABLED=false` and `DEV_AUTH_ENABLED=true`):

```bash
curl -X POST http://localhost:8000/api/v1/auth/session \
  -H "Authorization: Bearer dev-local-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Dev Admin"}'
```

## Phase roadmap

| Phase | Scope |
|-------|--------|
| **P0** | Foundation, health, DB, Firebase/FCM infrastructure |
| **P1** (current) | Auth session, users, settings |
| **P2** | Inventory, tables, reservations, customers |
| **P3** | Reports, accounting, audit |
| **P4** | Conversations, AI assistant |

## License

Proprietary — Quant Technologies Ltd / RestaurantOS.
