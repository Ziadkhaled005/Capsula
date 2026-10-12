import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, AlertTriangle, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TableShell } from "@/components/DataTable";
import { setDecision as saveDecision, getCheck, toggleCheck } from "@/lib/requestsStore";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({ meta: [{ title: "تفاصيل طلب تحديث المخزون - كبسولة" }] }),
  component: RequestDetail,
});

const products = [
  { name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", status: "match" },
  { name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", status: "match" },
  { name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", status: "match" },
  { name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", status: "mismatch", reason: "تصنيف غير مسموح" },
  { name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", status: "mismatch", reason: "تصنيف غير مسموح" },
  { name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", status: "match" },
  { name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", status: "match" },
  { name: "صيدلية الشفاء", code: "MED-001", cat: "مسكنات", status: "match" },
] as const;

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function RequestDetail() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [decision, setDecisionState] = useState<"accepted" | "rejected" | null>(null);

  const handleDownload = () => {
    const rows = products.map((p) => ({
      "اسم المنتج": p.name,
      "الكود": p.code,
      "التصنيف": p.cat,
      "الحالة": p.status === "match" ? "مطابق" : "غير مطابق",
      "سبب عدم المطابقة": p.status === "mismatch" ? p.reason : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المنتجات");
    XLSX.writeFile(wb, "Inventory_nahda_jan2024.xlsx");
  };

  const handleAccept = () => {
    setDecisionState("accepted");
    saveDecision(id, "accepted");
    toast.success("تم قبول التحديث بنجاح");
    setTimeout(() => navigate({ to: "/requests" }), 1000);
  };

  const handleReject = () => {
    setDecisionState("rejected");
    saveDecision(id, "rejected");
    toast.error("تم رفض التحديث");
    setTimeout(() => navigate({ to: "/requests" }), 1000);
  };

  return (
    <div>
      <PageHeader
        title="تفاصيل طلب تحديث المخزون"
        subtitle="مراجعة والتحقق من بيانات المخزون المرفوعة"
        actions={
          <div className="flex items-center gap-3">
            {decision && (
              <StatusBadge variant={decision === "accepted" ? "success" : "danger"}>
                {decision === "accepted" ? "مقبول" : "مرفوض"}
              </StatusBadge>
            )}
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
              رفع قائمة منتجات مسموحة
            </button>
          </div>
        }
      />

      {/* Request info card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            تحميل الملف
          </button>
          <h3 className="text-lg font-semibold">معلومات الطلب</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <InfoCell label="اسم ملف Excel" value="Inventory_nahda_jan2024.xlsx" />
          <InfoCell label="تاريخ و وقت الرفع" value="03:33  2025-01-15" />
          <InfoCell label="اسم الصيدلية" value="صيدلية النهضة" />
        </div>
      </div>

      {/* Verification card */}
      {(() => {
        const tone =
          decision === "accepted"
            ? { wrap: "bg-success/5 border-success/30", text: "text-success", btn: "bg-success text-success-foreground", msg: "تم قبول التحديث" }
            : decision === "rejected"
            ? { wrap: "bg-destructive/5 border-destructive/30", text: "text-destructive", btn: "bg-destructive text-destructive-foreground", msg: "تم رفض التحديث" }
            : { wrap: "bg-destructive/5 border-destructive/30", text: "text-destructive", btn: "bg-destructive text-destructive-foreground", msg: "تم العثور على منتجات غير مسموحة" };
        return (
          <div className={`${tone.wrap} border rounded-2xl p-6 mb-6`}>
            <div className="flex items-center justify-end gap-2 mb-5">
              <h3 className={`text-lg font-semibold ${tone.text}`}>نتيجة التحقق الالي</h3>
              <AlertTriangle className={`h-5 w-5 ${tone.text}`} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "عدد المنتجات الكلي", value: "256", color: "text-foreground" },
                { label: "المنتجات المطابقة", value: "240", color: "text-success" },
                { label: "المنتجات غير المسموح بها", value: "5", color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl p-5 text-right">
                  <div className="text-sm text-muted-foreground mb-2">{s.label}</div>
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-center">
              <span className={`inline-flex items-center px-5 py-2.5 rounded-lg ${tone.btn} text-sm font-medium`}>
                {tone.msg}
              </span>
            </div>
          </div>
        );
      })()}

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
            {products.map((p, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-6 py-4">{p.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{p.code}</td>
                <td className="px-6 py-4">{p.cat}</td>
                <td className="px-6 py-4">
                  {p.status === "match" ? (
                    <StatusBadge variant="success">مطابق</StatusBadge>
                  ) : (
                    <StatusBadge variant="danger">غير مطابق</StatusBadge>
                  )}
                </td>
                <td className="px-6 py-4 text-destructive text-sm">
                  {p.status === "mismatch" ? p.reason : "-"}
                </td>
                <td className="px-6 py-4">
                  <input
                    placeholder="أضف ملاحظات..."
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring text-right"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mt-6">
        <h3 className="text-lg font-semibold text-right mb-5">قرار المراجعة</h3>
        {decision && (
          <div
            className={`mb-4 text-right text-sm font-medium ${
              decision === "accepted" ? "text-success" : "text-destructive"
            }`}
          >
            {decision === "accepted" ? "تم قبول التحديث" : "تم رفض التحديث"}
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            disabled={decision !== null}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
            رفض التحديث
          </button>
          <button
            onClick={handleAccept}
            disabled={decision !== null}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            قبول التحديث
          </button>
        </div>
      </div>

      <div className="hidden">
        <Download />
      </div>
    </div>
  );
}
