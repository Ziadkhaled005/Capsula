import { apiClient } from "./client";
import type { DashboardResponse, Pharmacy } from "@/types";

/**
 * GET /dashboard
 * Fetch live dashboard stats (order counts by status, revenue, recent orders).
 */
export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>("/dashboard");
  return data;
}

/**
 * GET /pharmacy
 * Fetch the authenticated pharmacist's pharmacy profile.
 */
export async function getPharmacy(): Promise<Pharmacy> {
  const { data } = await apiClient.get<Pharmacy>("/pharmacy");
  return data;
}

/**
 * PATCH /pharmacy/availability
 * Toggle whether the pharmacy is accepting new orders.
 */
export async function setPharmacyAvailability(isAccepting: boolean): Promise<Pharmacy> {
  const { data } = await apiClient.patch<Pharmacy>("/pharmacy/availability", {
    isAcceptingOrders: isAccepting,
  });
  return data;
}
