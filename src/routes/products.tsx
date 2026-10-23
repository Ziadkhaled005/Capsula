import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { SuperAdminAPI } from "@/api";
import type { JsonRecord } from "@/api/contracts";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "قائمة المنتجات المسموح بها - كبسولة" }] }),
  component: Products,
});

function Products() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<JsonRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let current = true;
    SuperAdminAPI.getAllowedProducts({ search: debouncedSearch.trim() || undefined, page, pageSize: PAGE_SIZE })
      .then((response) => {
        if (!current) return;
        setRows(response.items ?? []);
        setTotal(response.totalCount ?? 0);
      })
      .catch((error) => {
        if (current) toast.error(error instanceof Error ? error.message : "تعذر تحميل المنتجات.");
      });
    return () => {
      current = false;
    };
  }, [debouncedSearch, page, reloadKey]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const result = await SuperAdminAPI.uploadAllowedProducts(file);
      const failedRows: JsonRecord[] = result.failedRows ?? [];
      toast.success(
        `تم رفع القائمة: ${result.createdCount ?? 0} جديد، ${result.updatedCount ?? 0} محدث، ${result.failedCount ?? 0} فشل`,
        {
          description: failedRows
            .slice(0, 5)
            .map((row) => `صف ${row.rowNumber}${row.code ? ` (${row.code})` : ""}: ${row.reason}`)
            .join(" · "),
        },
      );
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع قائمة المنتجات.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="قائمة المنتجات المسموح بها"
        subtitle="إدارة القائمة الرئيسية للمنتجات المعتمدة للتحقق من بيانات الصيدليات"
        actions={
          <>
          <button
            type="button"
            disabled={uploading}
            onClick={() => uploadRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm"
          >
            <Upload className="h-4 w-4" />
            رفع قائمة منتجات مسموحة
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
          </>
        }
      />

      <TableShell
        title="المنتجات المعتمدة"
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
                placeholder="البحث عن اسم المنتج أو الكود..."
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
              <th className="text-right font-medium px-6 py-3">اسم المنتج</th>
              <th className="text-right font-medium px-6 py-3">الكود</th>
              <th className="text-right font-medium px-6 py-3">التصنيف</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
              <th className="text-right font-medium px-6 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  لا توجد بيانات منتجات حقيقية متاحة حالياً.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.productId ?? r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-4">{r.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.code}</td>
                  <td className="px-6 py-4">{r.categoryName ?? "—"}</td>
                  <td className="px-6 py-4">
                    {r.isActive ? (
                      <StatusBadge variant="success">مفعل</StatusBadge>
                    ) : (
                      <StatusBadge variant="danger">موقوف</StatusBadge>
                    )}
                  </td>
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
