import { apiClient } from "./client";
import type {
  Order,
  OrdersFilter,
  OrdersResponse,
  UpdateOrderStatusRequest,
  ProposeAlternativeRequest,
  ProposeAlternativeResponse,
} from "@/types";

/**
 * GET /orders
 * Fetch a paginated, filterable list of orders for the pharmacy.
 */
export async function getOrders(filters: OrdersFilter = {}): Promise<OrdersResponse> {
  const { data } = await apiClient.get<OrdersResponse>("/orders", { params: filters });
  return data;
}

/**
 * GET /orders/:id
 * Fetch full details of a single order including products and status history.
 */
export async function getOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
}

/**
 * PATCH /orders/:id/status
 * Update the status of an order (e.g. confirm, start preparing, mark delivered).
 */
export async function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusRequest,
): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, payload);
  return data;
}

/**
 * POST /orders/:id/alternative
 * Pharmacist proposes alternative products for unavailable items.
 * Sets order status to "on-hold" pending customer approval.
 */
export async function proposeAlternative(
  payload: ProposeAlternativeRequest,
): Promise<ProposeAlternativeResponse> {
  const { data } = await apiClient.post<ProposeAlternativeResponse>(
    `/orders/${payload.orderId}/alternative`,
    payload,
  );
  return data;
}

/**
 * DELETE /orders/:id
 * Cancel / delete an order.
 */
export async function cancelOrder(id: string, reason?: string): Promise<void> {
  await apiClient.delete(`/orders/${id}`, { data: { reason } });
}
