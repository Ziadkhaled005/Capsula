import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersAPI } from "@/api";
import type { OrdersFilter, OrderStatus, SubmitOfferRequest } from "@/types";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  list: (filters: OrdersFilter) => ["orders", "list", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  bids: ["orders", "bids"] as const,
};

export function useOrders(filters: OrdersFilter = {}) {
  return useQuery({
    queryKey: ORDER_KEYS.list(filters),
    queryFn: () => OrdersAPI.getOrders(filters),
    refetchInterval: filters.status === "open-bidding" || filters.status === "all" ? 15000 : false,
    staleTime: 5000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => OrdersAPI.getOrder(id),
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: OrderStatus; notes?: string }) =>
      OrdersAPI.updateOrderStatus(id, { status, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDER_KEYS.all }),
  });
}

export function useSubmitOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: SubmitOfferRequest }) =>
      OrdersAPI.submitOffer(orderId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDER_KEYS.all }),
  });
}

export function useDeclineBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      OrdersAPI.declineBid(orderId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDER_KEYS.all }),
  });
}

/**
 * Real implementation — POST /api/admin/orders/items/{itemId}/alternatives
 * once per proposed catalog alternative.
 */
export function useProposeAlternative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: import("@/types").ProposeAlternativeRequest,
    ): Promise<{ success: boolean }> => {
      const proposals = payload.proposals.flatMap((proposal) =>
        proposal.alternatives.map((alt) => {
          const formData = new FormData();
          formData.append("SuggestedProductId", alt.productId);
          formData.append("Quantity", String(alt.qty));
          return OrdersAPI.proposeAlternative(proposal.originalProductId, formData);
        }),
      );
      await Promise.all(proposals);
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDER_KEYS.all }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      OrdersAPI.cancelOrder(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDER_KEYS.all }),
  });
}
