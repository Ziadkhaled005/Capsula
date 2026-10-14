import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";

export const Route = createFileRoute("/requests/")({
  head: () => ({
    meta: [{ title: "طلبات تحديث المخزون - كبسولة" }],
  }),
  component: Requests,
});

function FilterPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative">
      <div className="absolute -top-2.5 right-4 bg-card px-2 text-xs text-muted-foreground">{label}</div>
      <button className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm bg-card min-w-36 justify-between">
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
        <span>{value}</span>
      </button>
    </div>
  );
}

function Requests() {
  return (
    <div>
      <PageHeader
        title="طلبات تحديث المخزون"
        subtitle="إدارة ومراجعة طلبات تحديث المحتوى المقدمة من الصيدليات"
      />

      <TableShell
        title="قائمة الطلبات"
        filters={
          <>
            <FilterPill label="النتائج" value="كل النتائج" />
            <FilterPill label="الحالات" value="كل الحالات" />
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="البحث عن اسم الصيدلية..."
                className="rounded-full border border-border bg-card pr-10 pl-4 py-2.5 text-sm w-64 text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-right font-medium px-6 py-3">اسم الصيدلية</th>
              <th className="text-right font-medium px-6 py-3">التاريخ و الوقت</th>
              <th className="text-right font-medium px-6 py-3">عدد المنتجات</th>
              <th className="text-right font-medium px-6 py-3">نتيجة التحقق الالي</th>
              <th className="text-right font-medium px-6 py-3">نوع النشاط</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                غير متاح: لا توجد واجهة خلفية لجلب طلبات تحديث المخزون وحالاتها ونتائج التحقق.
              </td>
            </tr>
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
