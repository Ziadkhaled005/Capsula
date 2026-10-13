import { apiClient, unwrapApiResponse } from "./client";
import type { DashboardResponse, Pharmacy } from "@/types";

/**
 * GET /dashboard
 * Fetch live dashboard stats (order counts by status, revenue, recent orders).
 */
export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await apiClient.get("/api/admin/dashboard/summary");
  return unwrapApiResponse<DashboardResponse>(data);
}

/**
 * GET /pharmacy
 * Fetch the authenticated pharmacist's pharmacy profile.
 */
export async function getPharmacy(): Promise<Pharmacy> {
  const { data } = await apiClient.get("/api/admin/pharmacy/me");
  return unwrapApiResponse<Pharmacy>(data);
}

/**
 * PATCH /pharmacy/availability
 * Toggle whether the pharmacy is accepting new orders.
 */
export async function setPharmacyAvailability(isAccepting: boolean): Promise<Pharmacy> {
  const { data } = await apiClient.put("/api/admin/pharmacy/accepting-orders", {
    isAcceptingOrders: isAccepting,
  });
  return unwrapApiResponse<Pharmacy>(data);
}
