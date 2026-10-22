import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BidsAPI } from "@/api";
import type { SubmitOfferRequest } from "@/types";

export const BID_KEYS = {
  all: ["bids"] as const,
  stats: () => ["bids", "stats"] as const,
  detail: (orderId: string | number) => ["bids", "detail", String(orderId)] as const,
  autoTemplate: () => ["bids", "auto-offer-template"] as const,
  orderAlternatives: (orderId: string | number) =>
    ["bids", "order-alternatives", String(orderId)] as const,
};

export function useBidStats() {
  return useQuery({
    queryKey: BID_KEYS.stats(),
    queryFn: BidsAPI.getBidStats,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useBidDetail(orderId: string | number) {
  return useQuery({
    queryKey: BID_KEYS.detail(orderId),
    queryFn: () => BidsAPI.getBidDetail(orderId),
    enabled: Boolean(orderId),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, payload }: { offerId: number; payload: SubmitOfferRequest }) =>
      BidsAPI.updateOffer(offerId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: BID_KEYS.all }),
  });
}

export function useWithdrawOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: number) => BidsAPI.withdrawOffer(offerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: BID_KEYS.all }),
  });
}

export function useAutoOfferTemplate() {
  return useQuery({
    queryKey: BID_KEYS.autoTemplate(),
    queryFn: BidsAPI.getAutoOfferTemplate,
  });
}

export function useSaveAutoOfferTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: BidsAPI.saveAutoOfferTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: BID_KEYS.autoTemplate() }),
  });
}

export function useOrderAlternatives(orderId: string | number) {
  return useQuery({
    queryKey: BID_KEYS.orderAlternatives(orderId),
    queryFn: () => BidsAPI.getOrderAlternatives(orderId),
    enabled: Boolean(orderId),
  });
}

/** Suggest alternatives for each order item (one catalog product per call). */
export function useSuggestAlternatives(orderId: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      proposals: {
        orderItemId: number;
        productId: number;
        quantity: number;
        adminNote?: string;
      }[],
    ) => {
      for (const proposal of proposals) {
        const formData = new FormData();
        formData.append("SuggestedProductId", String(proposal.productId));
        formData.append("Quantity", String(proposal.quantity));
        if (proposal.adminNote) formData.append("AdminNote", proposal.adminNote);
        await BidsAPI.suggestAlternative(proposal.orderItemId, formData);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BID_KEYS.orderAlternatives(orderId) }),
  });
}

export function useUpdateReturnPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (returnPolicy: string) => BidsAPI.updateReturnPolicy(returnPolicy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard", "pharmacy"] }),
  });
}
