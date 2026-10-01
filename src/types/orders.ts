export type OrderStatus =
  | "pending-confirm"
  | "confirmed"
  | "on-hold"
  | "preparing"
  | "on-delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cash" | "card";

export interface OrderProduct {
  id: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  available: boolean;
  imageUrl?: string;
}

export interface OrderAlternative {
  originalProductId: string;
  alternativeProductId: string;
  alternativeProductName: string;
  unitPrice: number;
  qty: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string;
    addressDetail?: string;
  };
  products: OrderProduct[];
  status: OrderStatus;
  payment: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  remainingMinutes?: number;
  alternatives?: OrderAlternative[];
  notes?: string;
}

export interface OrdersFilter {
  status?: OrderStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

export interface ProposeAlternativeRequest {
  orderId: string;
  proposals: {
    originalProductId: string;
    alternatives: {
      productId: string;
      qty: number;
    }[];
  }[];
}

export interface ProposeAlternativeResponse {
  success: boolean;
  orderId: string;
  newStatus: OrderStatus;
}
