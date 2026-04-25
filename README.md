# payments-service

Payment processing for the Oxyhydrocar e-commerce platform.

## Related services

- **orders-service** — source of order data; payments-service connects to the same PostgreSQL database
- **storefront** — initiates payments via this service's API

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```
