import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersAPI } from "@/api";
import type { OrdersFilter, OrderStatus, ProposeAlternativeRequest } from "@/types";
import type { ApiOrderStatus } from "@/api/contracts";
import type { JsonRecord } from "@/api/contracts";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  list: (filters: OrdersFilter) => ["orders", "list", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

/**
 * Fetch filtered pharmacy orders or active bids.
 */
export function useOrders(filters: OrdersFilter = {}) {
  return useQuery({
    queryKey: ORDER_KEYS.list(filters),
    queryFn: async (): Promise<JsonRecord[]> => {
      const bidStatus =
        filters.status === "open-bidding"
          ? "Open"
          : filters.status === "on-hold"
            ? "Submitted"
            : undefined;
      if (bidStatus) return OrdersAPI.getBids(bidStatus);
      const statusMap: Partial<Record<OrderStatus, ApiOrderStatus>> = {
        "awaiting-customer-confirmation": "PendingConfirmation",
        confirmed: "Confirmed",
        preparing: "InPreparation",
        "on-delivery": "InRoute",
        delivered: "Delivered",
        cancelled: "Cancelled",
      };
      return OrdersAPI.getOrders({
        status: filters.status && filters.status !== "all" ? statusMap[filters.status] : undefined,
        search: filters.search,
      });
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
      return OrdersAPI.getOrder(Number(id));
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
      const statusMap: Record<OrderStatus, ApiOrderStatus> = {
        "open-bidding": "WaitingForOffers",
        "on-hold": "OnHold",
        "awaiting-customer-confirmation": "PendingConfirmation",
        confirmed: "Confirmed",
        preparing: "InPreparation",
        "on-delivery": "InRoute",
        delivered: "Delivered",
        cancelled: "Cancelled",
      };
      return OrdersAPI.updateOrderStatus(Number(id), statusMap[status], notes);
    },
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
    mutationFn: async (payload: ProposeAlternativeRequest) => {
      const requests = payload.proposals.flatMap((proposal) =>
        proposal.alternatives.map((alternative) =>
          OrdersAPI.suggestOrderAlternative(Number(proposal.originalProductId), {
            suggestedProductId: Number(alternative.productId),
            quantity: alternative.qty,
          }),
        ),
      );
      return Promise.all(requests);
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
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      OrdersAPI.updateOrderStatus(Number(id), "Cancelled", reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}
