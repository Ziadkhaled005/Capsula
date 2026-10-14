import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersAPI } from "@/api";
import type { OrdersFilter, OrderStatus, ProposeAlternativeRequest } from "@/types";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  list: (filters: OrdersFilter) => ["orders", "list", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

/**
 * Fetch paginated/filtered list of orders.
 */
export function useOrders(filters: OrdersFilter = {}) {
  return useQuery({
    queryKey: ORDER_KEYS.list(filters),
    queryFn: () => OrdersAPI.getOrders(filters),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single order by ID.
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => OrdersAPI.getOrder(id),
    enabled: !!id,
  });
}

/**
 * Mutation: update an order's status (confirm, start preparing, mark delivered, etc.)
 */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: OrderStatus; notes?: string }) =>
      OrdersAPI.updateOrderStatus(id, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

/**
 * Mutation: pharmacist confirms alternative products for unavailable items.
 * The order stays open for bidding without waiting for customer-app approval.
 */
export function useProposeAlternative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProposeAlternativeRequest) => OrdersAPI.proposeAlternative(payload),
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
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      OrdersAPI.cancelOrder(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}
