export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "PAYMENT_PENDING"
  | "PAID"
  | "FULFILLING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
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

export interface OrderCreatedEvent {
  eventType: "order.created";
  orderId: string;
  customerId: string;
  totalAmount: number;
  items: OrderItem[];
  timestamp: string;
}
