import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardAPI, InventoryAPI } from "@/api";
import type { JsonRecord, Paged } from "@/api/contracts";
import { mapActivity, type Activity } from "@/lib/activity";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم - كبسولة" },
      { name: "description", content: "نظرة عامة على نشاط الصيدليات ومراجعة تحديثات المخزون" },
    ],
  }),
  component: Dashboard,
});

const PAGE_SIZE = 10;

const statusVariant = {
  accepted: "success",
  rejected: "danger",
  review: "warning",
} as const;

const metrics = [
  {
    id: "active-orders",
    label: "الطلبات النشطة",
    value: "—",
    note: "تظهر بعد ربط واجهة API الحقيقية",
    icon: ClipboardCheck,
    tone: "teal",
  },
  {
    id: "rejected-requests",
    label: "طلبات تحديث مرفوضة",
    value: "—",
    note: "تظهر بعد ربط واجهة API الحقيقية",
    icon: ShieldAlert,
    tone: "rose",
  },
  {
    id: "pending-updates",
    label: "تحديثات مخزون بانتظار المراجعة",
    value: "—",
    note: "تظهر بعد ربط واجهة API الحقيقية",
    icon: PackageCheck,
    tone: "amber",
  },
] as const;

function Dashboard() {
  const [page, setPage] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let current = true;
    Promise.all([
      DashboardAPI.getSuperAdminDashboard({ page, pageSize: PAGE_SIZE }),
      InventoryAPI.getInventoryRequests({ status: "Rejected", page: 1, pageSize: 1 }),
    ])
      .then(([dashboard, rejected]) => {
        if (!current) return;
        const recent = (dashboard.recentActivities ?? {}) as Partial<Paged<JsonRecord>>;
        setValues({
          "active-orders": String(dashboard.activeOrders ?? 0),
          "rejected-requests": String(rejected.totalCount ?? 0),
          "pending-updates": String(dashboard.pendingInventoryRequests ?? 0),
        });
        setActivities((recent.items ?? []).map(mapActivity));
        setTotal(recent.totalCount ?? 0);
      })
      .catch((error) => {
        if (current) toast.error(error instanceof Error ? error.message : "تعذر تحميل لوحة التحكم.");
      });
    return () => {
      current = false;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-7" dir="rtl" data-testid="page-dashboard">
      <header className="text-right" data-testid="section-welcome">
        <h1 className="text-2xl font-bold tracking-tight text-[#293b31] sm:text-[30px]" data-testid="text-welcome-heading">
          مرحباً بك في لوحة التحكم
        </h1>
        <p className="mt-2 text-sm text-[#829087] sm:text-base" data-testid="text-welcome-subheading">
          نظرة سريعة على العمليات
        </p>
      </header>

      <section aria-labelledby="overview-title" data-testid="section-overview">
        <h2 id="overview-title" className="sr-only">ملخص لوحة التحكم</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const toneClass = {
              teal: "bg-[#e7f2ec] text-[#3d7956] ring-[#d6e9dd]",
              rose: "bg-[#f8eae8] text-[#b36c60] ring-[#f0d8d4]",
              amber: "bg-[#f7f0df] text-[#a5853f] ring-[#eee3c6]",
            }[metric.tone];
            return (
              <article
                key={metric.id}
                className="group relative flex min-h-[154px] flex-col justify-between overflow-hidden rounded-2xl border border-[#e5e9e4] bg-[#fffefa] p-5 shadow-[0_3px_12px_rgba(34,57,43,0.025)] transition-transform duration-200 hover:-translate-y-0.5 sm:p-6"
                data-testid={`card-metric-${metric.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${toneClass}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-medium text-[#9aa69e]">هذا اليوم</span>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#69776e]" data-testid={`text-metric-label-${metric.id}`}>{metric.label}</p>
                    <p className="mt-1 text-xs text-[#a0aaa3]">{metric.note}</p>
                  </div>
                  <p className="font-mono text-[32px] font-bold leading-none tracking-tight text-[#2e4939]" data-testid={`text-metric-value-${metric.id}`}>
                    {values[metric.id] ?? metric.value}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-5" data-testid="section-dashboard-content">
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#e5e9e4] bg-[#fffefa] shadow-sm">
          <div className="border-b border-[#edf0ec] px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-[#293b31]" data-testid="text-activity-title">الأنشطة الأخيرة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <thead>
                <tr className="border-b border-[#edf0ec] bg-[#fafbf8] text-xs font-medium text-[#8b978f]">
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">اسم الصيدلية</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">نوع النشاط</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">الحالة</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      لا توجد بيانات نشاط حقيقية متاحة حالياً.
                    </td>
                  </tr>
                ) : activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-[#f0f2ef] last:border-0 hover:bg-[#fbfcfa]"
                    data-testid={`row-activity-${activity.id}`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#3c4c42]" data-testid={`text-pharmacy-${activity.id}`}>
                      {activity.pharmacy}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#738078]">{activity.reference}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge variant={statusVariant[activity.status]}>{activity.label}</StatusBadge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#849087]" dir="ltr">
                      {activity.time} <span className="mx-1 text-[#c2cbc4]">|</span> {activity.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[#edf0ec] px-5 py-3 text-xs text-[#7f8c83] sm:px-6">
            <span className="flex items-center gap-2">
              <span>الصفوف في الصفحة</span>
              <span className="font-medium text-[#405448]">10</span>
            </span>
            <div className="flex items-center gap-4">
            <span>{total === 0 ? 0 : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)}`} من {total}</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="الصفحة السابقة" className="flex h-7 w-7 items-center justify-center rounded-md text-[#aab3ac] disabled:cursor-not-allowed">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="الصفحة التالية" className="flex h-7 w-7 items-center justify-center rounded-md text-[#aab3ac] disabled:cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-[#e5e9e4] bg-[#fffefa] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6" aria-labelledby="quick-actions-title" data-testid="section-quick-actions">
          <h2 id="quick-actions-title" className="shrink-0 text-lg font-semibold text-[#293b31]">إجراءات سريعة</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/requests"
              className="group inline-flex items-center gap-2 rounded-full bg-[#477d64] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#35674f] sm:text-sm"
              data-testid="link-quick-requests"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              <span>الانتقال إلى طلبات تحديث المخزون</span>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              to="/products"
              className="group inline-flex items-center gap-2 rounded-full border border-[#d9e8df] bg-[#f4f8f4] px-4 py-2.5 text-xs font-semibold text-[#477d64] transition-colors hover:bg-[#e8f2eb] sm:text-sm"
              data-testid="link-quick-products"
            >
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              <span>الانتقال إلى قائمة المنتجات المسموح بها</span>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}