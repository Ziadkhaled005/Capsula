import { apiRequest, downloadFile } from "./client";
import type { JsonRecord, Paged } from "./contracts";

export interface PharmacyUpsertRequest {
  name: string;
  address: string;
  phone: string;
  licenseNumber: string;
  isActive: boolean;
  adminUserId: string;
  returnPolicy?: string | null;
  latitude: number;
  longitude: number;
}

export async function getAllowedProducts(params: {
  search?: string;
  isActive?: boolean;
  categoryId?: number;
  page?: number;
  pageSize?: number;
} = {}): Promise<Paged<JsonRecord>> {
  return apiRequest<Paged<JsonRecord>>("/superadmin/allowed-products", { params });
}

export async function updateAllowedProduct(
  productId: number,
  payload: { name: string; code: string; categoryId: number; isActive: boolean },
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/superadmin/allowed-products/${productId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteAllowedProduct(productId: number): Promise<void> {
  await apiRequest<null>(`/superadmin/allowed-products/${productId}`, { method: "DELETE" });
}

export async function uploadAllowedProducts(file: File): Promise<JsonRecord> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<JsonRecord>("/superadmin/allowed-products/upload", {
    method: "POST",
    body: form,
  });
}

export async function getCategories(): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>("/mobile/Categories");
}

export async function getPharmacies(params: {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
} = {}): Promise<Paged<JsonRecord>> {
  return apiRequest<Paged<JsonRecord>>("/superadmin/Pharmacies", { params });
}

export async function getPharmacyById(id: number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/superadmin/Pharmacies/${id}`);
}

export async function createPharmacy(payload: PharmacyUpsertRequest): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/Pharmacies", {
    method: "POST",
    body: payload,
  });
}

export async function updatePharmacy(
  id: number,
  payload: PharmacyUpsertRequest,
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/superadmin/Pharmacies/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deletePharmacy(id: number): Promise<void> {
  await apiRequest<null>(`/superadmin/Pharmacies/${id}`, { method: "DELETE" });
}

export async function setPharmacyActive(id: number, active: boolean): Promise<void> {
  await apiRequest<null>(`/superadmin/Pharmacies/${id}/${active ? "activate" : "suspend"}`, {
    method: "PUT",
  });
}

export async function getPharmacyAllowedProducts(id: number): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>(`/superadmin/Pharmacies/${id}/allowed-products`);
}

export async function addPharmacyAllowedProduct(
  pharmacyId: number,
  productId: number,
): Promise<void> {
  await apiRequest<null>(
    `/superadmin/Pharmacies/${pharmacyId}/allowed-products/${productId}`,
    { method: "POST" },
  );
}

export async function removePharmacyAllowedProduct(
  pharmacyId: number,
  productId: number,
): Promise<void> {
  await apiRequest<null>(
    `/superadmin/Pharmacies/${pharmacyId}/allowed-products/${productId}`,
    { method: "DELETE" },
  );
}

export async function getSuperAdminReport(params: JsonRecord = {}): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/Reports/overview", { params });
}

export async function getPharmacyPerformance(year: number, top = 6): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/Reports/pharmacy-performance", {
    params: { year, top },
  });
}

export async function downloadPharmacyPerformance(year: number): Promise<Blob> {
  return downloadFile(`/superadmin/Reports/pharmacy-performance/export?year=${encodeURIComponent(String(year))}`);
}

export async function getSavedReports(): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>("/superadmin/Reports");
}

export async function getSavedReport(id: number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/superadmin/Reports/${id}`);
}

export async function createSavedReport(payload: {
  title: string;
  content: string;
}): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/Reports", {
    method: "POST",
    body: payload,
  });
}

export async function deleteSavedReport(id: number): Promise<void> {
  await apiRequest<null>(`/superadmin/Reports/${id}`, { method: "DELETE" });
}

export async function getSuperAdminSettings(): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/Settings");
}

export async function updateSuperAdminSettings(payload: JsonRecord): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/Settings", {
    method: "PUT",
    body: payload,
  });
}
