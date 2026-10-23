import { apiRequest, downloadFile } from "./client";
import type { InventoryDto, JsonRecord, Paged } from "./contracts";

export async function getInventory(params: {
  categoryId?: number;
  search?: string;
  status?: "OutOfStock" | "Low" | "Medium" | "Available";
  /** true = only products with quantity above zero (any stock status). */
  hasStock?: boolean;
  page?: number;
  pageSize?: number;
} = {}): Promise<Paged<InventoryDto>> {
  return apiRequest<Paged<InventoryDto>>("/admin/inventory", { params });
}

export async function getInventoryAlerts(): Promise<InventoryDto[]> {
  return apiRequest<InventoryDto[]>("/admin/inventory/alerts");
}

export async function updateInventory(
  productId: number,
  payload: {
    newQuantity?: number;
    newStripQuantity?: number | null;
    price?: number | null;
    stripPrice?: number | null;
  },
): Promise<InventoryDto> {
  return apiRequest<InventoryDto>(`/admin/inventory/${productId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function adjustInventory(
  productId: number,
  adjustment: number,
  reason?: string,
): Promise<InventoryDto> {
  return apiRequest<InventoryDto>(`/admin/inventory/${productId}/adjust`, {
    method: "PUT",
    body: { adjustment, reason: reason ?? null },
  });
}

export async function uploadInventory(file: File): Promise<JsonRecord> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<JsonRecord>("/admin/inventory/bulk-update", {
    method: "POST",
    body: formData,
  });
}

export async function getInventoryRequests(params: {
  search?: string;
  status?: "Pending" | "Approved" | "Rejected" | "";
  result?: "AllAllowed" | "HasNotAllowed" | "";
  page?: number;
  pageSize?: number;
} = {}): Promise<Paged<JsonRecord>> {
  return apiRequest<Paged<JsonRecord>>("/admin/inventory-requests", { params });
}

export async function getInventoryRequest(
  id: number,
  params: { isMatched?: boolean; page?: number; pageSize?: number } = {},
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/admin/inventory-requests/${id}`, { params });
}

export async function reviewInventoryRequest(
  id: number,
  decision: "Approved" | "Rejected",
  reviewNote?: string,
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/admin/inventory-requests/${id}/review`, {
    method: "PUT",
    body: { decision, reviewNote: reviewNote ?? null },
  });
}

export async function updateInventoryRowNote(
  id: number,
  rowId: number,
  note: string | null,
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/admin/inventory-requests/${id}/rows/${rowId}/note`, {
    method: "PUT",
    body: { note },
  });
}

export async function downloadInventoryRequestFile(id: number): Promise<Blob> {
  return downloadFile(`/admin/inventory-requests/${id}/file`);
}

export async function downloadInventoryErrorReport(id: number): Promise<Blob> {
  return downloadFile(`/admin/inventory-requests/${id}/error-report`);
}
