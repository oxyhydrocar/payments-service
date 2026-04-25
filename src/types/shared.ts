/**
 * Shared contract types — payments-service copy
 *
 * ⚠️  WARNING: This file is duplicated across services:
 *   - orders-service/src/types/shared.ts   (source of truth — last synced: 2024-11-10)
 *   - payments-service/src/types/shared.ts  ← YOU ARE HERE
 *   - storefront/src/types/shared.ts        (copy — last synced: 2024-09-22)
 *
 * This copy was last synced with orders-service on 2024-11-10.
 * Several breaking changes in orders-service have NOT been reflected here.
 */

// ─── Order Status ────────────────────────────────────────────────────────────
// STALE: orders-service updated this enum on 2025-01-15.
// The status values below no longer match what the DB actually stores.
//
// orders-service now uses: "AWAITING_PAYMENT" | "PAYMENT_PENDING" | "PAID" ...
// This copy still uses the old values from before the migration.
export type OrderStatus =
  | "pending"           // ← was split into AWAITING_PAYMENT + PAYMENT_PENDING
  | "pending_payment"   // ← no longer exists in DB; orders-service uses PAYMENT_PENDING
  | "paid"              // ← no longer exists in DB; orders-service uses PAID
  | "cancelled"
  | "refunded";

// ─── Order ───────────────────────────────────────────────────────────────────
// STALE: orders-service renamed fields. This copy is out of date.
export interface Order {
  id: string;
  userId: string;       // ← RENAMED to customerId in orders-service (2024-12-01)
  items: OrderItem[];
  total: number;        // ← RENAMED to totalAmount in orders-service (2025-02-10)
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

// ─── Events from orders-service ───────────────────────────────────────────────
// STALE: orders-service renamed userId → customerId in the event payload.
export interface OrderCreatedEvent {
  eventType: "order.created";
  orderId: string;
  userId: string;       // ← RENAMED to customerId in orders-service; will be undefined
  total: number;        // ← RENAMED to totalAmount in orders-service; will be undefined
  items: OrderItem[];
  timestamp: string;
}
