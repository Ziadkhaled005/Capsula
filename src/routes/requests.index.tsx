import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ChevronDown, Eye } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { getDecision, getCheck, useDecisionsVersion } from "@/lib/requestsStore";

export const Route = createFileRoute("/requests/")({
  head: () => ({
    meta: [{ title: "طلبات تحديث المخزون - كبسولة" }],
  }),
  component: Requests,
});

const rows = [
  { pharmacy: "صيدلية الشفاء", date: "05/01/2024", time: "14:30", count: 332, check: "all-allowed", status: "accepted" },
  { pharmacy: "صيدلية الشفاء", date: "05/01/2024", time: "14:30", count: 332, check: "all-allowed", status: "accepted" },
  { pharmacy: "صيدلية الشفاء", date: "05/01/2024", time: "14:30", count: 332, check: "not-allowed", status: "rejected" },
  { pharmacy: "صيدلية الشفاء", date: "05/01/2024", time: "14:30", count: 332, check: "all-allowed", status: "review" },
  { pharmacy: "صيدلية الشفاء", date: "05/01/2024", time: "14:30", count: 332, check: "all-allowed", status: "review" },
] as const;

const checkMap = {
  "all-allowed": { label: "جميع المنتجات مسموحة", variant: "success" as const },
  "not-allowed": { label: "منتجات غير مسموحة", variant: "danger" as const },
};
const statusMap = {
  accepted: { label: "مقبول", variant: "success" as const },
  rejected: { label: "مرفوض", variant: "danger" as const },
  review: { label: "قيد المراجعة", variant: "warning" as const },
};

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
  useDecisionsVersion();
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
            {rows.map((r, i) => {
              const id = String(i + 1);
              const override = getDecision(id);
              const status = override ?? r.status;
              const checkOverride = getCheck(id);
              const check = checkOverride ?? r.check;
              return (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4">{r.pharmacy}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.time}  {r.date}</td>
                <td className="px-6 py-4">{r.count}</td>
                <td className="px-6 py-4">
                  <StatusBadge variant={checkMap[check].variant}>{checkMap[check].label}</StatusBadge>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge variant={statusMap[status].variant}>{statusMap[status].label}</StatusBadge>
                </td>
                <td className="px-6 py-4">
                  <Link to="/requests/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary">
                    <Eye className="h-4 w-4" />
                    مراجعة الطلب
                  </Link>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
