import crypto from "crypto";
import express from "express";
import { Pool } from "pg";

const app = express();
app.use(express.json());

// Fail fast if DATABASE_URL is not configured
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Prevent the process from crashing if an idle client encounters
// a network error or the database connection is unexpectedly terminated.
db.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

// Poll for orders that are ready for payment
async function processPendingOrders() {
  const orders = await db.query(
    `SELECT id, customer_id, total_amount, status FROM orders WHERE status = 'PAYMENT_PENDING'`
  );

  for (const order of orders.rows) {
    console.log(
      `Processing payment for order ${order.id}, user ${order.customer_id}, amount ${order.total_amount}`
    );

    await db.query(`UPDATE orders SET status = 'processing' WHERE id = $1`, [
      order.id,
    ]);

    const success = Math.random() > 0.1;
    const newStatus = success ? "paid" : "cancelled";

    await db.query(`UPDATE orders SET status = $1 WHERE id = $2`, [
      newStatus,
      order.id,
    ]);

    console.log(`Order ${order.id} payment ${newStatus}`);
  }
}

// Handle order.created events
app.post("/events", async (req, res) => {
  const event = req.body;
  const signature = req.headers["x-event-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", process.env.EVENT_SIGNING_KEY!)
    .update(JSON.stringify(event))
    .digest("hex");

  if (!signature || signature !== expectedSignature) {
    console.warn("Rejecting event with invalid signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  if (!event.eventType || typeof event.eventType !== "string") {
    return res.status(400).json({ error: "Missing or invalid eventType" });
  }

  if (event.eventType === "order.created") {
    const { orderId, userId, total } = event;

    if (!orderId || !userId || typeof total !== "number" || total <= 0) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    console.log(
      `Received order.created: orderId=${orderId}, userId=${userId}, total=${total}`
    );

    await db.query(
      `INSERT INTO payment_intents (order_id, user_id, amount, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT DO NOTHING`,
      [orderId, userId, total]
    );
  }

  res.json({ received: true });
});

app.get("/health", (_req, res) =>
  res.json({ service: "payments-service", status: "ok" })
);

setInterval(processPendingOrders, 5000);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () =>
  console.log(`payments-service listening on :${PORT}`)
);
