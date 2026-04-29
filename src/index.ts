import express from "express";
import { Pool } from "pg";

const app = express();
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/orders_db",
});

// Poll for orders that are ready for payment
async function processPendingOrders() {
  const orders = await db.query(
    `SELECT id, user_id, total, status FROM orders WHERE status = 'pending_payment'`
  );

  for (const order of orders.rows) {
    console.log(`Processing payment for order ${order.id}, user ${order.user_id}, amount ${order.total}`);

    await db.query(
      `UPDATE orders SET status = 'processing' WHERE id = $1`,
      [order.id]
    );

    const success = Math.random() > 0.1;
    const newStatus = success ? "paid" : "cancelled";

    await db.query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [newStatus, order.id]
    );

    console.log(`Order ${order.id} payment ${newStatus}`);
  }
}

// Handle order.created events
app.post("/events", async (req, res) => {
  const event = req.body;

  if (event.eventType === "order.created") {
    const { orderId, userId, total } = event;

    console.log(`Received order.created: orderId=${orderId}, userId=${userId}, total=${total}`);

    await db.query(
      `INSERT INTO payment_intents (order_id, user_id, amount, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT DO NOTHING`,
      [orderId, userId, total]
    );
  }

  res.json({ received: true });
});

app.get("/health", (_req, res) => res.json({ service: "payments-service", status: "ok" }));

setInterval(processPendingOrders, 5000);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`payments-service listening on :${PORT}`));
