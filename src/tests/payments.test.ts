/**
 * Payments service unit tests.
 *
 * All tests below PASS — they only test payments-service in isolation.
 * The bugs are invisible here because we never compare against what
 * orders-service actually sends.
 */
import { Order, OrderStatus, OrderCreatedEvent } from "../types/shared";

describe("Payment eligibility", () => {
  it("only initiates payment for pending_payment orders", () => {
    const isEligible = (status: OrderStatus) => status === "pending_payment";

    // This test passes — it's internally consistent within payments-service.
    // But orders-service stores 'PAYMENT_PENDING', not 'pending_payment'.
    // So isEligible() will always return false in production.
    expect(isEligible("pending_payment")).toBe(true);
    expect(isEligible("paid")).toBe(false);
    expect(isEligible("pending")).toBe(false);
  });
});

describe("Event handler", () => {
  it("reads userId and total from order.created event", () => {
    // This event shape matches OUR (stale) type definition.
    // orders-service sends { customerId, totalAmount } — not { userId, total }.
    const event: OrderCreatedEvent = {
      eventType: "order.created",
      orderId: "order-1",
      userId: "user-123",   // ← orders-service sends customerId, not userId
      total: 99.99,         // ← orders-service sends totalAmount, not total
      items: [],
      timestamp: new Date().toISOString(),
    };

    // Passes locally — but in production event.userId will be undefined
    // because the real event has { customerId } not { userId }.
    expect(event.userId).toBe("user-123");
    expect(event.total).toBe(99.99);
  });
});

describe("Webhook status mapping", () => {
  it("maps gateway result to order status", () => {
    const mapResult = (r: "success" | "failure") => r === "success" ? "paid" : "cancelled";

    // This test passes. But 'paid'/'cancelled' are old enum values.
    // orders-service now expects 'PAID'/'CANCELLED' (uppercase).
    expect(mapResult("success")).toBe("paid");   // ← should be "PAID"
    expect(mapResult("failure")).toBe("cancelled"); // ← should be "CANCELLED"
  });
});
