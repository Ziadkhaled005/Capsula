import { apiClient, unwrapApiResponse } from "./client";
import type { SubmitOfferRequest } from "@/types";

export interface BidDetail {
  orderId: number;
  createdDate?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  region?: string;
  notes?: string;
  isPrescriptionOrder?: boolean;
  maxDiscountPercentage?: number;
  deliveryAddress?: { latitude?: number; longitude?: number; [key: string]: unknown };
  items?: {
    id: number;
    productId?: number;
    productName?: string;
    quantity?: number;
    unit?: string;
    price?: number;
    subTotal?: number;
    availableQuantity?: number;
    isInStock?: boolean;
    pharmacyUnitPrice?: number;
  }[];
  prescription?: unknown;
  myOffer?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface BidStats {
  incomingBids: number;
  incomingToday: number;
  submittedOffers: number;
  submittedThisWeek: number;
  winRate: number;
  averageDiscount: number;
  marketAverageDiscount: number;
}

export interface AutoOfferTemplate {
  isEnabled: boolean;
  discountPercentage: number;
  preparationMinutes: number;
  deliveryMinutes: number;
  isFreeDelivery: boolean;
  maxOrderTotal: number | null;
  maxAllowedDiscountPercentage: number;
}

/** GET /api/admin/bids/{orderId} — items, stock flags and maxDiscountPercentage live here. */
export async function getBidDetail(orderId: string | number): Promise<BidDetail> {
  const { data } = await apiClient.get(`/api/admin/bids/${encodeURIComponent(String(orderId))}`);
  return unwrapApiResponse<BidDetail>(data);
}

/** PUT /api/admin/bids/offers/{offerId} — edit while pending and window open. */
export async function updateOffer(offerId: number, payload: SubmitOfferRequest) {
  const { data } = await apiClient.put(
    `/api/admin/bids/offers/${encodeURIComponent(String(offerId))}`,
    payload,
  );
  return unwrapApiResponse<Record<string, unknown>>(data);
}

/** DELETE /api/admin/bids/offers/{offerId} — withdraw a pending offer. */
export async function withdrawOffer(offerId: number) {
  const { data } = await apiClient.delete(
    `/api/admin/bids/offers/${encodeURIComponent(String(offerId))}`,
  );
  return unwrapApiResponse<unknown>(data);
}

/** GET /api/admin/bids/stats */
export async function getBidStats(): Promise<BidStats> {
  const { data } = await apiClient.get("/api/admin/bids/stats");
  return unwrapApiResponse<BidStats>(data);
}

export async function getAutoOfferTemplate(): Promise<AutoOfferTemplate> {
  const { data } = await apiClient.get("/api/admin/bids/auto-offer-template");
  return unwrapApiResponse<AutoOfferTemplate>(data);
}

export async function saveAutoOfferTemplate(
  payload: Omit<AutoOfferTemplate, "maxAllowedDiscountPercentage">,
) {
  const { data } = await apiClient.put("/api/admin/bids/auto-offer-template", payload);
  return unwrapApiResponse<AutoOfferTemplate>(data);
}

/** GET /api/admin/orders/{orderId}/alternatives */
export async function getOrderAlternatives(orderId: string | number) {
  const { data } = await apiClient.get(
    `/api/admin/orders/${encodeURIComponent(String(orderId))}/alternatives`,
  );
  return unwrapApiResponse<unknown>(data);
}

/** POST /api/admin/orders/items/{itemId}/alternatives (multipart) */
export async function suggestAlternative(itemId: string | number, formData: FormData) {
  const { data } = await apiClient.post(
    `/api/admin/orders/items/${encodeURIComponent(String(itemId))}/alternatives`,
    formData,
  );
  return unwrapApiResponse<unknown>(data);
}

/** PUT /api/admin/pharmacy/return-policy */
export async function updateReturnPolicy(returnPolicy: string) {
  const { data } = await apiClient.put("/api/admin/pharmacy/return-policy", { returnPolicy });
  return unwrapApiResponse<unknown>(data);
}
