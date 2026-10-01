import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronDown, Eye, Ban, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/pharmacies")({
  head: () => ({ meta: [{ title: "الصيدليات - كبسولة" }] }),
  component: Pharmacies,
});

const initialRows = Array.from({ length: 10 }, (_, i) => ({
  name: "صيدلية الشفاء",
  phone: "+201012345678",
  active: i !== 5 && i !== 8,
  date: "05/01/2024",
  time: "14:30",
}));

function Pharmacies() {
  const [rows, setRows] = useState(initialRows);

  const toggleActive = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, active: !r.active } : r)),
    );
    const becomingActive = !rows[index].active;
    toast.success(becomingActive ? "تم إعادة تفعيل الصيدلية" : "تم تعليق الصيدلية");
  };

  const showDetails = (index: number) => {
    toast.info(`تفاصيل: ${rows[index].name}`);
  };

  return (
    <div>
      <PageHeader title="الصيدليات" subtitle="إدارة الصيدليات المسجلة في النظام" />

      <TableShell
        title="قائمة الصيدليات"
        filters={
          <>
            <div className="relative">
              <div className="absolute -top-2.5 right-4 bg-card px-2 text-xs text-muted-foreground">الحالات</div>
              <button className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm bg-card min-w-36 justify-between">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <span>كل الحالات</span>
              </button>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="البحث عن اسم صيدلية..."
                className="rounded-full border border-border bg-card pr-10 pl-4 py-2.5 text-sm w-72 text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-right font-medium px-6 py-3">اسم الصيدلية</th>
              <th className="text-right font-medium px-6 py-3">معلومات الاتصال</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
              <th className="text-right font-medium px-6 py-3">اخر نشاط</th>
              <th className="text-right font-medium px-6 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4">{r.name}</td>
                <td className="px-6 py-4 text-muted-foreground" dir="ltr">{r.phone}</td>
                <td className="px-6 py-4">
                  {r.active ? (
                    <StatusBadge variant="success">نشط</StatusBadge>
                  ) : (
                    <StatusBadge variant="danger">معلقة</StatusBadge>
                  )}
                </td>
                <td className="px-6 py-4 text-muted-foreground">{r.time}  {r.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => showDetails(i)}
                      className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                      تفاصيل
                    </button>
                    {r.active ? (
                      <button
                        onClick={() => toggleActive(i)}
                        className="inline-flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80"
                      >
                        <Ban className="h-4 w-4" />
                        تعليق
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleActive(i)}
                        className="inline-flex items-center gap-1.5 text-sm text-success hover:text-success/80"
                      >
                        <RotateCcw className="h-4 w-4" />
                        إعادة تفعيل
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
