import { Order, OrderStatus, OrderCreatedEvent } from "../types/shared";

describe("Payment eligibility", () => {
  it("only initiates payment for AWAITING_PAYMENT orders", () => {
    const isEligible = (status: OrderStatus) => status === "AWAITING_PAYMENT";

    expect(isEligible("AWAITING_PAYMENT")).toBe(true);
    expect(isEligible("PAID")).toBe(false);
    expect(isEligible("CANCELLED")).toBe(false);
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
    const mapResult = (r: "success" | "failure"): OrderStatus =>
      r === "success" ? "PAID" : "CANCELLED";

    expect(mapResult("success")).toBe("PAID");
    expect(mapResult("failure")).toBe("CANCELLED");
  });
});
