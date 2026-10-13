import { apiClient, unwrapApiResponse } from "./client";
import type {
  Order,
  OrdersFilter,
  OrdersResponse,
  UpdateOrderStatusRequest,
  ProposeAlternativeRequest,
  ProposeAlternativeResponse,
} from "@/types";

const ORDER_STATUS_TO_API: Record<Exclude<OrdersFilter["status"], undefined | "all">, number> = {
  "open-bidding": 0,
  "on-hold": 1,
  "awaiting-customer-confirmation": 2,
  confirmed: 3,
  preparing: 4,
  "on-delivery": 5,
  delivered: 6,
  cancelled: 7,
};

function toOrderParams(filters: OrdersFilter) {
  const { status, ...params } = filters;
  return {
    ...params,
    ...(status && status !== "all" ? { status: ORDER_STATUS_TO_API[status] } : {}),
  };
}

/**
 * GET /orders
 * Fetch a paginated, filterable list of orders for the pharmacy.
 */
export async function getOrders(filters: OrdersFilter = {}): Promise<OrdersResponse> {
  const { data } = await apiClient.get("/api/admin/orders", { params: toOrderParams(filters) });
  return unwrapApiResponse<OrdersResponse>(data);
}

/**
 * GET /orders/:id
 * Fetch full details of a single order including products and status history.
 */
export async function getOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get(`/api/admin/orders/${id}`);
  return unwrapApiResponse<Order>(data);
}

/**
 * PATCH /orders/:id/status
 * Update the status of an order (e.g. confirm, start preparing, mark delivered).
 */
export async function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusRequest,
): Promise<Order> {
  const { data } = await apiClient.put(`/api/admin/orders/${id}/status`, {
    newStatus: ORDER_STATUS_TO_API[payload.status],
    note: payload.notes,
  });
  return unwrapApiResponse<Order>(data);
}

/**
 * POST /orders/:id/alternative
 * Pharmacist confirms alternative products for unavailable items.
 * The order remains open for bidding and does not wait for customer-app confirmation.
 */
export async function proposeAlternative(
  payload: ProposeAlternativeRequest,
): Promise<ProposeAlternativeResponse> {
  const { data } = await apiClient.post(`/api/admin/bids/${payload.orderId}/offer`, {
    unavailableItems: payload.proposals.map((proposal) => ({
      orderItemId: Number(proposal.originalProductId),
      alternativeProductIds: proposal.alternatives.map((alternative) =>
        Number(alternative.productId),
      ),
    })),
  });
  return unwrapApiResponse<ProposeAlternativeResponse>(data);
}

/**
 * DELETE /orders/:id
 * Cancel / delete an order.
 */
export async function cancelOrder(id: string, reason?: string): Promise<void> {
  await apiClient.post(`/api/admin/bids/${id}/decline`, { reason });
}
