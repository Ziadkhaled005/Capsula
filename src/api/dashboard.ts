import { apiRequest } from "./client";
import type { JsonRecord, PharmacyProfile, UpdateSystemSettingsDto } from "./contracts";

export async function getPharmacy(): Promise<PharmacyProfile> {
  return apiRequest<PharmacyProfile>("/admin/pharmacy/me");
}

export async function setPharmacyAvailability(isAcceptingOrders: boolean): Promise<PharmacyProfile> {
  return apiRequest<PharmacyProfile>("/admin/pharmacy/accepting-orders", {
    method: "PUT",
    body: { isAcceptingOrders },
  });
}

export async function updateReturnPolicy(returnPolicy: string | null): Promise<PharmacyProfile> {
  return apiRequest<PharmacyProfile>("/admin/pharmacy/return-policy", {
    method: "PUT",
    body: { returnPolicy },
  });
}

export async function getPharmacySummary(): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/admin/dashboard/summary");
}

export async function getSuperAdminDashboard(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/dashboard", { params });
}

export async function getAdminDashboardSummary(): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/admin/dashboard/summary");
}

export async function getDashboardRevenue(params: {
  from?: string;
  to?: string;
} = {}): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/admin/dashboard/revenue", { params });
}

export async function getTopProducts(count = 10): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>("/admin/dashboard/top-products", {
    params: { count },
  });
}

export async function getSystemSettings(): Promise<UpdateSystemSettingsDto> {
  return apiRequest<UpdateSystemSettingsDto>("/superadmin/Settings");
}

export async function updateSystemSettings(
  settings: UpdateSystemSettingsDto,
): Promise<UpdateSystemSettingsDto> {
  return apiRequest<UpdateSystemSettingsDto>("/superadmin/Settings", {
    method: "PUT",
    body: settings,
  });
}

export async function getPharmacyPerformance(year: number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/Reports/pharmacy-performance", {
    params: { year, top: 6 },
  });
}

export async function getReportOverview(
  period: "Day" | "Week" | "Month" | "Year",
  params: { from?: string; to?: string; page?: number; pageSize?: number } = {},
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/superadmin/Reports/overview", {
    params: { period, page: 1, pageSize: 10, ...params },
  });
}
