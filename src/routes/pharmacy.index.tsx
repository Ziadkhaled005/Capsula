import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Truck,
  PauseCircle,
  PackageOpen,
  Receipt,
  RefreshCw,
  Phone,
  MapPin,
  Clock,
  Wallet,
  CreditCard,
  Gavel,
  Trophy,
  BadgePercent,
} from "lucide-react";
import remainingTimeIcon from "../../attached_assets/Leading_Icon_1790878708496.png";
import newOrdersIcon from "@/assets/new-orders-icon.png";
import preparingIcon from "@/assets/preparing-icon.png";
import { cn } from "@/lib/utils";
import {
  saveOrderStatus,
  subscribeToOrderStatusUpdates,
  withSavedOrderStatuses,
} from "@/lib/pharmacy-order-status-store";
import { initializeSampleOrdersAtOpenBidding } from "@/lib/pharmacy-order-initial-state";
import { initialOrders, statusBadge, OrderDetailsPanel } from "./pharmacy.orders";
import type { Order, StatusKey } from "./pharmacy.orders";

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
  const [orderList, setOrderList] = useState<Order[]>(initialOrders);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const refreshOrders = () => {
      initializeSampleOrdersAtOpenBidding(initialOrders.map((order) => order.orderNo));
      setOrderList(withSavedOrderStatuses(initialOrders));
    };
    refreshOrders();
    return subscribeToOrderStatusUpdates(refreshOrders);
  }, []);

  const handleStatusChange = (orderNo: string, status: Exclude<StatusKey, "all">) => {
    saveOrderStatus(orderNo, status);
    setOrderList((prev) => prev.map((o) => (o.orderNo === orderNo ? { ...o, status } : o)));
  };

  const selectedFromList = selected
    ? (orderList.find((o) => o.orderNo === selected.orderNo) ?? null)
    : null;

  const counts = {
    confirmed: orderList.filter((o) => o.status === "confirmed").length,
    incomingBids: orderList.filter((o) => o.status === "open-bidding").length,
    preparing: orderList.filter((o) => o.status === "preparing").length,
    onHold: orderList.filter((o) => o.status === "on-hold").length,
    delivered: orderList.filter((o) => o.status === "delivered").length,
  };

  const liveStats: { id: string; label: string; value: number | string; icon: typeof Truck; tone: Tone }[] = [
    { id: "confirmed-orders", label: "طلبات تم تأكيدها اليوم", value: counts.confirmed, icon: Receipt, tone: "primary" },
    { id: "preparing", label: "طلب يتم تحضيره", value: counts.preparing, icon: PackageOpen, tone: "purple" },
    {
      id: "on-hold",
      label: "طلبات تحتاج تأكيد البديل",
      value: counts.onHold,
      icon: PauseCircle,
      tone: "warning",
    },
    { id: "delivered", label: "طلب تم توصيله اليوم", value: counts.delivered, icon: Truck, tone: "primary" },
    { id: "incoming-bids", label: "طلبات مزايدة واردة اليوم", value: counts.incomingBids, icon: Gavel, tone: "warning" },
    { id: "weekly-offers", label: "عروض مقدمة هذا الأسبوع", value: 18, icon: Receipt, tone: "danger" },
    { id: "bid-win-rate", label: "نسبة الفوز بالمزايدات", value: "89%", icon: Trophy, tone: "success" },
    { id: "average-discount", label: "متوسط خصمك (السوق 9%)", value: "10%", icon: BadgePercent, tone: "warning" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-right">
        <h1 className="text-3xl font-bold text-foreground">مرحباً بك في لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2 text-sm">نظرة سريعة على أداء صيدلتك اليوم</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" dir="rtl">
        {liveStats.map((s) => (
          <div
            key={s.id}
            data-testid={`card-stat-${s.id}`}
            className="min-h-[124px] bg-card rounded-2xl border border-border px-4 pt-2 pb-3 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", toneMap[s.tone])}>
                {s.label === "طلبات تم تأكيدها اليوم"
                  ? <img src={newOrdersIcon} alt="" className="h-5 w-5 object-contain" />
                  : s.label === "طلب يتم تحضيره"
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
          {orderList.map((o, i) => {
            const badge = statusBadge[o.status];
            const isSelected = selected?.orderNo === o.orderNo;
            return (
              <div
                key={i}
                onClick={() => setSelected(o)}
                className={cn(
                  "rounded-xl border border-border bg-card p-5 transition-colors cursor-pointer hover:bg-[#f0f4f2]",
                  isSelected && "bg-[#f0f4f2]",
                )}
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-right">
                    <div className="text-base font-bold text-foreground">{o.customer}</div>
                    <div className="text-xs text-muted-foreground mt-1">رقم الطلب: #{o.orderNo}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{o.phone}</span>
                      <MapPin className="h-3.5 w-3.5 shrink-0 mr-1" />
                      <span className="truncate max-w-[28ch]">{o.address}</span>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium shrink-0", badge.className)}>
                    {badge.label}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {o.remaining && (
                        <span className="inline-flex items-center gap-1.5">
                          <img
                            src={remainingTimeIcon}
                            alt=""
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 object-contain"
                          />
                          <span className="text-[#E87919]">الوقت المتبقي ({o.remaining})</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <span>{o.payment === "cash" ? "نقد" : "بطاقة ائتمان"}</span>
                        {o.payment === "cash" ? <Wallet className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span>{o.time}</span>
                        <Clock className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{o.items} منتجات</div>
                      <div className="text-success font-bold mt-1">{o.price.toFixed(2)} ج.م</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث الصفحة
            </button>
          </div>
        </div>
      </div>

      <OrderDetailsPanel
        order={selectedFromList}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
