import { createFileRoute } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Receipt, Ban, PackageCheck } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير - كبسولة" }] }),
  component: Reports,
});

const months = ["يناير","فبراير","مارس","ابريل","مايو","يونيو","يوليو","اغسطس","سبتمبر","اكتوبر","نوفمبر","ديسمبر"];

const buildSeries = (labels: string[], years: [number, number, number]) =>
  labels.map((label, i) => ({
    month: label,
    [String(years[0])]: 80 - i * 4 + (i % 3) * 6,
    [String(years[1])]: 60 - i * 2 + (i % 4) * 4,
    [String(years[2])]: 40 - i + (i % 2) * 3,
  }));

const daysLabels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
const weekLabels = ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];
const hoursLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const makeDataByRange = (years: [number, number, number]) => ({
  "12 شهر": buildSeries(months, years),
  "30 يوم": buildSeries(daysLabels, years),
  "7 ايام": buildSeries(weekLabels, years),
  "24 ساعة": buildSeries(hoursLabels, years),
});

const ranges = ["12 شهر", "30 يوم", "7 ايام", "24 ساعة"];

const activities = [
  { pharmacy: "صيدلية الشفاء", type: "تحديث مخزون", status: "accepted" as const },
  { pharmacy: "صيدلية الشفاء", type: "تحديث مخزون", status: "accepted" as const },
  { pharmacy: "صيدلية الشفاء", type: "تحديث مخزون", status: "rejected" as const },
  { pharmacy: "صيدلية الشفاء", type: "تحديث مخزون", status: "review" as const },
  { pharmacy: "صيدلية الشفاء", type: "تحديث مخزون", status: "review" as const },
];
const statusMap = {
  accepted: { label: "مقبول", variant: "success" as const },
  rejected: { label: "مرفوض", variant: "danger" as const },
  review: { label: "قيد المراجعة", variant: "warning" as const },
};

function Reports() {
  const [active, setActive] = useState("12 شهر");
  const [date, setDate] = useState<Date | undefined>();

  const selectedYear = date ? date.getFullYear() : new Date().getFullYear();
  const years: [number, number, number] = [selectedYear, selectedYear - 1, selectedYear - 2];
  const dataByRange = makeDataByRange(years);

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
        <div className="h-72" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} reversed />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey={String(years[0])} stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey={String(years[1])} stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey={String(years[2])} stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="2 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard label="عدد طلبات تحديث المخزون قيد المراجعة" value={12} icon={PackageCheck} iconColor="purple" />
        <StatCard label="عدد الطلبات المرفوضة اليوم" value={3} icon={Ban} iconColor="danger" />
        <StatCard label="عدد الطلبات النشطة" value={0} icon={Receipt} iconColor="primary" />
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
            {activities.map((a, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4">{a.pharmacy}</td>
                <td className="px-6 py-4 text-muted-foreground">{a.type}</td>
                <td className="px-6 py-4">
                  <StatusBadge variant={statusMap[a.status].variant}>{statusMap[a.status].label}</StatusBadge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">14:30  05/01/2024</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
