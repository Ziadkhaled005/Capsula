import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronDown, Pencil, Trash2, Upload, Check, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { getCheck, toggleCheck } from "@/lib/requestsStore";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "قائمة المنتجات المسموح بها - كبسولة" }] }),
  component: Products,
});

type Product = { id: number; name: string; code: string; cat: string; active: boolean };

const initialRows: Product[] = [
  { id: 1, name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", active: true },
  { id: 2, name: "صيدلية د. عبد الرحمن ابراهيم", code: "MED-001", cat: "مسكنات", active: true },
  { id: 3, name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", active: false },
  { id: 4, name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", active: true },
  { id: 5, name: "صيدلية د. عبد الرحمن ابراهيم", code: "MED-001", cat: "مسكنات", active: true },
];

const PAGE_SIZE = 3;

function Products() {
  const [rows, setRows] = useState<Product[]>(initialRows);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Product | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const startEdit = (r: Product) => {
    setEditingId(r.id);
    setDraft({ ...r });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    cancelEdit();
  };

  const deleteRow = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div>
      <PageHeader
        title="قائمة المنتجات المسموح بها"
        subtitle="إدارة القائمة الرئيسية للمنتجات المعتمدة للتحقق من بيانات الصيدليات"
        actions={
          <button
            onClick={() => {
              const current = getCheck("2") ?? "all-allowed";
              const next = toggleCheck("2", current);
              toast.success(
                next === "all-allowed"
                  ? "تم تحديث الطلب الثاني: جميع المنتجات مسموحة"
                  : "تم تحديث الطلب الثاني: منتجات غير مسموحة",
              );
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm"
          >
            <Upload className="h-4 w-4" />
            رفع قائمة منتجات مسموحة
          </button>
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
                placeholder="البحث عن اسم المنتج أو الكود..."
                className="rounded-full border border-border bg-card pr-10 pl-4 py-2.5 text-sm w-72 text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        }
        pagination={{
          page: currentPage,
          pageSize: PAGE_SIZE,
          total: rows.length,
          onPageChange: setPage,
        }}
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
            {pagedRows.map((r) => {
              const isEditing = editingId === r.id && draft;
              return (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        value={draft!.name}
                        onChange={(e) => setDraft({ ...draft!, name: e.target.value })}
                        className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-right focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      r.name
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {isEditing ? (
                      <input
                        value={draft!.code}
                        onChange={(e) => setDraft({ ...draft!, code: e.target.value })}
                        className="w-32 border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-right focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      r.code
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        value={draft!.cat}
                        onChange={(e) => setDraft({ ...draft!, cat: e.target.value })}
                        className="w-32 border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-right focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      r.cat
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        value={draft!.active ? "1" : "0"}
                        onChange={(e) => setDraft({ ...draft!, active: e.target.value === "1" })}
                        className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-right focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="1">مفعل</option>
                        <option value="0">موقوف</option>
                      </select>
                    ) : r.active ? (
                      <StatusBadge variant="success">مفعل</StatusBadge>
                    ) : (
                      <StatusBadge variant="danger">موقوف</StatusBadge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="inline-flex items-center gap-1.5 text-sm text-success hover:opacity-80"
                          >
                            <Check className="h-4 w-4" />
                            حفظ
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(r)}
                            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                            تعديل
                          </button>
                          <button
                            onClick={() => deleteRow(r.id)}
                            className="inline-flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  لا توجد منتجات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
