import { apiClient, unwrapApiResponse } from "./client";
import type { DashboardResponse, Pharmacy, SuperAdminDashboardResponse } from "@/types";

export async function getDashboard(): Promise<DashboardResponse> {
  // Shared admin summary is explicitly available to SuperAdmin and Pharmacist.
  const { data } = await apiClient.get("/api/admin/dashboard/summary");
  const raw = unwrapApiResponse<any>(data);
  const byStatus = Array.isArray(raw?.ordersByStatus) ? raw.ordersByStatus : [];
  const count = (status: string) =>
    Number(byStatus.find((item: any) => String(item.status).toLowerCase() === status.toLowerCase())?.count ?? 0);

  return {
    stats: {
      ordersToday: Number(raw?.newOrdersToday ?? 0),
      openBidding: 0,
      preparing: count("InPreparation"),
      onHold: count("OnHold"),
      delivered: count("Delivered"),
      onDelivery: count("InRoute"),
      cancelled: count("Cancelled"),
      totalRevenue: Number(raw?.salesToday ?? 0),
      revenueGrowth: 0,
    },
    // The documented summary has no recent-order rows; do not fabricate them.
    recentOrders: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function getSuperAdminDashboard(
  page = 1,
  pageSize = 10,
): Promise<SuperAdminDashboardResponse> {
  const { data } = await apiClient.get("/api/superadmin/dashboard", { params: { page, pageSize } });
  return unwrapApiResponse<SuperAdminDashboardResponse>(data);
}

export async function getPharmacy(): Promise<Pharmacy> {
  const { data } = await apiClient.get("/api/admin/pharmacy/me");
  const raw = unwrapApiResponse<any>(data);
  return {
    id: String(raw.id),
    name: raw.name ?? "",
    address: raw.address ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    logo: raw.logo,
    isAcceptingOrders: Boolean(raw.isAcceptingOrders),
    createdAt: raw.createdAt ?? "",
  };
}

export async function setPharmacyAvailability(isAccepting: boolean): Promise<Pharmacy> {
  const { data } = await apiClient.put("/api/admin/pharmacy/accepting-orders", {
    isAcceptingOrders: isAccepting,
  });
  const raw = unwrapApiResponse<any>(data);
  return {
    id: String(raw.id ?? ""),
    name: raw.name ?? "",
    address: raw.address ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    logo: raw.logo,
    isAcceptingOrders: Boolean(raw.isAcceptingOrders ?? isAccepting),
    createdAt: raw.createdAt ?? "",
  };
}

export async function setReturnPolicy(returnPolicy: string): Promise<void> {
  const { data } = await apiClient.put("/api/admin/pharmacy/return-policy", { returnPolicy });
  unwrapApiResponse<unknown>(data);
}
