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
  const { data } = await apiClient.get("/api/admin/orders", {
    params: toOrderParams(filters),
  });

  const result = unwrapApiResponse<unknown>(data);

  // Handle an API response where the unwrapped value is an array.
  if (Array.isArray(result)) {
    const orders = result as Order[];

    return {
      data: orders,
      total: orders.length,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? orders.length,
      totalPages: orders.length > 0 ? 1 : 0,
    };
  }

  // Handle an API response that already contains paginated data.
  if (
    result !== null &&
    typeof result === "object" &&
    Array.isArray((result as OrdersResponse).data)
  ) {
    return result as OrdersResponse;
  }

  throw new Error("Unexpected orders API response format");
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
 * Update an order's status.
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
 * Propose alternative products for unavailable items.
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
 * POST /orders/:id/decline
 * Cancel or decline an order.
 */
export async function cancelOrder(id: string, reason?: string): Promise<void> {
  await apiClient.post(`/api/admin/bids/${id}/decline`, { reason });
}
