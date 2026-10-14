import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Truck,
  PauseCircle,
  PackageOpen,
  Receipt,
  Gavel,
  RefreshCw,
} from "lucide-react";
import newOrdersIcon from "@/assets/new-orders-icon.png";
import preparingIcon from "@/assets/preparing-icon.png";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/pharmacy/")({
  head: () => ({
    meta: [{ title: "لوحة التحكم - صيدلية فينوس" }],
  }),
  component: PharmacyDashboard,
});

type Tone = "primary" | "warning" | "purple" | "danger" | "success";

const toneMap: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/15 text-warning-foreground",
  purple: "bg-[oklch(0.92_0.05_300)] text-[oklch(0.45_0.15_300)]",
  danger: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

function PharmacyDashboard() {
  const dashboard = useDashboard();
  const stats = dashboard.data?.stats;
  const recentOrders = dashboard.data?.recentOrders ?? [];
  const liveStats: { id: string; label: string; value: number; icon: typeof Truck; tone: Tone }[] = stats
    ? [
        { id: "confirmed-orders", label: "طلبات اليوم", value: stats.ordersToday, icon: Receipt, tone: "primary" },
        { id: "preparing", label: "طلبات قيد التجهيز", value: stats.preparing, icon: PackageOpen, tone: "purple" },
        { id: "on-hold", label: "طلبات معلقة", value: stats.onHold, icon: PauseCircle, tone: "warning" },
        { id: "delivered", label: "طلبات تم توصيلها", value: stats.delivered, icon: Truck, tone: "primary" },
        { id: "on-delivery", label: "طلبات قيد التوصيل", value: stats.onDelivery, icon: Truck, tone: "primary" },
        ...(stats.openBidding === undefined ? [] : [{ id: "open-bidding", label: "مزايدات مفتوحة", value: stats.openBidding, icon: Gavel, tone: "warning" as const }]),
      ]
    : [];
  const orderStatusLabels: Record<OrderStatus, string> = {
    "open-bidding": "مزايدة مفتوحة",
    "on-hold": "الطلب معلق",
    "awaiting-customer-confirmation": "بانتظار العميل",
    confirmed: "تم التأكيد",
    preparing: "جاري التجهيز",
    "on-delivery": "في طريق التوصيل",
    delivered: "تم التوصيل",
    cancelled: "تم الإلغاء",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-right">
        <h1 className="text-3xl font-bold text-foreground">مرحباً بك في لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2 text-sm">نظرة سريعة على أداء صيدلتك اليوم</p>
      </div>

      {/* Stats */}
      {dashboard.isLoading ? (
        <p role="status" className="py-8 text-center text-sm text-muted-foreground">جارٍ تحميل بيانات لوحة التحكم...</p>
      ) : dashboard.isError ? (
        <div role="alert" className="py-8 text-center text-sm text-destructive">
          <p>تعذر تحميل بيانات لوحة التحكم.</p>
          <button type="button" onClick={() => void dashboard.refetch()} className="mt-2 underline">إعادة المحاولة</button>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" dir="rtl">
        {liveStats.map((s) => (
          <div
            key={s.id}
            data-testid={`card-stat-${s.id}`}
            className="min-h-[124px] bg-card rounded-2xl border border-border px-4 pt-2 pb-3 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", toneMap[s.tone])}>
                {s.id === "confirmed-orders"
                  ? <img src={newOrdersIcon} alt="" className="h-5 w-5 object-contain" />
                  : s.id === "preparing"
                  ? <img src={preparingIcon} alt="" className="h-5 w-5 object-contain" />
                  : <s.icon className="h-5 w-5" />
                }
              </div>
            </div>
            <div className="mt-4 text-right">
              <div className="text-sm leading-5 text-muted-foreground">{s.label}</div>
              <div className="text-2xl leading-7 font-bold text-foreground mt-0.5">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Recent orders */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex items-start justify-between p-6 border-b border-border">
          <Link to="/pharmacy/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <span>عرض جميع الطلبات</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
          <div className="text-right">
            <h3 className="text-lg font-semibold text-foreground">الطلبات الاخيرة</h3>
            <p className="text-sm text-muted-foreground mt-1">آخر الطلبات الواردة</p>
          </div>
        </div>

        <div className="p-6 space-y-3" dir="rtl">
          {recentOrders.map((order) => {
            return (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-right">
                    <div className="text-base font-bold text-foreground">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground mt-1">رقم الطلب: #{order.orderNo}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{order.customerPhone} · {order.address}</div>
                  </div>
                  <span className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium shrink-0">
                    {orderStatusLabels[order.status]}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="text-xs">{order.payment === "cash" ? "نقد" : "بطاقة ائتمان"} · {new Date(order.createdAt).toLocaleString()}</div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{order.itemsCount} منتجات</div>
                      <div className="text-success font-bold mt-1">{order.total.toFixed(2)} ج.م</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!dashboard.isLoading && !dashboard.isError && recentOrders.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">لا توجد طلبات حديثة.</p>
          )}

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => void dashboard.refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث الصفحة
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
