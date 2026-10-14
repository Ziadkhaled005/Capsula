import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, MapPin, Phone, Search, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCancelOrder, useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import type { Order as ApiOrder, OrderStatus } from "@/types";

export const Route = createFileRoute("/pharmacy/orders")({
  head: () => ({ meta: [{ title: "الطلبات - كبسولة" }] }),
  component: OrdersPage,
});

export type StatusKey = "all" | OrderStatus;
export type Payment = "cash" | "card";
export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
  color: string;
  available?: boolean;
};
export type Order = {
  id: string;
  customer: string;
  orderNo: string;
  phone: string;
  address: string;
  addressDetail?: string;
  time: string;
  payment: Payment;
  remaining?: string;
  items: number;
  price: number;
  status: OrderStatus;
  products: OrderItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
};

export function mapOrder(order: ApiOrder): Order {
  return {
    id: order.id,
    customer: order.customer.name,
    orderNo: order.orderNo,
    phone: order.customer.phone,
    address: order.customer.address,
    addressDetail: order.customer.addressDetail,
    time: new Date(order.createdAt).toLocaleTimeString(),
    payment: order.payment,
    remaining: order.remainingMinutes === undefined ? undefined : `${order.remainingMinutes} دقيقة`,
    items: order.products.length,
    price: order.total,
    status: order.status,
    products: order.products.map((product, index) => ({
      productId: product.id,
      name: product.name,
      qty: product.qty,
      price: product.unitPrice,
      color: ["bg-sky-100", "bg-purple-100", "bg-red-100", "bg-slate-200"][index % 4],
      available: product.available,
    })),
    subtotal: order.subtotal,
    delivery: order.deliveryFee,
    discount: order.discount,
    total: order.total,
  };
}

export const statusBadge: Record<Exclude<StatusKey, "all">, { label: string; className: string }> = {
  "open-bidding": { label: "مزايدة مفتوحة", className: "border-[#E87919] text-[#E87919] bg-transparent" },
  "on-hold": { label: "الطلب معلق", className: "border-warning/40 text-warning-foreground bg-warning/10" },
  "awaiting-customer-confirmation": { label: "بانتظار تأكيد العميل", className: "border-[#d8c596] text-[#8a7041] bg-[#fbf6e8]" },
  confirmed: { label: "تم التأكيد", className: "border-success/40 text-success bg-success/5" },
  preparing: { label: "جاري التجهيز", className: "border-border text-foreground bg-card" },
  "on-delivery": { label: "في طريق التوصيل", className: "border-border text-foreground bg-card" },
  delivered: { label: "تم التوصيل", className: "border-success/40 text-success bg-success/5" },
  cancelled: { label: "تم الإلغاء", className: "border-destructive/40 text-destructive bg-destructive/5" },
};

const tabs: { key: StatusKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "open-bidding", label: "مزايدة مفتوحة" },
  { key: "on-hold", label: "الطلب معلق" },
  { key: "awaiting-customer-confirmation", label: "بانتظار العميل" },
  { key: "confirmed", label: "تم التأكيد" },
  { key: "preparing", label: "جاري التجهيز" },
  { key: "on-delivery", label: "في طريق التوصيل" },
  { key: "delivered", label: "تم التوصيل" },
  { key: "cancelled", label: "تم الإلغاء" },
];

function OrdersPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<StatusKey>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const ordersQuery = useOrders({
    status: active,
    search: query.trim() || undefined,
    page,
    pageSize: 10,
  });
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const orders = (ordersQuery.data?.data ?? []).map(mapOrder);
  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;

  const updateOrder = async (order: Order, status: OrderStatus) => {
    setActionError("");
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
    } catch {
      setActionError("تعذر تحديث حالة الطلب. لم يتم تأكيد التغيير.");
    }
  };

  const handleCancel = async (order: Order) => {
    setActionError("");
    try {
      await cancelOrder.mutateAsync({ id: order.id, reason: "Pharmacy cancelled order" });
      setSelectedId(null);
    } catch {
      setActionError("تعذر إلغاء الطلب. لم يتم تأكيد الإلغاء.");
    }
  };

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    confirmed: "preparing",
    preparing: "on-delivery",
    "on-delivery": "delivered",
  };

  return (
    <div dir="rtl">
      <div className="mb-8 text-right">
        <h1 className="text-3xl font-bold text-foreground">الطلبات</h1>
        <p className="mt-2 text-sm text-muted-foreground">متابعة وإدارة طلبات العملاء</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="relative mb-5">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="البحث بالاسم أو رقم الهاتف أو رقم الطلب"
            className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-right text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActive(tab.key);
                setPage(1);
                setSelectedId(null);
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                active === tab.key
                  ? "border-primary/30 bg-primary/10 font-medium text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted/40",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {ordersQuery.isLoading ? (
          <p role="status" className="py-12 text-center text-sm text-muted-foreground">جارٍ تحميل الطلبات...</p>
        ) : ordersQuery.isError ? (
          <div role="alert" className="py-12 text-center text-sm text-destructive">
            <p>تعذر تحميل الطلبات.</p>
            <button type="button" onClick={() => void ordersQuery.refetch()} className="mt-2 underline">إعادة المحاولة</button>
          </div>
        ) : orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">لا توجد طلبات.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const badge = statusBadge[order.status];
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedId(order.id === selectedId ? null : order.id)}
                  className={cn(
                    "w-full rounded-xl border border-border bg-card p-5 text-right transition-colors hover:bg-[#f0f4f2]",
                    order.id === selectedId && "bg-[#f0f4f2]",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-foreground">{order.customer}</div>
                      <div className="mt-1 text-xs text-muted-foreground">رقم الطلب: #{order.orderNo}</div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span dir="ltr">{order.phone}</span>
                        <MapPin className="mr-1 h-3.5 w-3.5" />
                        <span>{order.address}</span>
                      </div>
                    </div>
                    <span className={cn("shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium", badge.className)}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      {order.payment === "cash" ? <Wallet className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      {order.payment === "cash" ? "نقد" : "بطاقة ائتمان"}
                    </span>
                    <span>{order.items} منتجات</span>
                    <span className="font-bold text-success">{order.total.toFixed(2)} ج.م</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {ordersQuery.data && ordersQuery.data.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
            <span>{ordersQuery.data.total} طلبات</span>
            <div className="flex items-center gap-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="disabled:opacity-40">السابق</button>
              <span>{page} / {ordersQuery.data.totalPages}</span>
              <button type="button" disabled={page >= ordersQuery.data.totalPages} onClick={() => setPage((value) => value + 1)} className="disabled:opacity-40">التالي</button>
            </div>
          </div>
        )}

        {actionError && <p role="alert" className="mt-4 text-sm text-destructive">{actionError}</p>}
        {selectedOrder && (
          <section className="mt-5 rounded-xl border border-border bg-background p-5" aria-label="تفاصيل الطلب">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold">تفاصيل الطلب #{selectedOrder.orderNo}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedOrder.customer} · {selectedOrder.phone}</p>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} className="text-sm text-muted-foreground underline">إغلاق</button>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {selectedOrder.products.map((product) => (
                <li key={product.productId} className="flex justify-between gap-4 py-2 text-sm">
                  <span>{product.name} × {product.qty}</span>
                  <span>{product.price.toFixed(2)} ج.م</span>
                </li>
              ))}
            </ul>
            {selectedOrder.status === "open-bidding" && (
              <button
                type="button"
                onClick={() => navigate({
                  to: "/pharmacy/offer/$orderNo",
                  params: { orderNo: selectedOrder.orderNo },
                  search: { editOffer: false },
                })}
                className="mt-4 rounded-full bg-[#E87919] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                اقتراح بدائل للطلب
              </button>
            )}
            {selectedOrder.status === "on-hold" && (
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                استرجاع أو تعديل تفاصيل العرض يتطلب endpoint لقراءة العرض، وهو غير متاح حالياً.
              </p>
            )}
            {selectedOrder.status === "awaiting-customer-confirmation" && (
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                تأكيد العميل غير متاح حتى يوفّر الخادم endpoint لقراءة قرار العميل واستقباله.
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {nextStatus[selectedOrder.status] && (
                <button
                  type="button"
                  disabled={updateStatus.isPending}
                  onClick={() => void updateOrder(selectedOrder, nextStatus[selectedOrder.status]!)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                  {updateStatus.isPending ? "جارٍ تحديث الحالة..." : "تحديث حالة الطلب"}
                </button>
              )}
              {!["cancelled", "delivered"].includes(selectedOrder.status) && (
                <button
                  type="button"
                  disabled={cancelOrder.isPending}
                  onClick={() => void handleCancel(selectedOrder)}
                  className="rounded-lg border border-destructive/40 px-4 py-2 text-sm text-destructive disabled:opacity-50"
                >
                  إلغاء الطلب
                </button>
              )}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
