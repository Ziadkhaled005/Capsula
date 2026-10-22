import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Ban, PackageCheck, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useReportsOverview, usePharmacyPerformance, formatDateTime } from "@/hooks";
import { SuperAdminAPI } from "@/api";
import { getApiErrorMessage } from "@/api/client";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير - كبسولة" }] }),
  component: Reports,
});

const RANGES: { label: string; period: "Day" | "Week" | "Month" | "Year" }[] = [
  { label: "24 ساعة", period: "Day" },
  { label: "7 ايام", period: "Week" },
  { label: "30 يوم", period: "Month" },
  { label: "12 شهر", period: "Year" },
];

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function Reports() {
  const [active, setActive] = useState<(typeof RANGES)[number]>(RANGES[3]);
  const year = new Date().getFullYear();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: overview, isLoading } = useReportsOverview({ period: active.period });
  const { data: performance } = usePharmacyPerformance(year);

  const exportReport = () => {
    setExporting(true);
    setExportError(null);
    SuperAdminAPI.exportPharmacyPerformance(year)
      .catch((error) => setExportError(getApiErrorMessage(error, "تعذر تصدير التقرير.")))
      .finally(() => setExporting(false));
  };

  const topPharmacy = performance?.[0];
  const maxSales = Math.max(1, ...(topPharmacy?.monthlySales ?? [1]));
  const maxOrders = Math.max(1, ...(topPharmacy?.monthlyOrders ?? [1]));

  return (
    <div>
      <PageHeader
        title="التقارير"
        subtitle="عرض وتصدير التقارير التشغيلية"
        actions={
          <button
            type="button"
            onClick={exportReport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm bg-card hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? "جاري التصدير..." : "تصدير تقرير الأداء"}
          </button>
        }
      />

      {exportError && <p className="mb-4 text-sm text-destructive">{exportError}</p>}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border p-1">
            {RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setActive(range)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm transition-colors",
                  active.label === range.label
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold">اداء الصيدليات — {year}</h3>
          </div>
        </div>

        <div
          className="rounded-xl border border-border p-4 overflow-x-auto"
          role="status"
          aria-busy={isLoading}
        >
          {!performance?.length && (
            <div className="h-72 flex items-center justify-center text-center text-sm text-muted-foreground">
              {isLoading ? "جاري التحميل..." : "لا توجد بيانات أداء لهذه الفترة."}
            </div>
          )}
          {!!performance?.length && (
            <div className="space-y-6 min-w-[640px]">
              {performance.map((pharmacy) => (
                <div key={pharmacy.pharmacyId}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      إجمالي المبيعات: {Number(pharmacy.totalSales ?? 0).toFixed(2)} · الطلبات:{" "}
                      {pharmacy.totalOrders ?? 0}
                    </span>
                    <span className="text-sm font-medium">{pharmacy.pharmacyName}</span>
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {MONTHS.map((month, index) => {
                      const sales = Number(pharmacy.monthlySales?.[index] ?? 0);
                      const orders = Number(pharmacy.monthlyOrders?.[index] ?? 0);
                      return (
                        <div
                          key={month}
                          className="flex-1 flex flex-col items-center gap-1"
                          title={`${month}: مبيعات ${sales.toFixed(2)} · طلبات ${orders}`}
                        >
                          <div className="w-full flex items-end justify-center gap-0.5 h-16">
                            <div
                              className="w-1/3 bg-primary/70 rounded-t"
                              style={{ height: `${(orders / maxOrders) * 100}%` }}
                            />
                            <div
                              className="w-1/3 bg-primary rounded-t"
                              style={{ height: `${(sales / maxSales) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {month.slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard
          label="عدد طلبات تحديث المخزون قيد المراجعة"
          value={overview?.pendingInventoryRequests ?? (isLoading ? "..." : 0)}
          icon={PackageCheck}
          iconColor="purple"
        />
        <StatCard
          label="عدد الطلبات المرفوضة اليوم"
          value={overview?.rejectedOrders ?? (isLoading ? "..." : 0)}
          icon={Ban}
          iconColor="danger"
        />
        <StatCard
          label="عدد الطلبات النشطة"
          value={overview?.activeOrders ?? (isLoading ? "..." : 0)}
          icon={Receipt}
          iconColor="primary"
        />
      </div>

      <TableShell title="الأنشطة الاخيرة">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-right font-medium px-6 py-3">اسم الصيدلية</th>
              <th className="text-right font-medium px-6 py-3">نوع النشاط</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
              <th className="text-right font-medium px-6 py-3">التاريخ و الوقت</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {!isLoading && (overview?.recentActivities ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                  لا توجد أنشطة لعرضها.
                </td>
              </tr>
            )}
            {(overview?.recentActivities ?? []).map((activity) => (
              <tr
                key={`${activity.requestId}-${activity.date}`}
                className="border-b border-border last:border-0"
              >
                <td className="px-6 py-4 text-right font-medium">{activity.pharmacyName}</td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {activity.activityType === "InventoryUpdate"
                    ? "تحديث المخزون"
                    : activity.activityType}
                </td>
                <td className="px-6 py-4 text-right">
                  <StatusBadge
                    variant={
                      activity.status === "Approved"
                        ? "success"
                        : activity.status === "Rejected"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {activity.status === "Pending"
                      ? "قيد المراجعة"
                      : activity.status === "Approved"
                        ? "مقبول"
                        : activity.status === "Rejected"
                          ? "مرفوض"
                          : activity.status}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {formatDateTime(activity.date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
