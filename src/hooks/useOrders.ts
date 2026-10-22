import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersAPI } from "@/api";
import type { OrdersFilter, OrderStatus, ProposeAlternativeRequest, SubmitOfferRequest } from "@/types";

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
    // Bid inbox is polled because the documented backend does not provide websockets.
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
 * Compatibility wrapper for the existing offer page. The current UI payload
 * contains only product alternatives, not the full fields required by the
 * documented submit-offer endpoint. The page must be updated before this can
 * safely submit a real offer; the function rejects instead of sending a
 * malformed request that could be mistaken for a saved offer.
 */
export function useProposeAlternative() {
  return useMutation({
    mutationFn: async (_payload: ProposeAlternativeRequest): Promise<{ success: boolean }> => {
      throw new Error(
        "نموذج العرض لا يرسل بعد جميع الحقول المطلوبة من الخادم. حدّث شاشة العرض لتضمين الخصم ووقت التحضير والتوصيل ورسوم التوصيل.",
      );
    },
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
