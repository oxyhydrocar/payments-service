# payments-service

Handles payment initiation and webhook processing for the Oxyhydrocar platform.

## Connected Services

| Service | How it connects | Risk |
|---|---|---|
| **orders-service** | Queries the same PostgreSQL database directly | Schema migrations in orders-service break our queries |
| **orders-service** | Subscribes to `order.created` events | Payload shape changes in orders-service silently break our handler |
| **storefront** | Exposes `POST /payments/initiate` and `POST /payments/webhook` | Response shape / status changes here break the checkout UI |

## Shared Database

`payments-service` connects to the **same** PostgreSQL instance as `orders-service` and reads/writes the `orders` table directly. There is no API boundary between the two services for order lookups.

**This means:**
- A column rename in `orders-service/src/db/schema.sql` silently breaks `payments-service` queries
- There is no compile-time check across repos — the bug only surfaces at runtime

## Known Cross-Repo Drift (open bugs)

> All unit tests pass in every repo. These bugs only appear when services run together.

| # | Root cause in orders-service | Stale assumption here | Symptom |
|---|---|---|---|
| [#7](../../issues/7) | Column `user_id` renamed to `customer_id` (V2 migration) | `SELECT user_id FROM orders` | **Every `/payments/initiate` call returns 404** |
| [#8](../../issues/8) | Column `total` renamed to `total_amount` (V3 migration) | `SELECT total FROM orders` | **Payment amount is always NULL** |
| [#9](../../issues/9) | Status enum updated: `"pending_payment"` → `"PAYMENT_PENDING"` | `WHERE status = 'pending_payment'` | **No order ever passes eligibility check** |
| [#10](../../issues/10) | Event field renamed: `userId` → `customerId` | `event.userId` in handler | **Customer ID always undefined in payment events** |
| [#11](../../issues/11) | Webhook writes `"paid"` / `"cancelled"` (lowercase) | orders-service expects `"PAID"` / `"CANCELLED"` | **Order status corrupted after payment** |

## API

```
POST /payments/initiate   body: { orderId, paymentMethod: "card"|"paypal" }
POST /payments/webhook    body: { paymentId, orderId, result: "success"|"failure" }
```

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```
