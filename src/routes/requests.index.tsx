import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { InventoryAPI } from "@/api";
import type { JsonRecord } from "@/api/contracts";
import { formatDateTime } from "@/lib/datetime";
import { checkMap, requestStatusMap } from "@/lib/inventory-requests";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const PAGE_SIZE = 10;

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
  const navigate = useNavigate();
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
    InventoryAPI.getInventoryRequests({ search: debouncedSearch.trim() || undefined, page, pageSize: PAGE_SIZE })
      .then((response) => {
        if (!current) return;
        setRows(response.items ?? []);
        setTotal(response.totalCount ?? 0);
      })
      .catch((error) => {
        if (current) toast.error(error instanceof Error ? error.message : "تعذر تحميل الطلبات.");
      });
    return () => {
      current = false;
    };
  }, [debouncedSearch, page]);

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="البحث عن اسم الصيدلية..."
                className="rounded-full border border-border bg-card pr-10 pl-4 py-2.5 text-sm w-64 text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              <th className="text-right font-medium px-6 py-3">التاريخ و الوقت</th>
              <th className="text-right font-medium px-6 py-3">عدد المنتجات</th>
              <th className="text-right font-medium px-6 py-3">نتيجة التحقق الالي</th>
              <th className="text-right font-medium px-6 py-3">نوع النشاط</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  لا توجد بيانات طلبات حقيقية متاحة حالياً.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const check = checkMap[r.validationResult as keyof typeof checkMap] ?? checkMap.AllAllowed;
                const state = requestStatusMap[r.status as keyof typeof requestStatusMap] ?? requestStatusMap.Pending;
                return (
                  <tr
                    key={r.id}
                    onClick={() => navigate({ to: "/requests/$id", params: { id: String(r.id) } })}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-6 py-4">{r.pharmacyName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDateTime(r.createdDate)}</td>
                    <td className="px-6 py-4">{r.totalRows ?? 0}</td>
                    <td className="px-6 py-4">
                      <StatusBadge variant={check.variant}>{check.label}</StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">طلب تحديث مخزون</td>
                    <td className="px-6 py-4">
                      <StatusBadge variant={state.variant}>{state.label}</StatusBadge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
