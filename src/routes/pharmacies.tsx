import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";

export const Route = createFileRoute("/pharmacies")({
  head: () => ({ meta: [{ title: "الصيدليات - كبسولة" }] }),
  component: Pharmacies,
});

function Pharmacies() {
  return (
    <div>
      <PageHeader title="الصيدليات" subtitle="إدارة الصيدليات المسجلة في النظام" />

      <TableShell
        title="قائمة الصيدليات"
        filters={null}
      >
        <div role="status" className="flex items-start gap-3 px-6 py-8 text-right text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            لا يمكن عرض قائمة الصيدليات أو تغيير حالتها حالياً. يتطلب ذلك endpoint موثقاً لقائمة
            الصيدليات وإجراءات التفعيل والتعليق؛ لم يتم العثور على هذه العمليات في واجهة API الحالية.
          </p>
        </div>
      </TableShell>
    </div>
  );
}
