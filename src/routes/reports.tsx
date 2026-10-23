import { createFileRoute } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Receipt, Ban, PackageCheck } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SuperAdminAPI } from "@/api";
import type { JsonRecord, Paged } from "@/api/contracts";
import { mapActivity, type Activity } from "@/lib/activity";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير - كبسولة" }] }),
  component: Reports,
});

const months = ["يناير","فبراير","مارس","ابريل","مايو","يونيو","يوليو","اغسطس","سبتمبر","اكتوبر","نوفمبر","ديسمبر"];

const makeDataByRange = () => ({
  "12 شهر": [] as { month: string }[],
  "30 يوم": [] as { month: string }[],
  "7 ايام": [] as { month: string }[],
  "24 ساعة": [] as { month: string }[],
});

const ranges = ["12 شهر", "30 يوم", "7 ايام", "24 ساعة"];

const rangePeriod: Record<string, "Year" | "Month" | "Week" | "Day"> = {
  "12 شهر": "Year",
  "30 يوم": "Month",
  "7 ايام": "Week",
  "24 ساعة": "Day",
};
const statusMap = {
  accepted: { label: "مقبول", variant: "success" as const },
  rejected: { label: "مرفوض", variant: "danger" as const },
  review: { label: "قيد المراجعة", variant: "warning" as const },
};

function Reports() {
  const [active, setActive] = useState("12 شهر");
  const [date, setDate] = useState<Date | undefined>();
  const [overview, setOverview] = useState<JsonRecord | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let current = true;
    SuperAdminAPI.getSuperAdminReport({ period: rangePeriod[active], page: 1, pageSize: 10 })
      .then((response) => {
        if (!current) return;
        setOverview(response);
        const recent = (response.recentActivities ?? {}) as Partial<Paged<JsonRecord>>;
        setActivities((recent.items ?? []).map(mapActivity));
      })
      .catch((error) => {
        if (current) toast.error(error instanceof Error ? error.message : "تعذر تحميل التقارير.");
      });
    return () => {
      current = false;
    };
  }, [active]);

  const selectedYear = date ? date.getFullYear() : new Date().getFullYear();
  const years: [number, number, number] = [selectedYear, selectedYear - 1, selectedYear - 2];
  const dataByRange = makeDataByRange();

  const baseData = dataByRange[active as keyof ReturnType<typeof makeDataByRange>];
  const chartData =
    date && active === "12 شهر"
      ? baseData.filter((_: unknown, i: number) => i <= date.getMonth())
      : baseData;
  return (
    <div>
      <PageHeader
        title="التقارير"
        subtitle="عرض وتصدير التقارير التشغيلية"
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm bg-card hover:bg-muted">
                <CalendarIcon className="h-4 w-4" />
                {date ? format(date, "PPP") : "اختر تاريخ"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        }
      />

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 rounded-xl border border-border p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setActive(r)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm transition-colors",
                  active === r ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold">اداء الصيدليات</h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-end">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-3"></span>{years[2]}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-2"></span>{years[1]}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-1"></span>{years[0]}</span>
            </div>
          </div>
        </div>
        <div className="grid h-72 place-items-center text-sm text-muted-foreground">
          لا توجد بيانات تقارير حقيقية متاحة حالياً.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard label="عدد طلبات تحديث المخزون قيد المراجعة" value={overview?.pendingInventoryRequests ?? "—"} icon={PackageCheck} iconColor="purple" />
        <StatCard label="عدد الطلبات المرفوضة اليوم" value={overview?.rejectedOrders ?? "—"} icon={Ban} iconColor="danger" />
        <StatCard label="عدد الطلبات النشطة" value={overview?.activeOrders ?? "—"} icon={Receipt} iconColor="primary" />
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
            {activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  لا توجد بيانات نشاط حقيقية متاحة حالياً.
                </td>
              </tr>
            ) : activities.map((a, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4">{a.pharmacy}</td>
                <td className="px-6 py-4 text-muted-foreground">{a.reference}</td>
                <td className="px-6 py-4">
                  <StatusBadge variant={statusMap[a.status].variant}>{statusMap[a.status].label}</StatusBadge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{a.time}  {a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
