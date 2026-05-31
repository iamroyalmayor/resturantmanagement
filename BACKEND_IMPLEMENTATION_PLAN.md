# RestaurantOS — Backend Implementation Plan

**Version:** 1.0  
**Status:** Architecture & design only (no implementation code)  
**Derived from:** `ARCHITECTURE_ANALYSIS.md`  
**Target stack:** FastAPI · PostgreSQL (Supabase) · Firebase Authentication · Firebase Cloud Messaging (FCM) · Docker

---

## Document Purpose

This plan defines how to build a **production-ready backend** for a **single-restaurant MVP** while preserving structural flexibility for future multi-restaurant SaaS expansion **without a database redesign**. It intentionally excludes subscription billing, tenant onboarding portals, and SaaS administration features.

---

## Design Principles

| Principle | Application |
|-----------|-------------|
| **Single restaurant, future-proof schema** | One `restaurants` row in MVP; all business tables include nullable or required `restaurant_id` |
| **Modular monolith** | One deployable FastAPI app with bounded contexts, not microservices |
| **Thin controllers, thick domain** | Routers validate I/O; services own business rules and state machines |
| **One source of truth** | Unified order and menu lifecycles across POS, web checkout, admin, and kitchen |
| **Security by default** | Firebase verifies identity; Postgres stores authorization; secrets never in frontend |
| **Observable operations** | Structured logs, health checks, correlation IDs, audit trail for critical mutations |
| **API-first contract** | Versioned REST, consistent envelopes, OpenAPI as contract with frontend |

---

## 1. Single Restaurant System Architecture

### 1.1 High-Level Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                                        │
│  React SPA (public site + staff dashboard + customer portal)                 │
│  Firebase Web SDK (Auth) · FCM Web Push · REST/WebSocket to API               │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER (Docker)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ FastAPI Application (modular monolith)                               │   │
│  │  • REST /api/v1/*                                                    │   │
│  │  • WebSocket /ws/v1/* (orders, kitchen, conversations)               │   │
│  │  • Webhooks /webhooks/* (WhatsApp, Instagram — phase 2)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  Optional: background worker container (FCM batch, alert scans)              │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Firebase Auth   │  │ PostgreSQL      │  │ Supabase        │
│ (identity)      │  │ (Supabase host) │  │ Storage         │
└─────────────────┘  └─────────────────┘  │ Realtime (opt)  │
          │                     │          └─────────────────┘
          ▼                     │
┌─────────────────┐             │
│ Firebase FCM    │◄────────────┘ (events trigger notifications)
│ (push delivery) │
└─────────────────┘
```

### 1.2 MVP Deployment Model

- **One restaurant instance** = one environment configuration (`RESTAURANT_SLUG` or fixed UUID in seed).
- **One FastAPI service** + **one Postgres database** + **one Firebase project** (Auth + FCM).
- Frontend remains a separate static build (Vite); API is the only write path to business data (except optional Supabase Realtime read subscriptions).

### 1.3 Future SaaS Extension (Design Only — Not in MVP Scope)

When multi-restaurant is needed later:

- Activate `restaurant_id` scoping in queries and RLS policies.
- Introduce tenant resolution (subdomain, header, or JWT claim) **without** removing `restaurant_id` columns.
- Add platform-admin tables in a **separate schema** (`platform.*`) to avoid mixing with operational tables.
- **Do not** build billing or onboarding in MVP; the schema simply **allows** multiple `restaurants` rows.

### 1.4 Bounded Contexts

| Context | Responsibility |
|---------|----------------|
| **Identity & Access** | Firebase verification, user profiles, roles, module permissions |
| **Restaurant Config** | Settings, hours, tax rates, integration metadata (non-secret) |
| **Menu** | Categories, items, modifiers, variants, public catalog projection |
| **Orders** | Unified lifecycle, pricing, payments state, channel attribution |
| **Kitchen** | KDS views, line-item progression, prep timers |
| **Floor** | Tables, reservations, availability |
| **Customers** | CRM, loyalty, addresses, favorites, portal APIs |
| **Inventory** | Stock, movements, alerts, recipes, purchase orders |
| **Conversations** | Omnichannel threads (phase 2 webhooks) |
| **Finance** | Ledger entries, reporting aggregates |
| **Notifications** | FCM device registry, event-driven push |
| **AI** | Staff assistant queries over operational data (read-only, guarded) |
| **Audit** | Immutable activity log for compliance and debugging |

Contexts communicate via **domain services** and **domain events** (in-process for MVP; message queue optional later).

### 1.5 Request Context Object

Every authenticated request resolves a **`RequestContext`**:

```
RequestContext {
  firebase_uid: str
  user_id: UUID
  restaurant_id: UUID      # single row in MVP; always populated
  role: UserRole
  permissions: set[ModulePermission]
  correlation_id: str
}
```

All repository queries filter by `restaurant_id` from context, never from client-supplied body (except public endpoints that use env-fixed restaurant).

---

## 2. Database Design Strategy

### 2.1 Platform Choice

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Primary store | **PostgreSQL 15+** via Supabase | Relational integrity, JSONB for flexible fields, mature tooling |
| ORM | **SQLAlchemy 2.x** (async) | Explicit models, migrations via Alembic |
| Migrations | **Alembic** | Versioned, reviewable schema changes |
| File blobs | **Supabase Storage** | Menu images, QR assets; DB stores URLs only |
| Realtime (optional) | **Supabase Realtime** or **native WebSocket** | Kitchen/order updates; API remains authoritative |

FastAPI owns **all writes**. Supabase client direct access from browser is **disabled for MVP** (no anon INSERT/UPDATE on business tables) to keep business rules centralized.

### 2.2 Schema Organization

Use a single schema `public` for MVP with clear table prefixes optional but not required:

```
public.*
  restaurants, operating_hours, integration_settings
  users, staff_permissions, fcm_device_tokens
  menu_*, orders, order_items, order_item_modifiers
  tables, reservations
  customers, customer_*
  inventory_*, stock_movements, recipes, recipe_ingredients
  conversations, messages
  ledger_entries, order_status_history
  audit_logs, ai_query_logs
```

Future: `platform.tenants`, `platform.subscriptions` in separate schema — **not created in MVP**.

### 2.3 Multi-Restaurant Readiness (Without Implementing SaaS)

| Rule | Detail |
|------|--------|
| **Mandatory `restaurant_id`** | On every business table except `restaurants` itself |
| **Composite uniqueness** | e.g. `(restaurant_id, order_number)`, `(restaurant_id, sku)` |
| **Foreign keys** | Child rows reference parent within same restaurant (enforced in service layer + DB where practical) |
| **Single-row MVP** | Seed inserts exactly one `restaurants` row; `RESTAURANT_ID` env var for scripts |
| **No tenant middleware in MVP** | Context always uses seeded `restaurant_id`; later: resolve from JWT claim or subdomain |

### 2.4 Data Integrity Patterns

- **Enums** stored as PostgreSQL `ENUM` or `TEXT` + check constraints (prefer ENUM for order status, roles).
- **Money** as `NUMERIC(12,2)`; never float.
- **Timestamps** as `TIMESTAMPTZ` (UTC storage; restaurant timezone for display rules).
- **Soft delete** for menu items, inventory items, users (`deleted_at`); hard delete only for dev/test.
- **Optimistic locking** via `version` column on `orders`, `inventory_items` for concurrent POS/kitchen updates.
- **JSONB** for `nutritional_info`, `dietary_restrictions`, integration metadata snapshots.

### 2.5 Indexing Strategy

| Table / Query pattern | Index |
|----------------------|-------|
| `orders` by status + created_at | `(restaurant_id, status, created_at DESC)` |
| `orders` kitchen queue | `(restaurant_id, status)` WHERE status IN ('confirmed','preparing','ready') |
| `order_items` by order | `(order_id)` |
| `menu_items` public catalog | `(restaurant_id, is_available, display_order)` |
| `inventory_items` low stock | `(restaurant_id, status)` |
| `users` login lookup | `(firebase_uid)` UNIQUE |
| `fcm_device_tokens` | `(user_id)`, `(token)` UNIQUE |

### 2.6 Transaction Boundaries

| Operation | Transaction scope |
|-----------|-------------------|
| Create order | Insert order + items + modifiers + initial status history |
| Complete order | Update order + deduct inventory from recipes + ledger entry + loyalty update |
| Stock movement | Movement row + item stock update + alert recalculation |
| Cancel order | Status update + optional inventory reversal policy |

Use **one database transaction** per service method for atomicity; publish FCM/WebSocket **after** commit.

---

## 3. Authentication Architecture (Firebase Auth)

### 3.1 Responsibility Split

| Layer | Responsibility |
|-------|----------------|
| **Firebase Auth** | Email/password (and future OAuth); ID token issuance; password reset |
| **FastAPI** | Verify token; map to `users`; enforce role + module permissions |
| **PostgreSQL** | Source of truth for `role`, `is_active`, staff permissions, `customer` linkage |

Firebase custom claims are **optional for MVP**; prefer Postgres `users.role` to avoid dual sources of truth.

### 3.2 Authentication Flow

```
1. Client signs in via Firebase SDK → receives ID token (JWT)
2. Client calls POST /api/v1/auth/session with Authorization: Bearer <token>
3. API verifies JWT (Firebase Admin SDK):
   - Valid signature, issuer, audience, expiry
   - Extract firebase_uid, email
4. Upsert users row (create if first login):
   - Signup path → role = customer, link/create customers row
   - Staff invite path → pre-created row with role set by admin
5. Return AppSessionPayload:
   - user profile, role, permissions[], restaurant_id
6. Subsequent requests: same Bearer token; optional session refresh via token rotation handled by Firebase client
```

### 3.3 Staff Provisioning (MVP)

| Method | Flow |
|--------|------|
| **Bootstrap admin** | Seed script creates Firebase user + `users.role = admin` |
| **Admin invites staff** | Admin API creates `users` row (email, role); staff completes Firebase signup with same email; session endpoint links `firebase_uid` |
| **Deactivate** | `users.is_active = false`; API rejects with 403 |

Passwords are **never** stored in Postgres.

### 3.4 Authorization Model

Two layers:

1. **Role-based (RBAC)** — coarse access (dashboard vs customer portal).
2. **Module permissions** — fine-grained flags in `staff_permissions` for staff roles.

`customer` role bypasses staff modules; uses `/customers/me/*` only.

Dependency injection in FastAPI:

```
get_current_user() → verify Firebase JWT
get_request_context() → load user + permissions + restaurant_id
require_role(*roles)
require_permission(module)
```

### 3.5 Public & Guest Endpoints

| Endpoint class | Auth |
|----------------|------|
| `GET /public/menu` | None; rate-limited by IP |
| `POST /public/orders` | Optional auth (logged-in customer) or guest with phone/email |
| `POST /public/reservations` | None; rate-limited; CAPTCHA hook (future) |
| Webhooks | HMAC signature verification, no Firebase |

### 3.6 Security Controls

- Token verification on **every** protected route (no global skip except health/docs).
- CORS allowlist from env.
- Rate limiting on auth and public order endpoints (e.g. slowapi).
- Audit log on role/permission changes.
- Service account JSON for Firebase Admin **only** in server env / secrets manager.

---

## 4. Notification Architecture (Firebase FCM)

### 4.1 Goals

- Real-time awareness for staff (new orders, kitchen delays, low stock).
- Customer notifications (order ready, reservation confirmed) in phase 2.
- No secrets in browser beyond Firebase client config.

### 4.2 Components

```
┌──────────────┐    register token     ┌─────────────────────┐
│ React client │ ───────────────────► │ POST /notifications/│
│ (FCM SDK)    │                       │      devices        │
└──────────────┘                       └──────────┬──────────┘
                                                │
┌──────────────┐    domain event        ┌───────▼──────────┐
│ OrderService │ ─────────────────────► │ NotificationService│
│ InventorySvc │                       │ (FCM Admin SDK)  │
└──────────────┘                       └──────────┬─────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │ Firebase FCM    │
                                       └─────────────────┘
```

### 4.3 Device Registration

| Field | Purpose |
|-------|---------|
| `user_id` | Target staff/customer |
| `token` | FCM registration token |
| `platform` | `web`, `android`, `ios` |
| `restaurant_id` | Scope for topic subscription |

On login: register or refresh token. On logout: delete token row.

### 4.4 Delivery Strategies (MVP)

| Strategy | Use case |
|----------|----------|
| **Per-user token** | Assigned waiter/chef, personal alerts |
| **Role topics** | `restaurant_{id}_kitchen`, `restaurant_{id}_managers`, `restaurant_{id}_pos` |
| **Data payload** | `{ "type": "order.created", "order_id": "...", "order_number": "..." }` for in-app routing |

Subscribe users to topics on session establishment based on role + permissions.

### 4.5 Event → Notification Matrix

| Domain event | Recipients | Priority |
|--------------|------------|----------|
| `order.created` | kitchen topic, managers | high |
| `order.status.ready` | assigned waiter, customer (if token) | high |
| `order.status.cancelled` | managers | normal |
| `inventory.alert.low_stock` | inventory permission holders | normal |
| `inventory.alert.out_of_stock` | managers | high |
| `reservation.created` | host/managers | normal |
| `conversation.message.received` | conversations permission | normal |

### 4.6 Reliability

- Send notifications **after** DB commit.
- Log FCM failures; dead-letter table `notification_delivery_log` for retries.
- Idempotency key per event + recipient to prevent duplicate pushes.
- Feature flag `FCM_ENABLED=false` for local dev.

### 4.7 WebSocket Complement

FCM for background/offline; **WebSocket** for active KDS/POS/dashboard screens (lower latency, no push permission required). Both subscribe to same domain events.

---

## 5. FastAPI Module Boundaries

### 5.1 Repository Layout

```
backend/
├── app/
│   ├── main.py                 # App factory, lifespan, router mount
│   ├── core/
│   │   ├── config.py           # Pydantic Settings
│   │   ├── security.py         # Firebase verify, dependencies
│   │   ├── exceptions.py       # HTTP mapping
│   │   ├── logging.py          # structlog/json config
│   │   └── events.py           # In-process event bus
│   ├── db/
│   │   ├── session.py          # Async engine, session factory
│   │   └── base.py             # DeclarativeBase
│   ├── models/                 # SQLAlchemy ORM (one file per aggregate root optional)
│   ├── schemas/                # Pydantic v2 request/response DTOs
│   ├── api/
│   │   └── v1/
│   │       ├── router.py       # Aggregates all v1 routers
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── settings.py
│   │       ├── menu.py
│   │       ├── orders.py
│   │       ├── kitchen.py
│   │       ├── tables.py
│   │       ├── reservations.py
│   │       ├── customers.py
│   │       ├── inventory.py
│   │       ├── conversations.py
│   │       ├── reports.py
│   │       ├── accounting.py
│   │       ├── notifications.py
│   │       ├── public.py
│   │       ├── ai.py
│   │       └── websockets.py
│   ├── services/               # Business logic per bounded context
│   │   ├── auth_service.py
│   │   ├── menu_service.py
│   │   ├── order_service.py
│   │   ├── kitchen_service.py
│   │   ├── inventory_service.py
│   │   ├── pricing_service.py
│   │   ├── notification_service.py
│   │   ├── reservation_service.py
│   │   ├── customer_service.py
│   │   ├── report_service.py
│   │   ├── accounting_service.py
│   │   ├── conversation_service.py
│   │   └── ai_service.py
│   ├── repositories/           # DB access (optional layer between service and ORM)
│   └── workers/                # Scheduled jobs (inventory alert scan)
├── alembic/
├── tests/
├── scripts/
│   ├── seed.py
│   └── bootstrap_admin.py
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml
```

### 5.2 Layer Rules

| Layer | May call | Must not |
|-------|----------|----------|
| `api/v1/*` | services, schemas | ORM directly |
| `services/*` | repositories, other services, events | HTTP concerns |
| `repositories/*` | models, db session | business rules |
| `models/*` | — | external APIs |

### 5.3 Cross-Cutting Modules

- **`pricing_service`** — tax, service charge, discounts; used by orders and public checkout.
- **`order_state_machine`** — single module for valid transitions (used by orders, kitchen, POS).
- **`audit_service`** — append-only writes for sensitive mutations.

### 5.4 API Versioning

- All REST under `/api/v1`.
- Breaking changes → `/api/v2` (parallel period).
- OpenAPI at `/api/v1/openapi.json`; Swagger UI disabled in production or auth-gated.

---

## 6. PostgreSQL Schema Design

### 6.1 Core Tables (MVP)

Detailed column lists align with `ARCHITECTURE_ANALYSIS.md` §9. Below: design decisions and MVP scope.

#### `restaurants`
- Single seeded row for MVP.
- Holds `tax_rate`, `service_charge_rate`, `currency_code`, `timezone`, `whatsapp_number`.

#### `users` + `staff_permissions` + `fcm_device_tokens`
- As analyzed; `firebase_uid` unique.

#### Menu cluster
- `menu_categories`, `menu_items`, `menu_modifiers`, `menu_modifier_options`, `menu_item_modifiers`, `menu_variants`.
- `menu_items.nutritional_info` JSONB optional.
- `menu_items.deleted_at` for soft delete.

#### Orders cluster
- `orders`, `order_items`, `order_item_modifiers`.
- `order_status_history` (id, order_id, from_status, to_status, changed_by, changed_at, note).
- `orders.source` ENUM: `pos`, `web`, `admin`, `phone` (channel attribution).
- `orders.version` INT for optimistic locking.

#### Floor cluster
- `tables`, `reservations`.

#### Customers cluster
- `customers` (optional `user_id` FK), `customer_addresses`, `customer_favorites`.

#### Inventory cluster
- `inventory_categories`, `suppliers`, `inventory_items`, `stock_movements`, `inventory_alerts`.
- `purchase_orders`, `purchase_order_items` (MVP: basic CRUD; workflow phase 2).
- `recipes`, `recipe_ingredients`.

#### Conversations cluster (MVP: schema + stub API; webhooks phase 2)
- `conversations`, `messages`.

#### Finance cluster
- `ledger_entries` linked to orders/suppliers.

#### Audit & AI
- `audit_logs` (actor, action, entity_type, entity_id, payload JSONB, ip).
- `ai_query_logs` (user_id, prompt_hash, tools_used, latency_ms, success).

### 6.2 Enum Definitions (Canonical)

```
user_role: admin, manager, waiter, kitchen, customer
order_status: pending, confirmed, preparing, ready, served, completed, cancelled
order_item_status: pending, preparing, ready, served
payment_status: pending, paid, refunded, failed
order_type: dine_in, takeaway, delivery
order_priority: normal, high, urgent
order_source: pos, web, admin, phone
table_status: available, occupied, reserved, maintenance
reservation_status: confirmed, seated, completed, cancelled, no_show
stock_movement_type: purchase, usage, waste, adjustment, transfer, return
inventory_item_status: in_stock, low_stock, out_of_stock, expired, discontinued
```

Use PostgreSQL ENUM types generated by Alembic.

### 6.3 Referential Integrity

- `order_items.menu_item_id` → snapshot prices at order time (store `unit_price`, `name_snapshot` on line item for historical accuracy).
- `ON DELETE RESTRICT` for menu items referenced by open orders.
- `CASCADE` only for child rows owned exclusively (modifiers on order items).

### 6.4 Row Level Security (Supabase)

**MVP:** RLS policies defined but **service role** used by FastAPI exclusively (bypass RLS). Policies prepared for future direct client access:

```sql
-- Pattern (future): restaurant_id = current_setting('app.restaurant_id')::uuid
```

Document policies in migrations comments; enable when SaaS launches.

---

## 7. User Roles and Permissions

### 7.1 Roles (RBAC)

| Role | Portal access | Description |
|------|---------------|-------------|
| `admin` | Staff dashboard (full) | Owner/GM; all modules by default |
| `manager` | Staff dashboard | Operations manager; permissions configurable |
| `waiter` | Staff dashboard (limited) | Front-of-house; default POS + tables |
| `kitchen` | Kitchen-focused | KDS + order item updates; no settings |
| `customer` | Customer portal + public | Online ordering linked to profile |

**MVP fix aligned with frontend:** Allow `waiter` into staff dashboard with restricted permissions.

### 7.2 Module Permissions (ABAC overlay)

Modules mirror frontend `StaffPermissions`:

| Module key | Capabilities |
|------------|--------------|
| `pos` | Create/hold/complete POS orders |
| `kitchen` | View KDS, update item/order kitchen status |
| `inventory` | Items, movements, suppliers, POs |
| `conversations` | Inbox read/reply |
| `reports` | Analytics endpoints |
| `accounting` | Ledger view/create |
| `settings` | Restaurant config, integrations metadata |
| `menu` | Menu CRUD (split from inventory in API enforcement) |
| `orders` | Admin order management (non-POS) |
| `reservations` | Admin reservation management |
| `customers` | CRM |
| `staff` | User/permission management (admin only in practice) |

`admin` role **implies** all modules unless explicitly restricted (recommend admin always has full access in MVP).

### 7.3 Permission Resolution Algorithm

```
effective_permissions = 
  if role == admin: ALL
  elif role == customer: CUSTOMER_SCOPED
  else: staff_permissions rows where granted = true
  intersect role_defaults[role]  # optional template per role
```

Enforce at router via `require_permission("kitchen")` **and** in service layer (defense in depth).

### 7.4 Customer Scoped Access

Customers may only access rows where `customer.user_id = context.user_id` or `order.customer_id` matches linked customer.

---

## 8. Unified Order Lifecycle

### 8.1 Design Goal

**One `orders` aggregate** serves POS, public checkout, admin-created orders, and kitchen display. Channel-specific behavior is metadata (`source`, `order_type`), not separate tables or status enums.

### 8.2 Canonical State Machine

```
                    ┌─────────────┐
                    │  cancelled  │◄──────────────────────────┐
                    └─────────────┘                           │
                          ▲                                     │
     ┌──────── pending ────┼──► confirmed ──► preparing ──► ready ──► served ──► completed
     │       ▲              │         │            │          │
     │       │              └─────────┴────────────┴──────────┘
     │   (create)                    valid backward only where noted
     └─ POS hold / web submit
```

| Transition | Trigger | Side effects |
|------------|---------|--------------|
| → `pending` | Order created, unpaid or awaiting confirmation | Reserve table optional; emit `order.created` |
| → `confirmed` | Payment confirmed or staff accepts web order | `confirmed_at`; assign waiter; notify kitchen |
| → `preparing` | Kitchen starts (order or all items) | `assigned_chef`; kitchen timer start |
| → `ready` | All items ready OR manual bump | `ready_at`; compute `actual_prep_time`; FCM waiter |
| → `served` | Waiter delivers (dine-in) | `served_at`; skip for takeaway/delivery |
| → `completed` | Payment settled + picked up/delivered | `completed_at`; loyalty; inventory deduction; ledger |
| → `cancelled` | Staff/customer cancel | Reason required; reversal rules |

**Invalid transitions** return `409 Conflict` with machine-readable error.

### 8.3 Order Item (Line) State Machine

```
pending → preparing → ready → served
```

- Order-level `preparing` when **any** item enters preparing.
- Order-level `ready` when **all** items `ready` (configurable: allow partial ready for large orders — MVP: all ready).

Kitchen API updates **items**; order header may auto-aggregate.

### 8.4 Channel-Specific Rules

| Source | Initial status | Payment |
|--------|----------------|---------|
| `web` | `pending` (awaiting staff confirm) or `confirmed` if prepaid | Record `payment_status` from checkout |
| `pos` | `confirmed` if paid at terminal; `pending` if hold | `pos` may create held orders (draft table `order_holds` optional) |
| `admin` | configurable | manual |
| `phone` | `pending` | manual |

**Held POS orders (MVP):** Either `orders.status = pending` + `metadata.is_held = true` JSONB flag, or separate `order_drafts` table merged on checkout — prefer JSONB flag on `orders` for simplicity.

### 8.5 Pricing Pipeline

```
line_totals = Σ (unit_price + modifiers) × quantity
subtotal = Σ line_totals
tax = subtotal × restaurant.tax_rate
service_charge = subtotal × restaurant.service_charge_rate  (web/POS configurable per order_type)
discount = provided
total = subtotal + tax + service_charge - discount
```

All amounts persisted on `orders` at creation; recalculate only on item mutation before `confirmed`.

### 8.6 Order Number Generation

- Format: `ORD-YYYYMMDD-####`
- Per-restaurant daily sequence table `order_number_sequences(restaurant_id, date, last_value)`.
- Allocate inside transaction on create.

### 8.7 Real-Time Projection

- WebSocket events: `order.created`, `order.updated`, `order_item.updated`.
- KDS endpoint `GET /orders/kitchen` returns same statuses (no parallel `new` enum).

---

## 9. Unified Menu Management Lifecycle

### 9.1 Single Catalog

One `menu_items` table powers:

- Admin CRUD (`/menu/*`)
- Public catalog (`GET /public/menu`)
- POS menu grid
- Order line item references

### 9.2 Lifecycle States

| State | `is_available` | Visible public | Orderable |
|-------|----------------|----------------|-----------|
| Draft | false | no | no |
| Active | true | yes | yes |
| Snoozed (86) | false | yes (optional greyed) | no |
| Archived | false + `deleted_at` | no | no |

MVP uses `is_available` + `deleted_at`; add `status` column if snooze needed.

### 9.3 Change Management

| Operation | Rules |
|-----------|-------|
| Create item | Requires valid `category_id`; default `display_order` at end |
| Update price | Does not affect open orders (snapshot on `order_items`) |
| Delete category | Reject if items exist |
| Modifier changes | Versioned via join table; orders snapshot selected modifiers |
| Bulk 86 | `PATCH /menu/items/bulk-availability` |
| Reorder | Transactional update of `display_order` |

### 9.4 Public Menu Projection

`PublicMenuDTO` subset:

- id, name, description, price, category name, image URL, dietary tags, allergens, spice level, prep time, modifiers (simplified)

Filter: `is_available = true AND deleted_at IS NULL AND category.is_active`.

### 9.5 Media

- Upload flow: `POST /menu/items/{id}/image` → Supabase Storage → store `image_url`.
- CDN/public URL returned to clients.

### 9.6 Recipes Link

- `recipes` tied 1:1 to `menu_item_id` (optional).
- Used on order `completed` for inventory deduction.

---

## 10. Inventory Management Architecture

### 10.1 Structure

```
InventoryService
├── ItemCatalogService      # CRUD, status calculation
├── StockMovementService    # Record movements, atomic stock update
├── AlertService            # Threshold + expiry scans
├── RecipeService           # BOM per menu item
├── PurchaseOrderService    # MVP: basic; full workflow later
└── CostingService          # average cost, total value
```

### 10.2 Stock Level Rules

```
if current_stock <= 0 → out_of_stock
elif current_stock <= minimum_stock → low_stock
else → in_stock
```

Recalculate on every movement; upsert `inventory_alerts`.

### 10.3 Movement Types

| Type | Stock delta | Typical reference |
|------|-------------|-------------------|
| `purchase` | +qty | PO number |
| `usage` | -qty | order_id on completion |
| `waste` | -qty | manual reason |
| `adjustment` | ±qty | stocktake |
| `return` | -qty (supplier) | supplier return |

All movements record `performed_by` (user_id), `restaurant_id`.

### 10.4 Order Completion Integration

On `order → completed`:

1. For each order item, load recipe.
2. For each ingredient, create `usage` movement proportional to quantity.
3. If insufficient stock: **policy MVP** = allow negative + critical alert (configurable strict mode later).

### 10.5 Alert Scanning

- **Event-driven:** after movement.
- **Scheduled worker:** every 15 minutes expiry scan (docker worker or APScheduler in API with leader election).

### 10.6 Purchase Orders (MVP Scope)

- Tables exist; API supports create/list/receive partial.
- Full approval workflow deferred.

---

## 11. Kitchen Workflow Architecture

### 11.1 Principles

- Kitchen interacts with **same order aggregates** as admin/POS.
- KDS is a **read-optimized view + item status commands**, not a separate order store.

### 11.2 KDS API Surface

| Endpoint | Purpose |
|----------|---------|
| `GET /kitchen/queue` | Orders in `confirmed`, `preparing`, `ready` with items, timers, priority |
| `PATCH /kitchen/items/{id}/status` | Item-level transition |
| `PATCH /kitchen/orders/{id}/status` | Bulk bump (start all, mark all ready) |
| `POST /kitchen/orders/{id}/print` | Return printable payload (client prints) |

### 11.3 Display Sorting

1. `priority` DESC (urgent first)
2. `confirmed_at` ASC (FIFO)
3. Overdue flag if `now - confirmed_at > estimated_prep_time`

### 11.4 Timer & Metrics

- `estimated_prep_time` = max(item.prep_time) + buffer per extra item (server-calculated at create).
- `actual_prep_time` = `ready_at - confirmed_at` (minutes).

### 11.5 WebSocket Channel

- Room: `kitchen:{restaurant_id}`
- Events mirror order/item updates for instant UI refresh without polling.

### 11.6 Role Enforcement

- Requires `kitchen` role OR `kitchen` module permission.
- Waiters cannot mark `preparing` (configurable).

---

## 12. Customer Ordering Workflow

### 12.1 End-to-End Flow

```
Browse GET /public/menu
  → Client cart (localStorage OK; server cart optional phase 2)
  → POST /public/orders (guest or authenticated)
  → Response: order_id, order_number, estimated_prep_time
  → Optional: payment_status pending → payment gateway (phase 2)
  → Staff confirms web orders (pending → confirmed) if policy requires
  → Kitchen pipeline (§11)
  → Customer tracks via GET /customers/me/orders/{id} if logged in
  → FCM + email/SMS (phase 2) on ready
```

### 12.2 Guest vs Authenticated

| Aspect | Guest | Authenticated customer |
|--------|-------|------------------------|
| Identity | name, phone, email on order | link `customer_id` |
| History | none | portal list |
| Loyalty | no accrual until account linked | points on completed |
| Rate limit | stricter IP limit | user-based limit |

### 12.3 Validation

- Menu items must be available at order time (re-validate server-side).
- Modifier rules enforced (required modifiers, max selections).
- Delivery requires address; dine-in may include `table_id` from QR (future).

### 12.4 Post-Order

- Clear client cart on success.
- Emit `order.created` → FCM to kitchen/managers.

---

## 13. AI Integration Architecture

### 13.1 Scope (MVP)

Staff-facing **read-only operational assistant** (replaces keyword mock in `AIAssistantWidget`):

- Pending order counts and summaries
- Low stock summary
- Peak hours estimate (from historical orders — simple aggregates in MVP)
- Kitchen delay heuristic (orders past `estimated_prep_time`)

**Not in MVP:** autonomous agents, customer-facing chatbot, WhatsApp auto-reply (conversations remain manual + phase 2 bot).

### 13.2 Architecture

```
┌─────────────┐   POST /ai/chat    ┌──────────────────┐
│  Dashboard  │ ─────────────────► │   AI Router      │
│  Widget     │                    │  (auth + rate    │
└─────────────┘                    │   limit)         │
                                   └────────┬─────────┘
                                            │
                                   ┌────────▼─────────┐
                                   │  AI Orchestrator │
                                   │  • intent classify│
                                   │  • tool selection │
                                   └────────┬─────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
            ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
            │ Tool: orders │      │ Tool: stock  │      │ Tool: reports│
            │ (read-only)  │      │ (read-only)  │      │ (read-only)  │
            └──────────────┘      └──────────────┘      └──────────────┘
                    │                       │                       │
                    └───────────────────────┴───────────────────────┘
                                            │
                                   ┌────────▼─────────┐
                                   │ LLM Provider API │
                                   │ (OpenAI / etc.)  │
                                   └──────────────────┘
```

### 13.3 Safety Controls

| Control | Implementation |
|---------|----------------|
| Authentication | Staff roles only (`admin`, `manager`, `kitchen` with permission) |
| Tool allowlist | Predefined functions; no arbitrary SQL |
| Parameterized queries | Repository methods with `restaurant_id` bound |
| PII minimization | Do not send customer phone/email to LLM unless required |
| Rate limiting | Per-user tokens per hour |
| Audit | `ai_query_logs` for every request |
| Secrets | `LLM_API_KEY` server-only |

### 13.4 Tool Definitions (MVP)

| Tool name | Returns |
|-----------|---------|
| `get_order_summary` | Counts by status for today |
| `get_pending_orders` | List top N pending/preparing |
| `get_low_stock_items` | Items below minimum |
| `get_kitchen_delays` | Orders exceeding prep SLA |
| `get_sales_snapshot` | Revenue/orders today |

LLM formats natural language response; **numbers come from tools**, not hallucinated.

### 13.5 Future Extensions (Not MVP)

- RAG over menu descriptions.
- Conversation auto-suggest for staff replies.
- Demand forecasting for inventory PO suggestions.

---

## 14. Docker Deployment Architecture

### 14.1 Container Topology (Production)

```
docker-compose.prod.yml
├── api          # FastAPI + uvicorn workers
├── worker       # Optional: scheduled jobs, FCM retries
├── migrate      # One-shot Alembic upgrade (init container pattern)
└── (external)   # Supabase Postgres, Firebase, Supabase Storage
```

Frontend: static hosting (CDN / Nginx / Vercel) — **not** in API container.

### 14.2 API Container

| Aspect | Choice |
|--------|--------|
| Base image | `python:3.12-slim` |
| WSGI server | `uvicorn` + `gunicorn` workers in prod |
| Workers | `2 × CPU + 1` (tune per load) |
| Health | `GET /health` (DB ping), `GET /ready` |
| Non-root user | yes |
| Read-only filesystem | except `/tmp` |

### 14.3 Local Development Compose

```
services:
  db:          # postgres:15 (optional local; or use Supabase dev project)
  api:         # hot reload mount
  redis:       # optional phase 2 (rate limit, WS fanout)
```

### 14.4 Networking

- API exposed on port 8000 internally; reverse proxy (Traefik/Nginx) terminates TLS.
- WebSocket upgrade supported on same host.
- CORS origins from env.

### 14.5 Secrets Management

| Environment | Approach |
|-------------|----------|
| Local | `.env` (gitignored), never commit |
| Staging/Prod | Docker secrets / cloud secret manager / Supabase vault |

Mount Firebase service account JSON as secret file; path via `GOOGLE_APPLICATION_CREDENTIALS`.

### 14.6 CI/CD Pipeline (Recommended)

```
lint (ruff) → typecheck (mypy) → unit tests → build image → push registry
  → run migrate job → deploy api → smoke test /health
```

---

## 15. Migration and Seed Strategy

### 15.1 Alembic Workflow

1. `alembic revision --autogenerate` (review manually).
2. Naming: `YYYYMMDD_HHMM_description.py`.
3. Every PR with schema change includes migration file.
4. Down migrations written for non-destructive changes where feasible.

### 15.2 Migration Ordering (Initial Bootstrap)

| Revision | Content |
|----------|---------|
| `001` | Extensions (`uuid-ossp`, `pgcrypto`), enums |
| `002` | `restaurants`, `operating_hours`, `users`, permissions |
| `003` | Menu tables |
| `004` | Orders cluster + history |
| `005` | Tables, reservations |
| `006` | Customers |
| `007` | Inventory cluster |
| `008` | Conversations, ledger, audit, AI logs |
| `009` | Indexes, constraints |
| `010` | Seed data function |

### 15.3 Seed Strategy

**Idempotent seed script** (`scripts/seed.py`) run after migrations:

| Data | Purpose |
|------|---------|
| 1 `restaurants` row | MVP tenant |
| Operating hours (7 days) | Settings UI |
| Admin user | Link to Firebase UID from env `BOOTSTRAP_ADMIN_FIREBASE_UID` |
| Sample categories + menu items | Demo/staging |
| Tables (10–20) | Floor plan |
| Optional inventory items + suppliers | Inventory module demo |

**Environments:**

| Env | Seed behavior |
|-----|---------------|
| `development` | Full demo data |
| `staging` | Minimal + test accounts |
| `production` | Restaurant row + admin only; no fake orders |

### 15.4 Test Data

- Pytest fixtures create isolated data per test using transaction rollback or test schema.
- Never run destructive seeds against production.

### 15.5 Data Migration from Frontend Mocks

Not applicable for MVP greenfield. When frontend cuts over:

1. Deploy API + migrations.
2. Seed production menu via admin import or seed script.
3. Switch `VITE_ENABLE_MOCK_DATA=false`.

---

## 16. Environment Variable Strategy

### 16.1 Configuration Class

Single `Settings` class (Pydantic BaseSettings):

- Load from environment variables.
- Validate on startup (fail fast).
- No runtime mutation.

### 16.2 Variable Groups

#### Application

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_ENV` | yes | `development`, `staging`, `production` |
| `APP_NAME` | no | Display name |
| `API_HOST` | no | Default `0.0.0.0` |
| `API_PORT` | no | Default `8000` |
| `LOG_LEVEL` | no | `INFO`, `DEBUG` |
| `CORS_ORIGINS` | yes | Comma-separated allowlist |
| `RESTAURANT_ID` | yes (MVP) | UUID of single restaurant |

#### Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | Async Postgres URL (`postgresql+asyncpg://...`) |
| `DB_POOL_SIZE` | no | Connection pool |
| `DB_SSL_MODE` | prod | `require` for Supabase |

#### Firebase / FCM

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_PROJECT_ID` | yes | |
| `GOOGLE_APPLICATION_CREDENTIALS` | yes | Path to service account JSON |
| `FCM_ENABLED` | no | `true`/`false` |
| `FIREBASE_AUTH_EMULATOR_HOST` | dev | Optional emulator |

#### Supabase Storage

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side only |
| `STORAGE_BUCKET_MENU` | no | Default `menu-images` |

#### AI (optional MVP)

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_ENABLED` | no | Feature flag |
| `LLM_PROVIDER` | no | `openai`, etc. |
| `LLM_API_KEY` | if AI enabled | |
| `AI_RATE_LIMIT_PER_HOUR` | no | Default 60 |

#### Security / Ops

| Variable | Required | Description |
|----------|----------|-------------|
| `WEBHOOK_WHATSAPP_SECRET` | phase 2 | HMAC verification |
| `SENTRY_DSN` | prod | Error tracking |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | optional | Tracing |

### 16.3 Frontend Alignment

Existing `VITE_*` variables map to backend:

| Frontend | Backend consumer |
|----------|------------------|
| `VITE_API_BASE_URL` | API deployment URL |
| `VITE_SUPABASE_*` | Storage public URLs only (if any) |
| Firebase web config | Must match `FIREBASE_PROJECT_ID` |

### 16.4 `.env` Files

```
backend/.env.example          # Documented template, committed
backend/.env                  # Local only, gitignored
backend/.env.staging.example  # Staging template
```

Never commit secrets. CI injects secrets from vault.

---

## 17. Development Workflow

### 17.1 Prerequisites

- Python 3.12+, Poetry or pip-tools
- Docker Desktop
- Firebase project (dev) + Auth emulator optional
- Supabase dev project or local Postgres

### 17.2 Daily Loop

```
1. git pull
2. docker compose up -d db   (or use Supabase dev)
3. alembic upgrade head
4. poetry run uvicorn app.main:app --reload
5. pytest / pre-commit
6. Frontend: npm run dev → VITE_API_BASE_URL=http://localhost:8000
```

### 17.3 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready |
| `develop` | Integration |
| `feature/*` | Module work (e.g. `feature/orders-api`) |

### 17.4 Definition of Done (Per Module)

- [ ] Service + repository + router implemented
- [ ] Pydantic schemas match frontend types
- [ ] Permission checks on routes and services
- [ ] Alembic migration if schema changed
- [ ] Unit tests for state machine / pricing
- [ ] Integration test for happy path
- [ ] OpenAPI docs updated
- [ ] Frontend hook wired (separate PR acceptable)

### 17.5 Implementation Phases

| Phase | Modules | Outcome |
|-------|---------|---------|
| **P0 — Foundation** | config, db, auth, users, settings, health | Login works end-to-end |
| **P1 — Core ops** | menu, orders, kitchen, pricing, notifications | POS/web/admin share orders |
| **P2 — Operations** | inventory, tables, reservations, customers | Full dashboard data real |
| **P3 — Insights** | reports, accounting, audit | Dashboard KPIs live |
| **P4 — Engagement** | conversations webhooks, AI assistant, FCM polish | Omnichannel + assistant |
| **P5 — Hardening** | load tests, monitoring, security review | Production launch |

---

## 18. API Design Standards

### 18.1 URL Conventions

- Base: `/api/v1`
- Plural nouns: `/orders`, `/menu/items`
- Actions via sub-resources: `POST /orders/{id}/cancel` (not `/cancelOrder`)
- Public namespace: `/api/v1/public/*`

### 18.2 HTTP Methods

| Method | Use |
|--------|-----|
| GET | Read, list, filter |
| POST | Create, actions |
| PATCH | Partial update |
| PUT | Full replace (permissions, reorder lists) |
| DELETE | Soft delete where applicable |

### 18.3 Response Envelope

**Success (single resource):**

```json
{
  "data": { },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

**Success (collection):**

```json
{
  "data": [ ],
  "meta": {
    "request_id": "uuid",
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 100,
      "total_pages": 5
    }
  }
}
```

### 18.4 Pagination & Filtering

- Query params: `page`, `page_size` (max 100), `sort`, `order=asc|desc`.
- Filters: explicit params (`status`, `date_from`, `date_to`) — avoid opaque query DSL in MVP.

### 18.5 Idempotency

- `Idempotency-Key` header on `POST /public/orders` and payment endpoints (phase 2).
- Store keys in `idempotency_keys` table with TTL 24h.

### 18.6 Versioning & Deprecation

- Breaking change → new version prefix.
- Sunset header `Deprecation: true` on old routes for 90 days.

### 18.7 OpenAPI

- Auto-generated from Pydantic models.
- Tags per bounded context.
- Document security scheme: `HTTPBearer` Firebase JWT.

### 18.8 Date/Time

- API transmits ISO-8601 UTC.
- Client converts using `restaurants.timezone`.

---

## 19. Error Handling Strategy

### 19.1 Exception Hierarchy

```
AppException (base)
├── ValidationError      → 422
├── AuthenticationError  → 401
├── AuthorizationError   → 403
├── NotFoundError        → 404
├── ConflictError        → 409 (state machine, optimistic lock)
├── RateLimitError       → 429
└── ExternalServiceError → 502 (Firebase, FCM, LLM)
```

### 19.2 Error Response Format

```json
{
  "error": {
    "code": "ORDER_INVALID_TRANSITION",
    "message": "Cannot transition from ready to pending",
    "details": {
      "order_id": "uuid",
      "current_status": "ready",
      "requested_status": "pending"
    }
  },
  "meta": {
    "request_id": "uuid"
  }
}
```

- `code` is machine-readable, stable, documented.
- `message` is human-readable, safe for UI display.
- `details` optional; no stack traces in production responses.

### 19.3 Validation

- Pydantic v2 models on all inputs.
- Field-level errors mapped to `422` with `details.fields[]`.

### 19.4 Global Handlers

- Register FastAPI exception handlers for `AppException`, `RequestValidationError`, unhandled `Exception`.
- Unhandled → `500` generic message; full trace logged server-side.

### 19.5 Optimistic Locking

- On `version` mismatch → `409` with `code: RESOURCE_VERSION_CONFLICT`, include current version in details.

### 19.6 External Service Degradation

| Service | Failure behavior |
|---------|------------------|
| FCM | Log; order still succeeds |
| LLM | Return fallback message; log |
| Supabase Storage | Fail upload with `502` |
| Firebase Auth verify | `401`; no fallback |

---

## 20. Logging and Monitoring Strategy

### 20.1 Logging

| Aspect | Standard |
|--------|----------|
| Format | JSON structured logs (production) |
| Library | `structlog` or `python-json-logger` |
| Correlation | `X-Request-ID` / `request_id` in every log line |
| Levels | DEBUG dev only; INFO ops; WARNING business anomalies; ERROR failures |
| PII | Mask phone/email in logs; never log tokens |

### 20.2 What to Log

| Event | Level |
|-------|-------|
| HTTP request start/end (path, status, duration) | INFO |
| Auth failure | WARNING |
| Order status transition | INFO (audit also persists) |
| Inventory movement | INFO |
| FCM send failure | ERROR |
| LLM tool invocation | INFO (not raw prompt in prod) |
| Unhandled exception | ERROR + stack |

### 20.3 Audit Trail

Separate `audit_logs` table for:

- Order status changes
- Permission changes
- Settings updates
- Manual ledger entries
- Stock adjustments

Retention: 2 years (configurable).

### 20.4 Metrics (Prometheus-Compatible)

| Metric | Type |
|--------|------|
| `http_requests_total` | counter by route, status |
| `http_request_duration_seconds` | histogram |
| `orders_created_total` | counter by source |
| `order_prep_duration_minutes` | histogram |
| `inventory_low_stock_count` | gauge |
| `fcm_send_failures_total` | counter |

Expose `/metrics` (internal network only).

### 20.5 Health Checks

| Endpoint | Checks |
|----------|--------|
| `/health` | Process alive |
| `/ready` | DB connection, migrations at head (optional) |

### 20.6 Alerting (Operations)

| Alert | Condition |
|-------|-----------|
| API error rate | 5xx > 1% for 5 min |
| DB connection pool exhausted | > 90% utilized |
| FCM failure spike | > 10/min |
| Disk / memory | container limits |

Integrate **Sentry** for exception tracking; **OpenTelemetry** optional for distributed traces (Firebase + API + DB).

### 20.7 Dashboards

- **Grafana / cloud provider:** request latency, order throughput, kitchen backlog size.
- **Business dashboard:** remains in React Reports module fed by `/reports/*` APIs.

---

## Appendix A: API ↔ Frontend Module Traceability

| Frontend route | Primary API module | Priority |
|----------------|-------------------|----------|
| `/dashboard` | `reports`, `orders` | P1 |
| `/dashboard/orders` | `orders` | P0 |
| `/dashboard/menu` | `menu` | P0 |
| `/dashboard/inventory` | `inventory` | P2 |
| `/dashboard/kitchen` | `kitchen` | P1 |
| `/dashboard/pos` | `orders`, `menu` | P1 |
| `/menu`, `/order/checkout` | `public`, `orders` | P1 |
| `/reservations` | `public`, `reservations` | P2 |
| `/customer/dashboard` | `customers` | P2 |
| `/dashboard/conversations` | `conversations` | P4 |
| AI Widget | `ai` | P4 |
| Settings integrations | `settings` (metadata only) | P3 |

---

## Appendix B: Explicitly Out of Scope (MVP)

- Subscription billing and payment provider abstraction (beyond recording `payment_status`)
- Multi-restaurant admin portal and tenant onboarding flows
- SaaS platform operator dashboard
- Multi-currency (single `currency_code` per restaurant)
- Full double-entry accounting / tax filing
- Native mobile apps (API + FCM designed to support later)

---

## Appendix C: SaaS Readiness Checklist (Future — No MVP Work)

When expanding to multi-restaurant, activate without schema redesign:

- [ ] Resolve `restaurant_id` from subdomain or JWT claim
- [ ] Enforce RLS on all tables
- [ ] Add `platform` schema for operator accounts
- [ ] Per-restaurant Firebase project vs shared project (product decision)
- [ ] Topic isolation per restaurant for FCM

---

*This plan is design-only. Implementation should follow the phased roadmap in §17.5 and align with `ARCHITECTURE_ANALYSIS.md` for frontend contracts.*
