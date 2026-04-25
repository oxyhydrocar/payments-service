# payments-service

Handles payment initiation and webhook processing for the Oxyhydrocar platform.

## Related Services

- **orders-service** — source of order data; payments-service reads the same PostgreSQL database
- **storefront** — initiates payments via `POST /payments/initiate`

## API

```
POST /payments/initiate   body: { orderId, paymentMethod: "card"|"paypal" }
POST /payments/webhook    body: { paymentId, orderId, result: "success"|"failure" }
```

## Database

Connects to the same PostgreSQL instance as `orders-service` and reads/writes the `orders` table directly.

## Events

Subscribes to the `orders` topic published by `orders-service`:
- `order.created`
- `order.status_changed`

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```
