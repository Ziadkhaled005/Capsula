import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt, Ban, PackageCheck, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/pharmacy/")({
  head: () => ({
    meta: [{ title: "لوحة التحكم - كبسولة" }],
  }),
  component: Dashboard,
});

const activities = [
  {
    pharmacy: "صيدلية الشفاء",
    type: "تحديث مخزون",
    status: "accepted",
    date: "05/01/2024",
    time: "14:30",
  },
  {
    pharmacy: "صيدلية الشفاء",
    type: "تحديث مخزون",
    status: "accepted",
    date: "05/01/2024",
    time: "14:30",
  },
  {
    pharmacy: "صيدلية الشفاء",
    type: "تحديث مخزون",
    status: "rejected",
    date: "05/01/2024",
    time: "14:30",
  },
  {
    pharmacy: "صيدلية الشفاء",
    type: "تحديث مخزون",
    status: "review",
    date: "05/01/2024",
    time: "14:30",
  },
  {
    pharmacy: "صيدلية الشفاء",
    type: "تحديث مخزون",
    status: "review",
    date: "05/01/2024",
    time: "14:30",
  },
] as const;

const statusMap = {
  accepted: { label: "مقبول", variant: "success" as const },
  rejected: { label: "مرفوض", variant: "danger" as const },
  review: { label: "قيد المراجعة", variant: "warning" as const },
};

function Dashboard() {
  return (
    <div>
      <PageHeader title="مرحباً بك في لوحة التحكم" subtitle="نظرة سريعة على العمليات" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="عدد طلبات تحديث المخزون قيد المراجعة"
          value={12}
          icon={PackageCheck}
          iconColor="purple"
        />
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
                <td className="px-6 py-4 text-foreground">{a.pharmacy}</td>
                <td className="px-6 py-4 text-muted-foreground">{a.type}</td>
                <td className="px-6 py-4">
                  <StatusBadge variant={statusMap[a.status].variant}>
                    {statusMap[a.status].label}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {a.time} {a.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mt-6">
        <h3 className="text-lg font-semibold text-right mb-5">إجراءات سريعة</h3>
        <div className="flex items-center gap-3 justify-end flex-wrap">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
            الانتقال الى قائمة المنتجات المسموح بها
          </Link>
          <Link
            to="/requests"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            <ChevronLeft className="h-4 w-4" />
            الانتقال الى طلبات تحديث المخزون
          </Link>
        </div>
      </div>
    </div>
  );
}
