export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
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
  userId: string;
  total: number;
  items: OrderItem[];
  timestamp: string;
}
