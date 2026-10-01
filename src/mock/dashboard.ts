import type { DashboardResponse } from "@/types";
import { MOCK_ORDERS } from "./orders";

export const MOCK_DASHBOARD: DashboardResponse = {
  stats: {
    ordersToday: 3,
    pendingConfirm: MOCK_ORDERS.filter((o) => o.status === "pending-confirm").length,
    preparing: MOCK_ORDERS.filter((o) => o.status === "preparing").length,
    onHold: MOCK_ORDERS.filter((o) => o.status === "on-hold").length,
    delivered: MOCK_ORDERS.filter((o) => o.status === "delivered").length,
    onDelivery: MOCK_ORDERS.filter((o) => o.status === "on-delivery").length,
    cancelled: MOCK_ORDERS.filter((o) => o.status === "cancelled").length,
    totalRevenue: 1850,
    revenueGrowth: 12.5,
  },
  recentOrders: MOCK_ORDERS.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    customerName: o.customer.name,
    customerPhone: o.customer.phone,
    address: o.customer.address,
    status: o.status,
    payment: o.payment,
    total: o.total,
    itemsCount: o.products.length,
    createdAt: o.createdAt,
    remainingMinutes: o.remainingMinutes,
  })),
  updatedAt: new Date().toISOString(),
};
