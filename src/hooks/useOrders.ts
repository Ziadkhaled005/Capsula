import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersAPI, isMockMode } from "@/api";
import { MOCK_ORDERS_RESPONSE } from "@/mock/orders";
import type { OrdersFilter, OrderStatus, ProposeAlternativeRequest } from "@/types";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  list: (filters: OrdersFilter) => ["orders", "list", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

/**
 * Fetch paginated/filtered list of orders.
 * Falls back to mock data when VITE_API_BASE_URL is not set.
 */
export function useOrders(filters: OrdersFilter = {}) {
  return useQuery({
    queryKey: ORDER_KEYS.list(filters),
    queryFn: async () => {
      if (isMockMode) return MOCK_ORDERS_RESPONSE;
      return OrdersAPI.getOrders(filters);
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch a single order by ID.
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: async () => {
      if (isMockMode) {
        const order = MOCK_ORDERS_RESPONSE.data.find((o) => o.id === id);
        if (!order) throw new Error("Order not found");
        return order;
      }
      return OrdersAPI.getOrder(id);
    },
    enabled: !!id,
  });
}

/**
 * Mutation: update an order's status (confirm, start preparing, mark delivered, etc.)
 */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: OrderStatus; notes?: string }) => {
      if (isMockMode) {
        return Promise.resolve({ id, status } as any);
      }
      return OrdersAPI.updateOrderStatus(id, { status, notes });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

/**
 * Mutation: pharmacist proposes alternative products for unavailable items.
 */
export function useProposeAlternative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProposeAlternativeRequest) => {
      if (isMockMode) {
        return Promise.resolve({ success: true, orderId: payload.orderId, newStatus: "on-hold" as OrderStatus });
      }
      return OrdersAPI.proposeAlternative(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

/**
 * Mutation: cancel an order.
 */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => {
      if (isMockMode) return Promise.resolve();
      return OrdersAPI.cancelOrder(id, reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}
