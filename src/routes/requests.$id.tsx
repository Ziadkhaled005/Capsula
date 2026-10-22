import { createFileRoute, useParams } from "@tanstack/react-router";
import { Download, AlertTriangle, Check, X, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useInventoryRequest, useReviewInventoryRequest, formatDateTime } from "@/hooks";
import { SuperAdminAPI } from "@/api";
import { getApiErrorMessage } from "@/api/client";

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
  const { id } = useParams({ from: "/requests/$id" });
  const requestId = Number(id);
  const [page, setPage] = useState(1);
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [downloading, setDownloading] = useState<"file" | "report" | null>(null);

  const { data, isLoading, error } = useInventoryRequest(requestId, {
    isMatched: showProblemsOnly ? false : undefined,
    page,
    pageSize: 10,
  });
  const review = useReviewInventoryRequest();

  const runDownload = async (kind: "file" | "report") => {
    setDownloading(kind);
    setFeedback(null);
    try {
      if (kind === "file") await SuperAdminAPI.downloadRequestFile(requestId, data?.fileName);
      else await SuperAdminAPI.downloadErrorReport(requestId);
    } catch (downloadError) {
      setFeedback({ ok: false, text: getApiErrorMessage(downloadError, "تعذر تحميل الملف.") });
    } finally {
      setDownloading(null);
    }
  };

  const decide = (decision: "Approved" | "Rejected") => {
    setFeedback(null);
    review.mutate(
      { id: requestId, decision, reviewNote: reviewNote.trim() || undefined },
      {
        onSuccess: () =>
          setFeedback({
            ok: true,
            text:
              decision === "Approved"
                ? "تم قبول التحديث وتطبيق الصفوف المطابقة."
                : "تم رفض طلب التحديث.",
          }),
        onError: (reviewError) => setFeedback({ ok: false, text: getApiErrorMessage(reviewError) }),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="تفاصيل طلب تحديث المخزون"
        subtitle="مراجعة والتحقق من بيانات المخزون المرفوعة"
      />

      {/* Request info card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => runDownload("file")}
              disabled={downloading !== null || !data}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading === "file" ? "جاري التحميل..." : "تحميل الملف"}
            </button>
            <button
              type="button"
              onClick={() => runDownload("report")}
              disabled={downloading !== null || !data}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {downloading === "report" ? "جاري التحميل..." : "تحميل تقرير الأخطاء"}
            </button>
          </div>
          <h3 className="text-lg font-semibold">معلومات الطلب</h3>
        </div>
        {isLoading && <p className="text-sm text-muted-foreground text-right">جاري التحميل...</p>}
        {error && (
          <p className="text-sm text-destructive text-right">
            {getApiErrorMessage(error, "تعذر تحميل تفاصيل الطلب.")}
          </p>
        )}
        {data && (
          <>
            <div className="grid grid-cols-3 gap-6">
              <InfoCell label="رقم الطلب" value={String(data.id)} />
              <InfoCell label="تاريخ ووقت الرفع" value={formatDateTime(data.createdDate)} />
              <InfoCell label="اسم الصيدلية" value={data.pharmacyName} />
              <InfoCell label="إجمالي الصفوف" value={String(data.totalRows)} />
              <InfoCell label="الصفوف المطابقة" value={String(data.matchedRows)} />
              <InfoCell
                label="الحالة"
                value={
                  data.status === "Pending"
                    ? "قيد المراجعة"
                    : data.status === "Approved"
                      ? "مقبول"
                      : "مرفوض"
                }
              />
            </div>
            {data.reviewNote && (
              <p className="mt-4 text-right text-sm text-muted-foreground">
                ملاحظة المراجعة: {data.reviewNote}
              </p>
            )}
          </>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-end gap-2 text-right text-muted-foreground">
          <h3 className="text-lg font-semibold">نتيجة التحقق الالي</h3>
          <AlertTriangle className="h-5 w-5" />
        </div>
        {data && (
          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showProblemsOnly}
                onChange={(event) => {
                  setShowProblemsOnly(event.target.checked);
                  setPage(1);
                }}
              />
              إظهار الصفوف غير المطابقة فقط
            </label>
            <StatusBadge variant={data.validationResult === "AllAllowed" ? "success" : "danger"}>
              {data.validationResult === "AllAllowed"
                ? "كل الصفوف مسموحة"
                : `${data.notAllowedRows} صف غير مسموح · ${data.conflictRows} تعارض`}
            </StatusBadge>
          </div>
        )}
      </div>

      <TableShell
        title="جدول التحقق من المنتجات"
        pagination={{
          page: data?.rows.page ?? page,
          pageSize: data?.rows.pageSize ?? 10,
          total: data?.rows.totalCount ?? 0,
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
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {!isLoading && (data?.rows.items ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  لا توجد صفوف لعرضها.
                </td>
              </tr>
            )}
            {(data?.rows.items ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-6 py-4 text-right font-medium">
                  {row.productName}
                  {row.catalogProductName && row.catalogProductName !== row.productName && (
                    <span className="block text-xs text-muted-foreground">
                      في الكتالوج: {row.catalogProductName}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground" dir="ltr">
                  {row.code}
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {row.categoryName ?? "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <StatusBadge variant={row.isMatched ? "success" : "danger"}>
                    {row.isMatched ? "مطابق" : "غير مطابق"}
                  </StatusBadge>
                  {row.warning && (
                    <span className="block text-xs text-warning mt-1">{row.warning}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">{row.reason ?? "—"}</td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {row.internalNote ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mt-6">
        <h3 className="text-lg font-semibold text-right mb-5">قرار المراجعة</h3>
        {data?.status !== "Pending" ? (
          <p className="mb-4 text-right text-sm text-muted-foreground">
            تمت مراجعة هذا الطلب مسبقاً ولا يمكن تغيير القرار.
          </p>
        ) : (
          <>
            <textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="ملاحظة المراجعة (اختياري)..."
              className="w-full rounded-xl border border-border bg-background p-4 text-sm text-right mb-4 min-h-24 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {feedback && (
              <p
                className={`mb-4 text-right text-sm ${feedback.ok ? "text-success" : "text-destructive"}`}
              >
                {feedback.text}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => decide("Rejected")}
                disabled={review.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                رفض التحديث
              </button>
              <button
                type="button"
                onClick={() => decide("Approved")}
                disabled={review.isPending || data?.canApprove === false}
                title={
                  data?.canApprove === false
                    ? "لا يمكن الموافقة على طلب يحتوي أخطاء دون استيراد جزئي"
                    : undefined
                }
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                {review.isPending ? "جاري الحفظ..." : "قبول التحديث"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
