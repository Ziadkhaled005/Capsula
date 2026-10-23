import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { SuperAdminAPI } from "@/api";
import type { JsonRecord } from "@/api/contracts";
import { formatDateTime } from "@/lib/datetime";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/pharmacies")({
  head: () => ({ meta: [{ title: "الصيدليات - كبسولة" }] }),
  component: Pharmacies,
});

function Pharmacies() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<JsonRecord[]>([]);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let current = true;
    SuperAdminAPI.getPharmacies({ search: debouncedSearch.trim() || undefined, page, pageSize: PAGE_SIZE })
      .then((response) => {
        if (!current) return;
        setRows(response.items ?? []);
        setTotal(response.totalCount ?? 0);
      })
      .catch((error) => {
        if (current) toast.error(error instanceof Error ? error.message : "تعذر تحميل الصيدليات.");
      });
    return () => {
      current = false;
    };
  }, [debouncedSearch, page]);

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="البحث عن اسم صيدلية..."
                className="rounded-full border border-border bg-card pr-10 pl-4 py-2.5 text-sm w-72 text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        }
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  لا توجد بيانات صيدليات حقيقية متاحة حالياً.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-4">{r.name}</td>
                  <td className="px-6 py-4 text-muted-foreground" dir="ltr">{r.phone || "—"}</td>
                  <td className="px-6 py-4">
                    {r.isActive ? (
                      <StatusBadge variant="success">نشط</StatusBadge>
                    ) : (
                      <StatusBadge variant="danger">معلقة</StatusBadge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDateTime(r.lastActivityAt)}</td>
                  <td className="px-6 py-4" />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
