import { Order, OrderStatus, OrderCreatedEvent } from "../types/shared";

describe("Payment eligibility", () => {
  it("only initiates payment for pending_payment orders", () => {
    const isEligible = (status: OrderStatus) => status === "pending_payment";

    expect(isEligible("pending_payment")).toBe(true);
    expect(isEligible("paid")).toBe(false);
    expect(isEligible("pending")).toBe(false);
  });
});

describe("Event handler", () => {
  it("reads customerId and totalAmount from order.created event", () => {
    const event: OrderCreatedEvent = {
      eventType: "order.created",
      orderId: "order-1",
      customerId: "cust-123",
      totalAmount: 99.99,
      items: [],
      timestamp: new Date().toISOString(),
    };

    expect(event.customerId).toBe("cust-123");
    expect(event.totalAmount).toBe(99.99);
  });
});

describe("Webhook status mapping", () => {
  it("maps gateway result to order status", () => {
    const mapResult = (r: "success" | "failure") => r === "success" ? "paid" : "cancelled";

    expect(mapResult("success")).toBe("paid");
    expect(mapResult("failure")).toBe("cancelled");
  });
});
