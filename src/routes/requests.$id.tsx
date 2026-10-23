import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, AlertTriangle, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TableShell } from "@/components/DataTable";
import { InventoryAPI, SuperAdminAPI } from "@/api";
import type { JsonRecord } from "@/api/contracts";
import { formatTimeAndDate, saveBlob } from "@/lib/datetime";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({ meta: [{ title: "تفاصيل طلب تحديث المخزون - كبسولة" }] }),
  component: RequestDetail,
});

const PAGE_SIZE = 10;

/** "03:33  2025-01-15", the format the request-info card is designed with. */
function uploadedAt(value?: string | null) {
  const { time, date } = formatTimeAndDate(value);
  if (date === "—") return "—";
  const [day, month, year] = date.split("/");
  return `${time}  ${year}-${month}-${day}`;
}

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
  const requestId = Number(id);
  const [request, setRequest] = useState<JsonRecord | null>(null);
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let current = true;
    InventoryAPI.getInventoryRequest(requestId, { page, pageSize: PAGE_SIZE })
      .then((response) => {
        if (current) setRequest(response);
      })
      .catch((error) => {
        if (current) toast.error(error instanceof Error ? error.message : "تعذر تحميل الطلب.");
      });
    return () => {
      current = false;
    };
  }, [requestId, page]);

  const status = request?.status as "Pending" | "Approved" | "Rejected" | undefined;
  const decision = status === "Approved" ? "accepted" : status === "Rejected" ? "rejected" : null;
  const rows: JsonRecord[] = request?.rows?.items ?? [];
  const notAllowed = Number(request?.notAllowedRows ?? 0);

  const handleDownload = async () => {
    try {
      const blob = await InventoryAPI.downloadInventoryRequestFile(requestId);
      saveBlob(blob, request?.fileName || `inventory-request-${requestId}.xlsx`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الملف.");
    }
  };

  const review = async (next: "Approved" | "Rejected") => {
    setReviewing(true);
    try {
      await InventoryAPI.reviewInventoryRequest(requestId, next);
      if (next === "Approved") toast.success("تم قبول التحديث بنجاح");
      else toast.error("تم رفض التحديث");
      setTimeout(() => navigate({ to: "/requests" }), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ قرار المراجعة.");
      setReviewing(false);
    }
  };

  const saveNote = async (row: JsonRecord) => {
    const note = notes[row.id];
    if (note === undefined || note === (row.internalNote ?? "")) return;
    try {
      await InventoryAPI.updateInventoryRowNote(requestId, row.id, note.trim() || null);
      toast.success("تم حفظ الملاحظة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الملاحظة.");
    }
  };

  const uploadAllowedProducts = async (file: File) => {
    try {
      const result = await SuperAdminAPI.uploadAllowedProducts(file);
      toast.success(
        `تم رفع القائمة: ${result.createdCount ?? 0} جديد، ${result.updatedCount ?? 0} محدث، ${result.failedCount ?? 0} فشل`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع قائمة المنتجات.");
    }
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
            <input
              ref={uploadRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAllowedProducts(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => uploadRef.current?.click()}
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
            disabled={!request}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            تحميل الملف
          </button>
          <h3 className="text-lg font-semibold">معلومات الطلب</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <InfoCell label="اسم ملف Excel" value={request?.fileName ?? "—"} />
          <InfoCell label="تاريخ و وقت الرفع" value={uploadedAt(request?.createdDate)} />
          <InfoCell label="اسم الصيدلية" value={request?.pharmacyName ?? "—"} />
        </div>
      </div>

      {/* Verification card */}
      {(() => {
        const tone =
          decision === "accepted"
            ? { wrap: "bg-success/5 border-success/30", text: "text-success", btn: "bg-success text-success-foreground", msg: "تم قبول التحديث" }
            : decision === "rejected"
            ? { wrap: "bg-destructive/5 border-destructive/30", text: "text-destructive", btn: "bg-destructive text-destructive-foreground", msg: "تم رفض التحديث" }
            : request && notAllowed === 0
            ? { wrap: "bg-success/5 border-success/30", text: "text-success", btn: "bg-success text-success-foreground", msg: "جميع المنتجات مسموحة" }
            : { wrap: "bg-destructive/5 border-destructive/30", text: "text-destructive", btn: "bg-destructive text-destructive-foreground", msg: "تم العثور على منتجات غير مسموحة" };
        return (
          <div className={`${tone.wrap} border rounded-2xl p-6 mb-6`}>
            <div className="flex items-center justify-end gap-2 mb-5">
              <h3 className={`text-lg font-semibold ${tone.text}`}>نتيجة التحقق الالي</h3>
              <AlertTriangle className={`h-5 w-5 ${tone.text}`} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "عدد المنتجات الكلي", value: String(request?.totalRows ?? "—"), color: "text-foreground" },
                { label: "المنتجات المطابقة", value: String(request?.matchedRows ?? "—"), color: "text-success" },
                { label: "المنتجات غير المسموح بها", value: String(request?.notAllowedRows ?? "—"), color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl p-5 text-right">
                  <div className="text-sm text-muted-foreground mb-2">{s.label}</div>
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-start">
              <span className={`inline-flex items-center px-5 py-2.5 rounded-lg ${tone.btn} text-sm font-medium`}>
                {tone.msg}
              </span>
            </div>
          </div>
        );
      })()}

      <TableShell
        title="جدول التحقق من المنتجات"
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: Number(request?.rows?.totalCount ?? 0),
          onPageChange: setPage,
        }}
      >
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
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-6 py-4">{p.productName}</td>
                <td className="px-6 py-4 text-muted-foreground">{p.code}</td>
                <td className="px-6 py-4">{p.categoryName ?? "-"}</td>
                <td className="px-6 py-4">
                  {p.isMatched ? (
                    <StatusBadge variant="success">مطابق</StatusBadge>
                  ) : (
                    <StatusBadge variant="danger">غير مطابق</StatusBadge>
                  )}
                </td>
                <td className="px-6 py-4 text-destructive text-sm">
                  {!p.isMatched ? p.reason ?? "-" : "-"}
                </td>
                <td className="px-6 py-4">
                  <input
                    value={notes[p.id] ?? p.internalNote ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    onBlur={() => void saveNote(p)}
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
        <div className="flex items-center justify-start gap-3">
          <button
            onClick={() => void review("Approved")}
            disabled={!request || decision !== null || reviewing || request.canApprove === false}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            قبول التحديث
          </button>
          <button
            onClick={() => void review("Rejected")}
            disabled={!request || decision !== null || reviewing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
            رفض التحديث
          </button>
        </div>
      </div>
    </div>
  );
}
