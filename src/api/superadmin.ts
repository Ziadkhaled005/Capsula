import { apiClient, unwrapApiResponse, ApiResponseError } from "./client";
import type { SuperAdminDashboardResponse } from "@/types";

// ---------- helpers ----------

function toIso(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
}

async function downloadBlob(path: string, fallbackName: string): Promise<void> {
  const response = await apiClient.get(path, { responseType: "blob" });
  const blob = response.data as Blob;
  // Error responses come back as the JSON envelope even on download endpoints.
  if (blob.type.includes("application/json")) {
    const text = await blob.text();
    try {
      throw new ApiResponseError(JSON.parse(text));
    } catch (error) {
      if (error instanceof ApiResponseError) throw error;
      throw new Error("تعذر تحميل الملف.");
    }
  }
  const disposition = String(response.headers?.["content-disposition"] ?? "");
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  const fileName = match?.[1] ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") out[key] = value;
  }
  return out;
};

// ---------- types ----------

export interface SystemSettings {
  maxFileSizeInMB: number;
  fileUploadEnabled: boolean;
  lowStockThreshold: number;
  mediumStockThreshold: number;
  estimatedDeliveryDays: number;
  deliveryFee: number;
  confirmationSlaMinutes: number;
  maxOfferDiscountPercentage: number;
  offerRadiusKm: number;
  offerWindowMinutes: number;
  offerValidityMinutes: number;
  blockMissingColumns: boolean;
  preventDuplicateCodes: boolean;
  detectProductConflicts: boolean;
  allowPartialImport: boolean;
  generateErrorReport: boolean;
  approvalProtection: boolean;
}

export interface AllowedProduct {
  productId: number;
  name: string;
  code: string;
  categoryId?: number;
  categoryName?: string;
  isActive: boolean;
  imageUrl?: string;
}

export interface AllowedProductsFilter {
  search?: string;
  isActive?: boolean;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

export interface AllowedProductUploadSummary {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  failedRows: { rowNumber: number; code: string; reason: string }[];
}

export interface PharmacyRecord {
  id: number;
  name: string;
  address: string;
  phone: string;
  licenseNumber: string;
  isActive: boolean;
  isAcceptingOrders?: boolean;
  adminUserId?: string;
  allowedProductCount?: number;
  returnPolicy?: string;
  latitude?: number;
  longitude?: number;
  withdrawnOffersCount?: number;
  lastActivityAt?: string;
}

export interface PharmacyPayload {
  name: string;
  address: string;
  phone: string;
  licenseNumber: string;
  isActive: boolean;
  adminUserId?: string;
  returnPolicy?: string;
  latitude?: number;
  longitude?: number;
}

export interface PharmaciesFilter {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface InventoryRequestRow {
  id: number;
  rowNumber: number;
  productName: string;
  code: string;
  categoryName?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  productId?: number;
  catalogProductName?: string;
  isMatched: boolean;
  reason?: string | null;
  warning?: string | null;
  internalNote?: string | null;
}

export interface InventoryRequestDetail {
  id: number;
  pharmacyId: number;
  pharmacyName: string;
  fileName: string;
  createdDate: string;
  totalRows: number;
  matchedRows: number;
  notAllowedRows: number;
  conflictRows: number;
  validationResult: "AllAllowed" | "HasNotAllowed" | string;
  status: "Pending" | "Approved" | "Rejected" | string;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  canApprove: boolean;
  rows: {
    items: InventoryRequestRow[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface InventoryRequestsFilter {
  search?: string;
  status?: "Pending" | "Approved" | "Rejected" | "";
  result?: "AllAllowed" | "HasNotAllowed" | "";
  page?: number;
  pageSize?: number;
}

export interface RecentActivity {
  requestId: number;
  pharmacyId: number;
  pharmacyName: string;
  activityType: string;
  status: string;
  date: string;
}

export interface ReportsOverview extends SuperAdminDashboardResponse {}

export interface PharmacyPerformance {
  pharmacyId: number;
  pharmacyName: string;
  monthlyOrders: number[];
  monthlySales: number[];
  totalOrders: number;
  totalSales: number;
}

export interface CustomerRecord {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  emailConfirmed?: boolean;
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  roles: string[];
}

export interface SupportTicket {
  id: number;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  description?: string;
  status: "Pending" | "Contacted" | "Solved" | string;
}

// ---------- settings ----------

export async function getSettings(): Promise<SystemSettings> {
  const { data } = await apiClient.get("/api/superadmin/Settings");
  return unwrapApiResponse<SystemSettings>(data);
}

/** Send the FULL object — the backend replaces settings wholesale. */
export async function updateSettings(settings: SystemSettings): Promise<SystemSettings> {
  const { data } = await apiClient.put("/api/superadmin/Settings", settings);
  return unwrapApiResponse<SystemSettings>(data);
}

// ---------- allowed products ----------

export async function getAllowedProducts(filter: AllowedProductsFilter = {}) {
  const { data } = await apiClient.get("/api/superadmin/allowed-products", {
    params: qs({
      search: filter.search,
      isActive: filter.isActive,
      categoryId: filter.categoryId,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 10,
    }),
  });
  return unwrapApiResponse<{
    items: AllowedProduct[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }>(data);
}

export async function updateAllowedProduct(
  productId: number,
  payload: { name: string; code: string; categoryId: number; isActive: boolean },
) {
  const { data } = await apiClient.put(`/api/superadmin/allowed-products/${productId}`, payload);
  return unwrapApiResponse<unknown>(data);
}

export async function deleteAllowedProduct(productId: number) {
  const { data } = await apiClient.delete(`/api/superadmin/allowed-products/${productId}`);
  return unwrapApiResponse<unknown>(data);
}

export async function uploadAllowedProducts(file: File): Promise<AllowedProductUploadSummary> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/api/superadmin/allowed-products/upload", formData);
  return unwrapApiResponse<AllowedProductUploadSummary>(data);
}

// ---------- pharmacies ----------

export async function getPharmacies(filter: PharmaciesFilter = {}) {
  const { data } = await apiClient.get("/api/superadmin/Pharmacies", {
    params: qs({
      search: filter.search,
      isActive: filter.isActive,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 10,
    }),
  });
  return unwrapApiResponse<{
    items: PharmacyRecord[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }>(data);
}

export async function getPharmacy(id: number): Promise<PharmacyRecord> {
  const { data } = await apiClient.get(`/api/superadmin/Pharmacies/${id}`);
  return unwrapApiResponse<PharmacyRecord>(data);
}

export async function createPharmacy(payload: PharmacyPayload): Promise<PharmacyRecord> {
  const { data } = await apiClient.post("/api/superadmin/Pharmacies", payload);
  return unwrapApiResponse<PharmacyRecord>(data);
}

export async function updatePharmacy(id: number, payload: PharmacyPayload) {
  const { data } = await apiClient.put(`/api/superadmin/Pharmacies/${id}`, payload);
  return unwrapApiResponse<unknown>(data);
}

export async function suspendPharmacy(id: number) {
  const { data } = await apiClient.put(`/api/superadmin/Pharmacies/${id}/suspend`);
  return unwrapApiResponse<unknown>(data);
}

export async function activatePharmacy(id: number) {
  const { data } = await apiClient.put(`/api/superadmin/Pharmacies/${id}/activate`);
  return unwrapApiResponse<unknown>(data);
}

export async function deletePharmacy(id: number) {
  const { data } = await apiClient.delete(`/api/superadmin/Pharmacies/${id}`);
  return unwrapApiResponse<unknown>(data);
}

// ---------- inventory requests ----------

export async function getInventoryRequests(filter: InventoryRequestsFilter = {}) {
  const { data } = await apiClient.get("/api/admin/inventory-requests", {
    params: qs({
      search: filter.search,
      status: filter.status,
      result: filter.result,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 10,
    }),
  });
  return unwrapApiResponse<{
    items: InventoryRequestDetail[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }>(data);
}

export async function getInventoryRequest(
  id: number,
  opts: { isMatched?: boolean; page?: number; pageSize?: number } = {},
): Promise<InventoryRequestDetail> {
  const { data } = await apiClient.get(`/api/admin/inventory-requests/${id}`, {
    params: qs({
      isMatched: opts.isMatched,
      page: opts.page ?? 1,
      pageSize: opts.pageSize ?? 10,
    }),
  });
  const raw = unwrapApiResponse<InventoryRequestDetail & { createdDate?: string }>(data);
  return { ...raw, createdDate: toIso(raw.createdDate) };
}

export async function reviewInventoryRequest(
  id: number,
  payload: { decision: "Approved" | "Rejected"; reviewNote?: string },
) {
  const { data } = await apiClient.put(`/api/admin/inventory-requests/${id}/review`, payload);
  return unwrapApiResponse<unknown>(data);
}

export async function setRequestRowNote(id: number, rowId: number, note: string) {
  const { data } = await apiClient.put(`/api/admin/inventory-requests/${id}/rows/${rowId}/note`, {
    note,
  });
  return unwrapApiResponse<unknown>(data);
}

export function downloadRequestFile(id: number, fileName?: string) {
  return downloadBlob(
    `/api/admin/inventory-requests/${id}/file`,
    fileName ?? `inventory-request-${id}`,
  );
}

export function downloadErrorReport(id: number) {
  return downloadBlob(
    `/api/admin/inventory-requests/${id}/error-report`,
    `error-report-${id}.xlsx`,
  );
}

// ---------- dashboard & reports ----------

export async function getSuperAdminDashboard(page = 1, pageSize = 10) {
  const { data } = await apiClient.get("/api/superadmin/dashboard", {
    params: { page, pageSize },
  });
  const raw = unwrapApiResponse<ReportsOverview & { recentActivities?: unknown }>(data);
  const activities = Array.isArray(raw.recentActivities)
    ? (raw.recentActivities as RecentActivity[])
    : ((raw.recentActivities as { items?: RecentActivity[] } | undefined)?.items ?? []);
  return { ...raw, recentActivities: activities };
}

export async function getReportsOverview(
  params: {
    period?: "Day" | "Week" | "Month" | "Year";
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const { data } = await apiClient.get("/api/superadmin/Reports/overview", {
    params: qs({ ...params }),
  });
  const raw = unwrapApiResponse<ReportsOverview & { recentActivities?: unknown }>(data);
  const activities = Array.isArray(raw.recentActivities)
    ? (raw.recentActivities as RecentActivity[])
    : ((raw.recentActivities as { items?: RecentActivity[] } | undefined)?.items ?? []);
  return { ...raw, recentActivities: activities };
}

export async function getPharmacyPerformance(year: number, top = 6) {
  const { data } = await apiClient.get("/api/superadmin/Reports/pharmacy-performance", {
    params: { year, top },
  });
  const value = unwrapApiResponse<PharmacyPerformance[] | { items?: PharmacyPerformance[] }>(data);
  return Array.isArray(value) ? value : (value.items ?? []);
}

export function exportPharmacyPerformance(year: number) {
  return downloadBlob(
    `/api/superadmin/Reports/pharmacy-performance/export?year=${year}`,
    `pharmacy-performance-${year}.xlsx`,
  );
}

// ---------- people & support ----------

export async function getCustomers(page = 1, pageSize = 10) {
  const { data } = await apiClient.get("/api/superadmin/Customers", {
    params: { page, pageSize },
  });
  const value = unwrapApiResponse<CustomerRecord[] | { items?: CustomerRecord[] }>(data);
  return { items: Array.isArray(value) ? value : (value.items ?? []) };
}

export async function getUsers(page = 1, pageSize = 10) {
  const { data } = await apiClient.get("/api/superadmin/Users", {
    params: { page, pageSize },
  });
  const value = unwrapApiResponse<UserRecord[] | { items?: UserRecord[] }>(data);
  return { items: Array.isArray(value) ? value : (value.items ?? []) };
}

export async function setUserActive(id: string, active: boolean) {
  const { data } = await apiClient.put(
    `/api/superadmin/Users/${id}/${active ? "activate" : "deactivate"}`,
  );
  return unwrapApiResponse<unknown>(data);
}

export async function getSupportTickets(page = 1, pageSize = 10) {
  const { data } = await apiClient.get("/api/superadmin/Supports", {
    params: { page, pageSize },
  });
  const value = unwrapApiResponse<SupportTicket[] | { items?: SupportTicket[] }>(data);
  return { items: Array.isArray(value) ? value : (value.items ?? []) };
}

export async function updateTicketStatus(id: number, status: "Pending" | "Contacted" | "Solved") {
  const { data } = await apiClient.put(`/api/superadmin/Supports/${id}/status`, { status });
  return unwrapApiResponse<unknown>(data);
}
