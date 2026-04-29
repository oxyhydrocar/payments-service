import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/client";
import { Order, OrderCreatedEvent } from "../types/shared";

export const paymentsRouter = Router();

paymentsRouter.post("/initiate", async (req: Request, res: Response) => {
  const { orderId, paymentMethod } = req.body as {
    orderId: string;
    paymentMethod: "card" | "paypal";
  };

  const [order] = await query<Order>(
    `SELECT id, user_id as "userId", total, status
     FROM orders WHERE id = $1`,
    [orderId]
  );

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (order.status !== "pending_payment") {
    return res.status(400).json({
      error: `Order is not ready for payment. Current status: ${order.status}`,
    });
  }

  const paymentId = uuidv4();

  console.log(`[payments-service] initiating ${paymentMethod} payment ${paymentId} for order ${orderId}`);

  await query(
    `UPDATE orders SET status = 'processing', updated_at = now() WHERE id = $1`,
    [orderId]
  );

  return res.status(202).json({ paymentId, status: "processing" });
});

paymentsRouter.post("/webhook", async (req: Request, res: Response) => {
  const { paymentId, orderId, result } = req.body as {
    paymentId: string;
    orderId: string;
    result: "success" | "failure";
  };

  const newStatus = result === "success" ? "paid" : result;

  await query(
    `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2`,
    [newStatus, orderId]
  );

  console.log(`[payments-service] webhook: payment ${paymentId} → ${newStatus}`);
  return res.json({ received: true });
});

export function handleOrderCreatedEvent(event: OrderCreatedEvent): void {
  console.log(
    `[payments-service] order created for customer ${event.customerId}`,
    `amount: ${event.totalAmount}`
  );
}
