import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  Phone,
  MapPin,
  Clock,
  Wallet,
  CreditCard,
  Hourglass,
  X,
  Printer,
  Map as MapIcon,
  Copy,
  MessageCircle,
  Trash2,
  ChevronLeft,
  Info,
  Package,
  Bike,
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pharmacy/orders")({
  head: () => ({ meta: [{ title: "الطلبات - صيدلية فينوس" }] }),
  component: OrdersPage,
});

export type StatusKey =
  | "all"
  | "pending-confirm"
  | "confirmed"
  | "on-hold"
  | "preparing"
  | "on-delivery"
  | "delivered"
  | "cancelled";

const tabs: { key: StatusKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending-confirm", label: "يرجى التأكيد" },
  { key: "confirmed", label: "تم التأكيد" },
  { key: "on-hold", label: "الطلب معلق" },
  { key: "preparing", label: "جاري التجهيز" },
  { key: "on-delivery", label: "في طريق التوصيل" },
  { key: "delivered", label: "تم التوصيل" },
  { key: "cancelled", label: "تم الإلغاء" },
];

export type Payment = "cash" | "card";
export type OrderItem = { name: string; qty: number; price: number; color: string; available?: boolean };
export type Order = {
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
  status: Exclude<StatusKey, "all">;
  products?: OrderItem[];
  subtotal?: number;
  delivery?: number;
  discount?: number;
  total?: number;
};

const sampleProducts: OrderItem[] = [
  { name: "باندول ادفانس", qty: 2, price: 15, color: "bg-sky-100", available: false },
  { name: "باندول نايت", qty: 2, price: 15, color: "bg-purple-100" },
  { name: "باندول اكسترا", qty: 2, price: 30, color: "bg-red-100" },
  { name: "باندول صداع نصفي", qty: 2, price: 100, color: "bg-slate-200", available: false },
];

export const initialOrders: Order[] = [
  {
    customer: "احمد محمد",
    orderNo: "13554",
    phone: "011432567875",
    address: "مكان عمل، القاهرة الجديدة السفارة الا...",
    addressDetail: "مبنى ابسيسز، الدور الرابع، مكتب 11 الاسانسير كوده 4235",
    time: "01:13 م",
    payment: "cash",
    remaining: "08:53",
    items: 4,
    price: 285,
    status: "pending-confirm",
    products: sampleProducts,
    subtotal: 160,
    delivery: 30,
    discount: -100,
    total: 90,
  },
  {
    customer: "محمد فتح الله",
    orderNo: "13555",
    phone: "011432567875",
    address: "مكان عمل، القاهرة الجديدة السفارة الا...",
    time: "01:13 م",
    payment: "card",
    items: 4,
    price: 285,
    status: "pending-confirm",
    products: sampleProducts,
    subtotal: 160,
    delivery: 30,
    discount: -100,
    total: 90,
  },
  {
    customer: "عبدالله",
    orderNo: "13556",
    phone: "011432567875",
    address: "مكان عمل، القاهرة الجديدة السفارة الا...",
    time: "01:13 م",
    payment: "card",
    items: 4,
    price: 285,
    status: "pending-confirm",
    products: sampleProducts,
    subtotal: 160,
    delivery: 30,
    discount: -100,
    total: 90,
  },
];

export const statusBadge: Record<Exclude<StatusKey, "all">, { label: string; className: string }> = {
  "pending-confirm": { label: "يرجى التأكيد", className: "border-border text-foreground bg-card" },
  confirmed: { label: "تم التأكيد", className: "border-success/40 text-success bg-success/5" },
  "on-hold": { label: "الطلب معلق", className: "border-warning/40 text-warning-foreground bg-warning/10" },
  preparing: { label: "جاري التجهيز", className: "border-border text-foreground bg-card" },
  "on-delivery": { label: "في طريق التوصيل", className: "border-border text-foreground bg-card" },
  delivered: { label: "تم التوصيل", className: "border-success/40 text-success bg-success/5" },
  cancelled: { label: "تم الإلغاء", className: "border-destructive/40 text-destructive bg-destructive/5" },
};

export const orders = initialOrders;

function OrdersPage() {
  const [active, setActive] = useState<StatusKey>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [orderList, setOrderList] = useState<Order[]>(initialOrders);

  const handleStatusChange = (orderNo: string, status: Exclude<StatusKey, "all">) => {
    setOrderList((prev) => prev.map((o) => (o.orderNo === orderNo ? { ...o, status } : o)));
  };

  const selectedFromList = selected
    ? (orderList.find((o) => o.orderNo === selected.orderNo) ?? null)
    : null;

  const counts = orderList.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const q = query.trim().toLowerCase();
  const filtered = orderList.filter((o) => {
    if (active !== "all" && o.status !== active) return false;
    if (!q) return true;
    return (
      o.customer.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.orderNo.toLowerCase().includes(q)
    );
  });

  return (
    <div dir="rtl">
      <div className="text-right mb-8">
        <h1 className="text-3xl font-bold text-foreground">الطلبات</h1>
        <p className="text-muted-foreground mt-2 text-sm">متابعة و إدارة طلبات العملاء</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <div className="relative mb-5">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="البحث بالأسم، رقم الهاتف، او رقم الطلب"
            className="w-full rounded-xl border border-border bg-background pr-11 pl-4 py-3 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-6">
          {tabs.map((t) => {
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors flex-row-reverse",
                  isActive
                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                    : "border-border bg-card text-foreground hover:bg-muted/40",
                )}
              >
                <span>{t.label}</span>
                {t.key !== "all" && (
                  <span className={cn("text-xs", isActive ? "text-primary" : "text-muted-foreground")}>
                    {counts[t.key] ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filtered.map((o, i) => {
            const badge = statusBadge[o.status];
            const isSelected = selected?.orderNo === o.orderNo && selected?.customer === o.customer;
            return (
              <div
                key={i}
                onClick={() => setSelected(o)}
                className={cn(
                  "rounded-xl border border-border bg-card p-5 transition-colors cursor-pointer hover:bg-[#f0f4f2] focus:bg-[#f0f4f2] focus:outline-none",
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
                  <span
                    className={cn(
                      "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium shrink-0",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {o.remaining && (
                        <span className="inline-flex items-center gap-1.5">
                          <span>الوقت المتبقي ({o.remaining})</span>
                          <Hourglass className="h-4 w-4" />
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
        </div>
      </div>

      <OrderDetailsPanel order={selectedFromList} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
    </div>
  );
}

export function OrderDetailsPanel({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderNo: string, status: Exclude<StatusKey, "all">) => void;
}) {
  const open = !!order;
  const [confirmed, setConfirmed] = useState(false);
  const [alternativeFor, setAlternativeFor] = useState<OrderItem | null>(null);
  const [proposals, setProposals] = useState<Record<string, OrderItem[]>>({});
  const [altQuantities, setAltQuantities] = useState<Record<string, number>>({});
  const [acceptedProducts, setAcceptedProducts] = useState<OrderItem[] | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [onDelivery, setOnDelivery] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [chosenAlternatives, setChosenAlternatives] = useState<Set<string>>(new Set());
  useEffect(() => {
    setAlternativeFor(null);
    setProposals({});
    setAltQuantities({});
    setAcceptedProducts(null);
    setChosenAlternatives(new Set());
    if (!order) {
      setConfirmed(false);
      setPreparing(false);
      setOnDelivery(false);
      setDelivered(false);
      return;
    }
    const s = order.status;
    if (s === "delivered") {
      setConfirmed(true); setPreparing(true); setOnDelivery(true); setDelivered(true);
    } else if (s === "on-delivery") {
      setConfirmed(true); setPreparing(true); setOnDelivery(true); setDelivered(false);
    } else if (s === "preparing") {
      setConfirmed(true); setPreparing(true); setOnDelivery(false); setDelivered(false);
    } else if (s === "confirmed") {
      setConfirmed(true); setPreparing(false); setOnDelivery(false); setDelivered(false);
    } else {
      setConfirmed(false); setPreparing(false); setOnDelivery(false); setDelivered(false);
    }
  }, [order?.orderNo]);
  const accepted = acceptedProducts !== null;
  const effectiveProducts = acceptedProducts ?? order?.products ?? [];
  const hasAnyProposal = !accepted && Object.keys(proposals).length > 0;
  const allAvailable = effectiveProducts.every((p) => p.available !== false);
  const confirmedAllAvailable = ((confirmed && allAvailable) || accepted) && !preparing && !onDelivery && !delivered;
  const confirmedWithProposals = confirmed && !accepted && Object.keys(proposals).length > 0;
  const headerStatusLabel = delivered
    ? statusBadge["delivered"].label
    : onDelivery
    ? statusBadge["on-delivery"].label
    : preparing
    ? statusBadge["preparing"].label
    : hasAnyProposal
    ? statusBadge["on-hold"].label
    : confirmedAllAvailable
    ? statusBadge["confirmed"].label
    : order ? statusBadge[order.status].label : "";
  const headerStatusClassName = delivered
    ? statusBadge["delivered"].className
    : onDelivery
    ? statusBadge["on-delivery"].className
    : preparing
    ? "border-border bg-card text-foreground"
    : hasAnyProposal
    ? statusBadge["on-hold"].className
    : confirmedAllAvailable
    ? statusBadge["confirmed"].className
    : "border-border bg-card";
  const effectiveSubtotal = accepted
    ? effectiveProducts.reduce((s, p) => s + p.price * p.qty, 0)
    : order?.subtotal ?? 0;
  const effectiveDelivery = order?.delivery ?? 0;
  const effectiveDiscount = order?.discount ?? 0;
  const effectiveTotal = accepted
    ? effectiveSubtotal + effectiveDelivery + effectiveDiscount
    : order?.total ?? 0;
  const acceptOrder = () => {
    if (!order?.products) return;
    const next: OrderItem[] = [];
    for (const p of order.products) {
      if (p.available !== false) {
        next.push(p);
        continue;
      }
      const proposal = proposals[p.name];
      if (proposal && proposal.length > 0) {
        for (const alt of proposal) {
          const qty = altQuantities[`${p.name}::${alt.name}`] ?? 1;
          if (qty > 0) next.push({ ...alt, qty });
        }
      }
    }
    setAcceptedProducts(next);
  };
  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />
      <aside
        dir="rtl"
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-full max-w-[760px] bg-[#fafbfa] shadow-2xl transition-transform duration-300 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {order && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium",
                    headerStatusClassName,
                  )}
                >
                  {headerStatusLabel}
                </span>
                <div className="text-right">
                  <div className="text-lg font-bold">تفاصيل الطلب</div>
                  <div className="text-xs text-muted-foreground mt-0.5">رقم الطلب: #{order.orderNo}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
              {/* Products */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between gap-2 mb-4 flex-row-reverse">
                  <span className="text-sm text-muted-foreground">{effectiveProducts.length}</span>
                  <h3 className="text-base font-bold">المنتجات</h3>
                </div>
                <div className="divide-y divide-border">
                  {effectiveProducts.map((p, idx) => {
                    const isUnavailable = confirmed && !accepted && p.available === false;
                    const proposal = proposals[p.name];
                    const hasProposal = !!proposal && proposal.length > 0;

                    const itemRow = (
                      <div className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", p.color)}>
                            <span className="text-[10px] font-bold text-foreground/70">Rx</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">الكمية: {p.qty} شريط</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isUnavailable && !hasProposal && (
                            <button
                              onClick={() => setAlternativeFor(p)}
                              className="inline-flex items-center rounded-md bg-success text-success-foreground px-2.5 py-1 text-[11px] font-medium hover:opacity-90"
                            >
                              اقترح بديل
                            </button>
                          )}
                          {isUnavailable && hasProposal && (
                            <span className="inline-flex items-center rounded-md border border-border bg-muted/40 text-muted-foreground px-2.5 py-1 text-[11px] font-medium">
                              غير متوفر
                            </span>
                          )}
                          <div className="text-sm text-foreground">{p.price.toFixed(2)} ج.م</div>
                        </div>
                      </div>
                    );

                    if (isUnavailable && hasProposal) {
                      return (
                        <div key={idx} className="py-3">
                          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
                            <div className="flex items-start justify-end gap-2 pb-3 mb-2 border-b border-warning/20">
                              <div className="text-right">
                                <div className="text-sm font-bold text-foreground">بأنتظار اختيار العميل</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  المنتج غير متوفر و يمكن للعميل اختيار أحد البدائل التالية:
                                </div>
                              </div>
                              <Info className="h-4 w-4 text-warning-foreground mt-0.5 shrink-0" />
                            </div>
                            {itemRow}
                            <div className="divide-y divide-warning/20">
                              {proposal.map((alt, ai) => (
                                <div key={ai} className="flex items-center justify-between py-3 px-2 -mx-2">
                                  <div className="flex items-center gap-3">
                                    <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", alt.color)}>
                                      <span className="text-[10px] font-bold text-foreground/70">Rx</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-medium">{alt.name}</div>
                                      <div className="text-xs text-muted-foreground mt-0.5">شريط</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {(() => {
                                      const key = `${p.name}::${alt.name}`;
                                      const isChosen = chosenAlternatives.has(key);
                                      if (confirmedWithProposals && isChosen) {
                                        const qty = altQuantities[key] ?? 1;
                                        return (
                                          <div className="inline-flex items-center gap-2">
                                            <button
                                              onClick={() =>
                                                setAltQuantities((prev) => ({
                                                  ...prev,
                                                  [key]: Math.max(0, (prev[key] ?? 1) - 1),
                                                }))
                                              }
                                              className="h-7 w-7 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted"
                                              aria-label="نقص"
                                            >
                                              <span className="text-base leading-none">−</span>
                                            </button>
                                            <span className="text-sm font-medium w-4 text-center">{qty}</span>
                                            <button
                                              onClick={() =>
                                                setAltQuantities((prev) => ({
                                                  ...prev,
                                                  [key]: (prev[key] ?? 1) + 1,
                                                }))
                                              }
                                              className="h-7 w-7 rounded-full bg-success/15 text-success flex items-center justify-center hover:bg-success/25"
                                              aria-label="زيادة"
                                            >
                                              <span className="text-base leading-none">+</span>
                                            </button>
                                          </div>
                                        );
                                      }
                                      return (
                                        <button
                                          onClick={() =>
                                            confirmedWithProposals &&
                                            setChosenAlternatives((prev) => new Set([...prev, key]))
                                          }
                                          className="inline-flex items-center rounded-md bg-success text-success-foreground px-2.5 py-1 text-[11px] font-medium hover:opacity-90"
                                        >
                                          اختيار هذا البديل
                                        </button>
                                      );
                                    })()}
                                    <div className="text-sm text-foreground">{alt.price.toFixed(2)} ج.م</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between py-3 px-2 -mx-2 rounded-lg",
                          isUnavailable && "bg-muted/60",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", p.color)}>
                            <span className="text-[10px] font-bold text-foreground/70">Rx</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">الكمية: {p.qty} شريط</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isUnavailable && (
                            <button
                              onClick={() => setAlternativeFor(p)}
                              className="inline-flex items-center rounded-md bg-success text-success-foreground px-2.5 py-1 text-[11px] font-medium hover:opacity-90"
                            >
                              اقترح بديل
                            </button>
                          )}
                          <div className="text-sm text-foreground">{p.price.toFixed(2)} ج.م</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>


              {/* Customer + Cost */}
              <div className="grid grid-cols-2 gap-4">
                {/* Cost summary */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="text-base font-bold text-right mb-4">ملخص التكلفة</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>{effectiveSubtotal.toFixed(2)} ج.م</span>
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{effectiveDelivery.toFixed(2)} ج.م</span>
                      <span className="text-muted-foreground">رسوم التوصيل</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>{effectiveDiscount.toFixed(2)} ج.م</span>
                      <span>خصم العضوية</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-success font-bold">{effectiveTotal.toFixed(2)} ج.م</span>
                      <span className="font-medium">الاجمالي</span>
                    </div>
                    <button className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
                      <Printer className="h-4 w-4" />
                      <span>طباعة الفاتورة</span>
                    </button>
                  </div>
                </div>

                {/* Customer */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    {order.remaining && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>الوقت المتبقي ({order.remaining})</span>
                        <Hourglass className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <h3 className="text-base font-bold">العميل</h3>
                  </div>
                  <div className="space-y-3 text-sm text-right">
                    <div className="font-bold">{order.customer}</div>
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <span>{order.phone}</span>
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-end gap-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{order.payment === "cash" ? "نقد" : "بطاقة ائتمان"}</span>
                        {order.payment === "cash" ? <Wallet className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span>{order.time}</span>
                        <Clock className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="flex items-start justify-end gap-2 text-muted-foreground">
                      <div className="text-right">
                        <div>{order.address}</div>
                        {order.addressDetail && (
                          <div className="text-xs mt-1">{order.addressDetail}</div>
                        )}
                      </div>
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted">
                        <span>نسخ</span>
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted">
                        <span>عرض على الخريطة</span>
                        <MapIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted">
                      <span>شارك عبر الواتس اب (Whatsapp)</span>
                      <MessageCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between">
              {delivered ? (
                <>
                  <button
                    onClick={() => { setDelivered(false); if (order) onStatusChange(order.orderNo, "on-delivery"); }}
                    className="text-sm text-foreground hover:underline"
                  >
                    الرجوع
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-success text-success-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
                    <Printer className="h-4 w-4" />
                    <span>طباعة الفاتورة</span>
                  </button>
                </>
              ) : onDelivery ? (
                <>
                  <button onClick={() => { if (order) onStatusChange(order.orderNo, "cancelled"); onClose(); }} className="inline-flex items-center gap-2 text-destructive text-sm font-medium hover:underline">
                    <span>إلغاء الطلب</span>
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setOnDelivery(false); if (order) onStatusChange(order.orderNo, "preparing"); }}
                      className="text-sm text-foreground hover:underline"
                    >
                      الرجوع
                    </button>
                    <button
                      onClick={() => { setDelivered(true); if (order) onStatusChange(order.orderNo, "delivered"); }}
                      className="inline-flex items-center gap-2 rounded-lg bg-success text-success-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90"
                    >
                      <Check className="h-4 w-4" />
                      <span>تم التوصيل</span>
                    </button>
                  </div>
                </>
              ) : preparing ? (
                <>
                  <button onClick={() => { if (order) onStatusChange(order.orderNo, "cancelled"); onClose(); }} className="inline-flex items-center gap-2 text-destructive text-sm font-medium hover:underline">
                    <span>إلغاء الطلب</span>
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setPreparing(false); if (order) onStatusChange(order.orderNo, "confirmed"); }}
                      className="text-sm text-foreground hover:underline"
                    >
                      الرجوع
                    </button>
                    <button
                      onClick={() => { setOnDelivery(true); if (order) onStatusChange(order.orderNo, "on-delivery"); }}
                      className="inline-flex items-center gap-2 rounded-lg bg-success text-success-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90"
                    >
                      <Bike className="h-4 w-4" />
                      <span>تم ارساله مع عامل التوصيل</span>
                    </button>
                  </div>
                </>
              ) : confirmedAllAvailable ? (
                <>
                  <button onClick={() => { if (order) onStatusChange(order.orderNo, "cancelled"); onClose(); }} className="inline-flex items-center gap-2 text-destructive text-sm font-medium hover:underline">
                    <span>إلغاء الطلب</span>
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setConfirmed(false);
                        setProposals({});
                        setAltQuantities({});
                        setAcceptedProducts(null);
                        if (order) onStatusChange(order.orderNo, "pending-confirm");
                      }}
                      className="text-sm text-foreground hover:underline"
                    >
                      الرجوع
                    </button>
                    <button
                      onClick={() => { setPreparing(true); if (order) onStatusChange(order.orderNo, "preparing"); }}
                      className="inline-flex items-center gap-2 rounded-lg bg-success text-success-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90"
                    >
                      <Package className="h-4 w-4" />
                      <span>ابدء التجهيز</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => { if (order) onStatusChange(order.orderNo, "cancelled"); onClose(); }} className="inline-flex items-center gap-2 text-destructive text-sm font-medium hover:underline">
                    <span>رفض الطلب</span>
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (confirmed || hasAnyProposal) {
                          setConfirmed(false);
                          setProposals({});
                          setAltQuantities({});
                          setAcceptedProducts(null);
                        } else {
                          onClose();
                        }
                      }}
                      className="text-sm text-foreground hover:underline"
                    >
                      الرجوع
                    </button>
                    <button
                      onClick={() => {
                        if (confirmedWithProposals) {
                          acceptOrder();
                        } else {
                          setConfirmed(true);
                        }
                        if (order) onStatusChange(order.orderNo, "confirmed");
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-success text-success-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>تأكيد الطلب</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <AlternativeDialog
              item={alternativeFor}
              onClose={() => setAlternativeFor(null)}
              onSubmit={(items) => {
                if (alternativeFor) {
                  setProposals((prev) => ({ ...prev, [alternativeFor.name]: items }));
                  if (order) onStatusChange(order.orderNo, "on-hold");
                }
                setAlternativeFor(null);
              }}
            />

          </>
        )}
      </aside>
    </>
  );
}

const alternativeOptions: OrderItem[] = [
  { name: "ادول", qty: 1, price: 15, color: "bg-sky-100" },
  { name: "باندول نايت", qty: 1, price: 15, color: "bg-purple-100" },
  { name: "باندول اكسترا", qty: 1, price: 30, color: "bg-red-100" },
  { name: "باندول صداع نصفي", qty: 1, price: 100, color: "bg-slate-200" },
];

function AlternativeDialog({ item, onClose, onSubmit }: { item: OrderItem | null; onClose: () => void; onSubmit: (items: OrderItem[]) => void }) {
  const open = !!item;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected([]);
    }
  }, [open]);

  if (!open || !item) return null;

  const q = query.trim().toLowerCase();
  const list = alternativeOptions.filter((p) => !q || p.name.toLowerCase().includes(q));
  const toggle = (p: OrderItem) => {
    setSelected((prev) =>
      prev.find((x) => x.name === p.name) ? prev.filter((x) => x.name !== p.name) : [...prev, p],
    );
  };
  const isSelected = (p: OrderItem) => !!selected.find((x) => x.name === p.name);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        dir="rtl"
        className="relative bg-card rounded-2xl shadow-2xl w-[min(680px,92vw)] max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className="text-base font-bold">اقتراح بديل لـ{item.name}</h3>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-x-reverse divide-border overflow-hidden">
          {/* Right: search + list */}
          <div className="flex flex-col overflow-hidden">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="بحث"
                  className="w-full rounded-full border border-border bg-background pr-10 pl-4 py-2.5 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {list.map((p, i) => (
                <button
                  key={i}
                  onClick={() => toggle(p)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors text-right",
                    isSelected(p) && "bg-muted/60 ring-1 ring-success/40",
                  )}
                >
                  <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center shrink-0", p.color)}>
                    <span className="text-[10px] font-bold text-foreground/70">Rx</span>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">شريط</div>
                  </div>
                  <div className="text-sm text-foreground">{p.price.toFixed(2)} ج.م</div>
                </button>
              ))}
            </div>
          </div>

          {/* Left: selected alternatives */}
          <div className="flex flex-col overflow-hidden bg-muted/20">
            <div className="px-5 py-4 text-right">
              <h4 className="text-sm font-bold">البدائل المقترحة</h4>
              <p className="text-xs text-muted-foreground mt-1">اختر على الاقل بديل واحد</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {selected.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg bg-card p-2 border border-border"
                >
                  <button
                    onClick={() => toggle(p)}
                    className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex-1 text-right">
                    <div className="text-sm font-medium">{p.name}</div>
                  </div>
                  <div className={cn("h-9 w-9 rounded-md flex items-center justify-center", p.color)}>
                    <span className="text-[10px] font-bold text-foreground/70">Rx</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-start gap-3">
          <button
            disabled={selected.length === 0}
            onClick={() => onSubmit(selected)}
            className="inline-flex items-center rounded-lg bg-success text-success-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ارسل المقترح للعميل
          </button>

          <button onClick={onClose} className="text-sm text-foreground hover:underline">
            الرجوع
          </button>
        </div>
      </div>
    </div>
  );
}
