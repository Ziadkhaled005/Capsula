export interface DashboardStats {
  ordersToday: number;
  openBidding?: number;
  preparing: number;
  onHold: number;
  delivered: number;
  onDelivery: number;
  cancelled: number;
  totalRevenue: number;
  revenueGrowth: number;
}

export interface RecentOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: import("./orders").OrderStatus;
  payment: import("./orders").PaymentMethod;
  total: number;
  itemsCount: number;
  createdAt: string;
  remainingMinutes?: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  updatedAt: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  isAcceptingOrders: boolean;
  createdAt: string;
}

export interface SuperAdminDashboardResponse {
  pendingInventoryRequests: number;
  rejectedOrders: number;
  activeOrders: number;
  recentActivities: Array<{
    requestId: number | string;
    pharmacyId: number | string;
    pharmacyName: string;
    activityType: string;
    status: string;
    date: string;
  }>;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}
