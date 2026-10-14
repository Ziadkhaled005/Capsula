import { createFileRoute } from "@tanstack/react-router";
import { Download, AlertTriangle, Check, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({ meta: [{ title: "تفاصيل طلب تحديث المخزون - كبسولة" }] }),
  component: RequestDetail,
});

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function RequestDetail() {
  return (
    <div>
      <PageHeader
        title="تفاصيل طلب تحديث المخزون"
        subtitle="مراجعة والتحقق من بيانات المخزون المرفوعة"
        actions={
          <div className="flex items-center gap-3" title="إدارة قائمة المنتجات المسموحة غير مدعومة من الواجهة الخلفية">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              رفع قائمة منتجات مسموحة
            </button>
          </div>
        }
      />

      {/* Request info card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            disabled
            title="لا تتوفر بيانات الطلب أو ملفه للتنزيل"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            تحميل الملف
          </button>
          <h3 className="text-lg font-semibold">معلومات الطلب</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <InfoCell label="رقم الطلب" value="غير متاح" />
          <InfoCell label="تاريخ ووقت الرفع" value="غير متاح" />
          <InfoCell label="اسم الصيدلية" value="غير متاح" />
        </div>
        <p role="status" className="mt-5 text-right text-sm text-muted-foreground">
          غير متاح: لا توجد واجهة خلفية لجلب تفاصيل طلب تحديث المخزون أو الملف المرفوع.
        </p>
      </div>

      <div role="status" className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-end gap-2 text-right text-muted-foreground">
          <h3 className="text-lg font-semibold">نتيجة التحقق الالي</h3>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="mt-4 text-right text-sm text-muted-foreground">
          غير متاح: لا توجد واجهة خلفية لنتائج التحقق أو تفاصيل المنتجات المرفوعة.
        </p>
      </div>

      <TableShell title="جدول التحقق من المنتجات">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-right font-medium px-6 py-3">اسم المنتج المرفوع</th>
              <th className="text-right font-medium px-6 py-3">الكود</th>
              <th className="text-right font-medium px-6 py-3">التصنيف</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
              <th className="text-right font-medium px-6 py-3">سبب عدم المطابقة</th>
              <th className="text-right font-medium px-6 py-3">ملاحظات داخلية</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                لا توجد بيانات تحقق لعرضها؛ واجهة تفاصيل الطلب ونتائج التحقق غير متاحة من الخلفية.
              </td>
            </tr>
          </tbody>
        </table>
      </TableShell>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mt-6">
        <h3 className="text-lg font-semibold text-right mb-5">قرار المراجعة</h3>
        <p role="status" className="mb-4 text-right text-sm text-muted-foreground">
          غير متاح: لا توجد واجهة خلفية لحفظ قرار قبول الطلب أو رفضه.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
            رفض التحديث
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            قبول التحديث
          </button>
        </div>
      </div>
    </div>
  );
}
