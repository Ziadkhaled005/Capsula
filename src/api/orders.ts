import { apiRequest } from "./client";
import type {
  ApiOrderStatus,
  BidListItem,
  BidOfferRequest,
  BidStatus,
  JsonRecord,
  PharmacyOrderDto,
} from "./contracts";

export async function getBids(status?: BidStatus | ""): Promise<BidListItem[]> {
  return apiRequest<BidListItem[]>("/admin/bids", {
    params: { status: status || undefined },
  });
}

export async function getBid(orderId: number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/admin/bids/${orderId}`);
}

export async function getBidStats(): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/admin/bids/stats");
}

export async function submitBidOffer(
  orderId: number,
  payload: BidOfferRequest,
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/admin/bids/${orderId}/offer`, {
    method: "POST",
    body: payload,
  });
}

export async function updateBidOffer(
  offerId: number,
  payload: BidOfferRequest,
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/admin/bids/offers/${offerId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function withdrawBidOffer(offerId: number): Promise<void> {
  await apiRequest<null>(`/admin/bids/offers/${offerId}`, { method: "DELETE" });
}

export async function declineBid(orderId: number): Promise<void> {
  await apiRequest<null>(`/admin/bids/${orderId}/decline`, { method: "POST" });
}

export async function getOrders(params: {
  status?: ApiOrderStatus | "";
  search?: string;
} = {}): Promise<PharmacyOrderDto[]> {
  return apiRequest<PharmacyOrderDto[]>("/admin/orders", { params });
}

export async function getOrder(orderId: number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/admin/orders/${orderId}`);
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: ApiOrderStatus,
  note?: string,
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/admin/orders/${orderId}/status`, {
    method: "PUT",
    body: { newStatus, note: note ?? null },
  });
}

export async function getOrderAlternatives(orderId: number): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>(`/admin/orders/${orderId}/alternatives`);
}

export async function suggestOrderAlternative(
  itemId: number,
  data: {
    suggestedProductId?: number;
    customProductName?: string;
    customPrice?: number;
    customUnit?: "Box" | "Strip";
    customImage?: File;
    quantity: number;
    adminNote?: string;
  },
): Promise<JsonRecord> {
  const formData = new FormData();
  if (data.suggestedProductId !== undefined) {
    formData.append("SuggestedProductId", String(data.suggestedProductId));
  }
  if (data.customProductName) formData.append("CustomProductName", data.customProductName);
  if (data.customPrice !== undefined) formData.append("CustomPrice", String(data.customPrice));
  if (data.customUnit) formData.append("CustomUnit", data.customUnit);
  if (data.customImage) formData.append("CustomImage", data.customImage);
  formData.append("Quantity", String(data.quantity));
  if (data.adminNote) formData.append("AdminNote", data.adminNote);

  return apiRequest<JsonRecord>(`/admin/orders/items/${itemId}/alternatives`, {
    method: "POST",
    body: formData,
  });
}

export async function getAutoOfferTemplate(): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/admin/bids/auto-offer-template");
}

export async function updateAutoOfferTemplate(payload: JsonRecord): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/admin/bids/auto-offer-template", {
    method: "PUT",
    body: payload,
  });
}
