export enum OrderStatus {
  PAID = "paid",
  UNPAID = "unpaid",
  OPEN = "open",
}

export interface Orders {
  orderId: string;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
