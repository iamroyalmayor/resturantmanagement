# MVP Validation Audit: RestaurantOS Operations

This audit evaluates the readiness of the Menu, Tables, Orders, and Kitchen modules for an MVP production-like environment.

## 1. Missing API Endpoints
- **Order Management**: No endpoint for order cancellation (by guest) or voiding/refunding (by staff).
- **Staff Operations**: Missing bulk table management (activate/deactivate all) and floorplan grouping.
- **Menu Management**: Missing "Item Duplication" and "Category Sorting" endpoints.
- **Customer**: No "Order Feedback" or "Service Request" endpoints (e.g., "Call Waiter").

## 2. Missing Frontend Integrations
- **Item Variants**: The `MenuVariant` model exists, but `OrderService.place_order` currently only uses `menu_item_id`. Variants are ignored during order placement.
- **Price Preview**: No endpoint to calculate order totals with tax/service charge *before* submission (Guest needs to see the final price in the cart).

## 3. Missing Database Relationships
- **Session Tracking**: `Table.current_session_id` is defined but not updated when an order is placed or completed.
- **Integrity**: `Order` -> `Customer` relationship is weakly defined; if a customer is deleted, snapshots remain, but the foreign key may break if not careful with SET NULL.

## 4. Incomplete Workflows
- **Terminal States**: Orders can stay in `READY` forever; no automated transition to `COMPLETED` based on payment (since Payment is P3).
- **Guest Cancellation**: No logic to permit guest cancellation within a "grace period" (e.g., 2 minutes) before it reaches the kitchen.

## 5. Potential Production Blockers
- **Pagination**: `OrderRepository.list_orders` and `MenuRepository.list_items` lack enforced pagination in most routers, risking performance degradation with 1000+ records.
- **Search**: No text-search capability for menu items or order numbers (essential for staff).

## 6. Authentication Gaps
- **Public APIs**: Guest endpoints (Tracking/Table Resolution) depend on `X-Restaurant-ID` header or tokens. There is no IP-based rate limiting or guest-session validation.
- **WebSocket Security**: The `/ws` endpoint currently accepts `restaurant_id` as a query param without verifying if the user belongs to that restaurant.

## 7. WebSocket Gaps
- **Reliability**: No heartbeat (ping/pong) mechanism to keep mobile kitchen tablets connected over unstable Wi-Fi.
- **State Recovery**: No logic for a client to "catch up" on missed events after a reconnect (needs an event ID/sequence).

## 8. Performance Concerns
- **Aggregate Loading**: `selectinload` for Order -> Items -> Modifiers is efficient for single items, but listing 50 orders with 10 items each results in significant memory usage in Python.
- **Snapshots**: Repeatedly storing name/price snapshots for high-frequency items (e.g., "Water") consumes storage fast; consider shared snapshots for standard items.

## 9. Testing Coverage Summary
- **Service Layer**: High (90%+) - Good coverage of state machines and calculation logic.
- **API Layer**: Low - Integration tests are sparse and currently fail in the local environment due to DB connectivity.
- **WebSocket**: Minimal - Mock testing only; no stress/concurrency verification.

## 10. Recommended Fixes Before Inventory
1. **[CRITICAL]** Integrate `MenuVariant` into `OrderService.place_order`.
2. **[CRITICAL]** Secure WebSocket endpoint with a Staff JWT or Table Token.
3. **[HIGH]** Implement "Price Preview" (Total calculation) endpoint for Guests.
4. **[HIGH]** Add pagination to all `list` endpoints.
5. **[MEDIUM]** Implement automatic `Table.status` updates (AVAILABLE -> OCCUPIED) on order confirmation.
6. **[MEDIUM]** Add "Order Search" (by Number/Customer) for Staff.
