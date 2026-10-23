import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { InventoryAPI } from "@/api";
import type { JsonRecord } from "@/api/contracts";
import { formatDateTime } from "@/lib/datetime";
import { checkMap, requestStatusMap } from "@/lib/inventory-requests";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({ meta: [{ title: "تفاصيل طلب تحديث المخزون - كبسولة" }] }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const [request, setRequest] = useState<JsonRecord | null>(null);

  useEffect(() => {
    let current = true;
    InventoryAPI.getInventoryRequest(Number(id))
      .then((response) => {
        if (current) setRequest(response);
      })
      .catch((error) => {
        if (current) toast.error(error instanceof Error ? error.message : "تعذر تحميل الطلب.");
      });
    return () => {
      current = false;
    };
  }, [id]);

  const summary = request
    ? [
        request.pharmacyName,
        request.fileName,
        formatDateTime(request.createdDate),
        `${request.totalRows ?? 0} منتج (${request.matchedRows ?? 0} مطابق، ${request.notAllowedRows ?? 0} غير مسموح)`,
        checkMap[request.validationResult as keyof typeof checkMap]?.label,
        requestStatusMap[request.status as keyof typeof requestStatusMap]?.label,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <div>
      <PageHeader
        title="تفاصيل طلب تحديث المخزون"
        subtitle={`رقم الطلب: ${id}`}
      />
      <section
        role="status"
        className="rounded-2xl border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground shadow-sm"
      >
        {summary ?? "لا توجد تفاصيل حقيقية لهذا الطلب حالياً. ستظهر البيانات بعد ربط واجهة API الحقيقية."}
      </section>
    </div>
  );
}
