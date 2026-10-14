import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "قائمة المنتجات المسموح بها - كبسولة" }] }),
  component: Products,
});

function Products() {
  return (
    <div>
      <PageHeader
        title="قائمة المنتجات المسموح بها"
        subtitle="إدارة القائمة الرئيسية للمنتجات المعتمدة للتحقق من بيانات الصيدليات"
        actions={
          <button
            type="button"
            disabled
            title="إدارة قائمة المنتجات المسموحة غير مدعومة من الواجهة الخلفية"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            رفع قائمة منتجات مسموحة
          </button>
        }
      />

      <div
        role="status"
        className="mb-6 rounded-xl border border-border bg-card p-4 text-right text-sm text-muted-foreground"
      >
        غير متاح: لا توجد واجهة خلفية معتمدة لعرض قائمة المنتجات المسموحة أو إضافتها أو تعديلها أو حذفها.
      </div>

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
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                لا يمكن تحميل المنتجات حتى تتوفر واجهة خلفية لقائمة المنتجات المسموحة.
              </td>
            </tr>
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
