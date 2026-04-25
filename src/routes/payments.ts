import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/client";
import { Order, OrderCreatedEvent } from "../types/shared";

export const paymentsRouter = Router();

// ─── POST /payments/initiate ──────────────────────────────────────────────────
// Called by the storefront when a customer clicks "Pay Now".
// Looks up the order in the shared DB and initiates payment.
paymentsRouter.post("/initiate", async (req: Request, res: Response) => {
  const { orderId, paymentMethod } = req.body as {
    orderId: string;
    paymentMethod: "card" | "paypal";
  };

  // Query shared DB directly (same DB as orders-service).
  // BUG: We query `user_id` but migration V2 renamed it to `customer_id`.
  //      This query returns no rows → "Order not found" for every request.
  const [order] = await query<Order>(
    `SELECT id, user_id as "userId", total, status
     FROM orders WHERE id = $1`,
    //       ^^^^^^  ─── column does not exist (renamed to customer_id in V2)
    //                    ^^^^^ ─── column does not exist (renamed to total_amount in V3)
    [orderId]
  );

  if (!order) {
    // This branch is always hit because the query above fails / returns nothing.
    return res.status(404).json({ error: "Order not found" });
  }

  // BUG: We check for 'pending_payment' but orders-service now stores 'PAYMENT_PENDING'.
  //      No order will ever pass this check, so payments are never initiated.
  if (order.status !== "pending_payment") {
    return res.status(400).json({
      error: `Order is not ready for payment. Current status: ${order.status}`,
      // In practice, order.status will be 'PAYMENT_PENDING' (from orders-service)
      // but we check for 'pending_payment', so this error always fires.
    });
  }

  const paymentId = uuidv4();

  // In a real system this would call Stripe/PayPal. Simulated here.
  console.log(`[payments-service] initiating ${paymentMethod} payment ${paymentId} for order ${orderId}`);

  // Mark payment as processing — also updates the order status.
  // BUG: Sets status = 'processing' which is not a valid OrderStatus in either copy.
  await query(
    `UPDATE orders SET status = 'processing', updated_at = now() WHERE id = $1`,
    [orderId]
  );

  return res.status(202).json({ paymentId, status: "processing" });
});

// ─── POST /payments/webhook ───────────────────────────────────────────────────
// Receives async confirmation from the payment gateway.
paymentsRouter.post("/webhook", async (req: Request, res: Response) => {
  const { paymentId, orderId, result } = req.body as {
    paymentId: string;
    orderId: string;
    result: "success" | "failure";
  };

  const newStatus = result === "success" ? "paid" : "cancelled";
  // BUG: sets status = 'paid' or 'cancelled' (lowercase, old enum values).
  //      orders-service now expects 'PAID' or 'CANCELLED' (uppercase).
  //      This means the order status becomes an invalid value that nothing
  //      in orders-service can match against.

  await query(
    `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2`,
    [newStatus, orderId]
  );

  console.log(`[payments-service] webhook: payment ${paymentId} → ${newStatus}`);
  return res.json({ received: true });
});

// ─── Event handler (called from message broker subscriber) ───────────────────
// Handles order.created events published by orders-service.
export function handleOrderCreatedEvent(event: OrderCreatedEvent): void {
  // BUG: event.userId will be undefined — orders-service now emits customerId.
  //      Silently logs undefined; no error thrown.
  console.log(
    `[payments-service] order created for user ${event.userId}`,
    // ↑ event.userId is always undefined (renamed to customerId in orders-service)
    `amount: ${event.total}`
    // ↑ event.total is always undefined (renamed to totalAmount in orders-service)
  );

  // Because userId and total are undefined, any downstream logic here
  // (fraud checks, loyalty points, etc.) operates on garbage data.
}
