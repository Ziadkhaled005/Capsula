import { createFileRoute } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Receipt, Ban, PackageCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TableShell } from "@/components/DataTable";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير - كبسولة" }] }),
  component: Reports,
});

const ranges = ["12 شهر", "30 يوم", "7 ايام", "24 ساعة"];

function Reports() {
  const [active, setActive] = useState("12 شهر");
  const [date, setDate] = useState<Date | undefined>();

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
          </div>
        </div>
        <div className="h-72 flex items-center justify-center rounded-xl border border-dashed border-border px-6 text-center text-sm text-muted-foreground" role="status">
          غير متاح: لا توجد واجهة خلفية لتقارير الأداء التاريخية أو السلاسل الزمنية لطلبات تحديث المخزون.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard label="عدد طلبات تحديث المخزون قيد المراجعة" value="غير متاح" icon={PackageCheck} iconColor="purple" />
        <StatCard label="عدد الطلبات المرفوضة اليوم" value="غير متاح" icon={Ban} iconColor="danger" />
        <StatCard label="عدد الطلبات النشطة" value="غير متاح" icon={Receipt} iconColor="primary" />
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
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground" role="status">
                غير متاح: لا توجد واجهة خلفية لسجل الأنشطة وطلبات تحديث المخزون.
              </td>
            </tr>
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
