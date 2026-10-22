import { apiClient, unwrapApiResponse } from "./client";
import type { DashboardResponse, Pharmacy, OrderStatus } from "@/types";
import { OrdersAPI } from "@/api";

type Summary = {
  newOrdersToday?: number;
  deliveredOrdersToday?: number;
  salesToday?: number;
  ordersByStatus?: { status: string; count: number }[];
};

const statusKey = (status: string): OrderStatus | undefined => {
  switch (status.toLowerCase()) {
    case "waitingforoffers": return "open-bidding";
    case "pendingconfirmation": return "awaiting-customer-confirmation";
    case "confirmed": return "confirmed";
    case "onhold": return "on-hold";
    case "inpreparation": return "preparing";
    case "inroute": return "on-delivery";
    case "delivered": return "delivered";
    case "cancelled": return "cancelled";
    default: return undefined;
  }
};

export async function getDashboard(): Promise<DashboardResponse> {
  const [{ data: summaryResponse }, ordersResponse] = await Promise.all([
    apiClient.get("/api/admin/dashboard/summary"),
    OrdersAPI.getOrders({ status: "all", page: 1, pageSize: 10 }),
  ]);
  const summary = unwrapApiResponse<Summary>(summaryResponse);
  const byStatus = new Map<OrderStatus, number>();
  for (const item of summary.ordersByStatus ?? []) {
    const key = statusKey(item.status);
    if (key) byStatus.set(key, Number(item.count ?? 0));
  }

  const orders = ordersResponse.data;
  return {
    stats: {
      ordersToday: Number(summary.newOrdersToday ?? 0),
      openBidding: byStatus.get("open-bidding"),
      preparing: byStatus.get("preparing") ?? 0,
      onHold: byStatus.get("on-hold") ?? 0,
      delivered: Number(summary.deliveredOrdersToday ?? byStatus.get("delivered") ?? 0),
      onDelivery: byStatus.get("on-delivery") ?? 0,
      cancelled: byStatus.get("cancelled") ?? 0,
      totalRevenue: Number(summary.salesToday ?? 0),
      // This metric is not provided by the documented API; don't invent a value.
      revenueGrowth: undefined as unknown as number,
    },
    recentOrders: orders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      address: order.customer.address,
      status: order.status,
      payment: order.payment,
      total: order.total,
      itemsCount: order.products.length,
      createdAt: order.createdAt,
      remainingMinutes: order.remainingMinutes,
    })),
    updatedAt: new Date().toISOString(),
  };
}

export async function getSuperAdminDashboard(page = 1, pageSize = 10) {
  const { data } = await apiClient.get("/api/superadmin/dashboard", { params: { page, pageSize } });
  return unwrapApiResponse<Record<string, any>>(data);
}

export async function getPharmacy(): Promise<Pharmacy> {
  const { data } = await apiClient.get("/api/admin/pharmacy/me");
  const raw = unwrapApiResponse<Record<string, any>>(data);
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    address: String(raw.address ?? ""),
    phone: String(raw.phone ?? ""),
    email: String(raw.email ?? ""),
    logo: raw.logo ?? undefined,
    isAcceptingOrders: Boolean(raw.isAcceptingOrders),
    createdAt: String(raw.createdAt ?? ""),
  };
}

export async function setPharmacyAvailability(isAccepting: boolean): Promise<Pharmacy> {
  const { data } = await apiClient.put("/api/admin/pharmacy/accepting-orders", {
    isAcceptingOrders: isAccepting,
  });
  const raw = unwrapApiResponse<Record<string, any>>(data);
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    address: String(raw.address ?? ""),
    phone: String(raw.phone ?? ""),
    email: String(raw.email ?? ""),
    logo: raw.logo ?? undefined,
    isAcceptingOrders: Boolean(raw.isAcceptingOrders),
    createdAt: String(raw.createdAt ?? ""),
  };
}

export async function setReturnPolicy(returnPolicy: string) {
  const { data } = await apiClient.put("/api/admin/pharmacy/return-policy", { returnPolicy });
  return unwrapApiResponse<unknown>(data);
}
