import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gavel, PackageOpen, PauseCircle, Receipt, Truck } from "lucide-react";
import { OrdersAPI, isApiConfigured } from "@/api";
import { mapBidToOrder, mapPharmacyOrderToOrder } from "@/lib/pharmacy-api-mappers";
import type { BidListItem } from "@/api/contracts";
import type { Order } from "./pharmacy.orders";

export const Route = createFileRoute("/pharmacy/")({
  head: () => ({ meta: [{ title: "لوحة التحكم - صيدلية" }] }),
  component: PharmacyDashboard,
});

function PharmacyDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;

    async function loadOrders() {
      setLoading(true);
      setError("");
      if (!isApiConfigured) {
        setError("لم يتم ربط واجهة API الحقيقية بعد.");
        setLoading(false);
        return;
      }
      try {
        const [bids, serverOrders] = await Promise.all([
          OrdersAPI.getBids(),
          OrdersAPI.getOrders(),
        ]);
        if (!current) return;
        const liveBids = bids.filter(
          (bid) => bid.bidStatus === "Open" || bid.bidStatus === "Submitted",
        );
        setOrders([
          ...liveBids.map((bid) => mapBidToOrder(bid as BidListItem)),
          ...serverOrders.map((order) => mapPharmacyOrderToOrder(order)),
        ]);
      } catch (cause) {
        if (current) {
          setError(
            cause instanceof Error
              ? cause.message
              : "تعذر تحميل بيانات لوحة التحكم.",
          );
        }
      } finally {
        if (current) setLoading(false);
      }
    }

    void loadOrders();
    return () => {
      current = false;
    };
  }, []);

  const count = (status: Order["status"]) =>
    loading || error ? "—" : orders.filter((order) => order.status === status).length;

  const stats = [
    { label: "الطلبات المؤكدة", value: count("confirmed"), icon: Receipt },
    { label: "قيد التجهيز", value: count("preparing"), icon: PackageOpen },
    { label: "بانتظار البدائل", value: count("on-hold"), icon: PauseCircle },
    { label: "تم التوصيل", value: count("delivered"), icon: Truck },
    { label: "مزايدات مفتوحة", value: count("open-bidding"), icon: Gavel },
  ];

  return (
    <div dir="rtl" className="space-y-7">
      <header className="text-right">
        <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          تعرض هذه الصفحة بيانات الطلبات القادمة من واجهة API الحقيقية فقط.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-5 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-5">
          <Link to="/pharmacy/orders" className="text-sm font-medium text-primary hover:underline">
            عرض جميع الطلبات
          </Link>
          <div className="text-right">
            <h2 className="text-lg font-semibold">الطلبات الأخيرة</h2>
            <p className="mt-1 text-sm text-muted-foreground">بيانات حقيقية من الخادم</p>
          </div>
        </div>
        <div className="space-y-3 p-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">جارٍ تحميل الطلبات...</p>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد طلبات حقيقية متاحة حالياً.
            </p>
          ) : (
            orders.slice(0, 5).map((order) => (
              <article key={order.orderNo} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">#{order.orderNo}</span>
                  <strong className="text-sm">{order.customer || "—"}</strong>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {order.items} منتجات · {order.price} ج.م
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
