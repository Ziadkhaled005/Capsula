import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, Save } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks";
import type { SystemSettings } from "@/api/superadmin";
import { getApiErrorMessage } from "@/api/client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات - كبسولة" }] }),
  component: Settings,
});

const DEFAULTS: SystemSettings = {
  maxFileSizeInMB: 5,
  fileUploadEnabled: true,
  lowStockThreshold: 10,
  mediumStockThreshold: 25,
  estimatedDeliveryDays: 2,
  deliveryFee: 30,
  confirmationSlaMinutes: 45,
  maxOfferDiscountPercentage: 25,
  offerRadiusKm: 5,
  offerWindowMinutes: 5,
  offerValidityMinutes: 30,
  blockMissingColumns: true,
  preventDuplicateCodes: true,
  detectProductConflicts: true,
  allowPartialImport: true,
  generateErrorReport: true,
  approvalProtection: true,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6 mr-[30px]" : "translate-x-1 mr-[29px]",
        )}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  icon,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  icon?: "warning" | "info";
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-border last:border-0">
      <Toggle checked={checked} onChange={onChange} />
      <div className="flex-1 text-right">
        <div className="text-base font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 justify-end">
          <span>{description}</span>
          {icon === "warning" && <AlertTriangle className="h-4 w-4 text-warning" />}
          {icon === "info" && <Info className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}

function NumberRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-border last:border-0">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex-1 text-right">
        <div className="text-base font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground mt-1">{description}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-right mb-2">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Settings() {
  const { data } = useSettings();
  const update = useUpdateSettings();
  const [draft, setDraft] = useState<SystemSettings>(DEFAULTS);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const set = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    setFeedback(null);
    update.mutate(draft, {
      onSuccess: () => setFeedback({ ok: true, text: "تم حفظ الإعدادات بنجاح." }),
      onError: (error) => setFeedback({ ok: false, text: getApiErrorMessage(error) }),
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="الإعدادات"
        subtitle="إدارة اعدادات النظام"
        actions={
          <button
            type="button"
            onClick={save}
            disabled={update.isPending}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {update.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        }
      />

      {feedback && (
        <p className={cn("mb-4 text-sm", feedback.ok ? "text-success" : "text-destructive")}>
          {feedback.text}
        </p>
      )}

      <Section title="قواعد رفع الملفات">
        <NumberRow
          title={`الحد الأقصى لحجم الملف (ميجابايت): ${draft.maxFileSizeInMB}MB`}
          description="سيتم رفض أي ملف يتجاوز الحجم المسموح."
          value={draft.maxFileSizeInMB}
          onChange={(v) => set("maxFileSizeInMB", v)}
        />
        <SettingRow
          title="تفعيل رفع الملفات"
          description="عند الإيقاف لن تقبل الصيدليات رفع ملفات المخزون."
          checked={draft.fileUploadEnabled}
          onChange={(v) => set("fileUploadEnabled", v)}
        />
        <SettingRow
          title="الصيغة المسموح بها: xlsx / csv"
          description="لن يتم قبول أي صيغة أخرى."
          icon="info"
          checked
          onChange={() => undefined}
        />
      </Section>

      <Section title="عتبات المخزون">
        <NumberRow
          title={`حد المخزون المنخفض: ${draft.lowStockThreshold}`}
          description="أي كمية أقل أو تساوي هذا الحد تُصنف كمخزون منخفض."
          value={draft.lowStockThreshold}
          onChange={(v) => set("lowStockThreshold", v)}
        />
        <NumberRow
          title={`حد المخزون المتوسط: ${draft.mediumStockThreshold}`}
          description="أي كمية أقل أو تساوي هذا الحد تُصنف كمخزون متوسط."
          value={draft.mediumStockThreshold}
          onChange={(v) => set("mediumStockThreshold", v)}
        />
      </Section>

      <Section title="الطلبات والمزايدة">
        <NumberRow
          title={`رسوم التوصيل: ${draft.deliveryFee}`}
          description="تُنسخ على كل طلب جديد."
          value={draft.deliveryFee}
          onChange={(v) => set("deliveryFee", v)}
        />
        <NumberRow
          title={`مهلة تأكيد الطلب (دقيقة): ${draft.confirmationSlaMinutes}`}
          description="المدة المتاحة للصيدلية لتأكيد العرض المختار."
          value={draft.confirmationSlaMinutes}
          onChange={(v) => set("confirmationSlaMinutes", v)}
        />
        <NumberRow
          title={`أيام التوصيل المتوقعة: ${draft.estimatedDeliveryDays}`}
          description="تقدير التوصيل الظاهر للعملاء."
          value={draft.estimatedDeliveryDays}
          onChange={(v) => set("estimatedDeliveryDays", v)}
        />
        <NumberRow
          title={`نطاق المزايدة (كم): ${draft.offerRadiusKm}`}
          description="الصيدليات ضمن هذه المسافة من عنوان التوصيل تستلم الطلب."
          value={draft.offerRadiusKm}
          onChange={(v) => set("offerRadiusKm", v)}
        />
        <NumberRow
          title={`نافذة تقديم العروض (دقيقة): ${draft.offerWindowMinutes}`}
          description="مدة المزايدة بعد إنشاء الطلب."
          value={draft.offerWindowMinutes}
          onChange={(v) => set("offerWindowMinutes", v)}
        />
        <NumberRow
          title={`صلاحية العروض (دقيقة): ${draft.offerValidityMinutes}`}
          description="المدة المتاحة للعميل لاختيار عرض بعد انتهاء المزايدة."
          value={draft.offerValidityMinutes}
          onChange={(v) => set("offerValidityMinutes", v)}
        />
        <NumberRow
          title={`أقصى خصم مسموح للعروض (%): ${draft.maxOfferDiscountPercentage}`}
          description="الحد الأقصى لنسبة الخصم في العرض."
          value={draft.maxOfferDiscountPercentage}
          onChange={(v) => set("maxOfferDiscountPercentage", v)}
        />
      </Section>

      <Section title="قواعد التحقق من البيانات">
        <SettingRow
          title="منع الرفع في حال وجود أعمدة مفقودة"
          description="سيتم إيقاف العملية إذا لم يتم العثور على الحقول الأساسية."
          checked={draft.blockMissingColumns}
          onChange={(v) => set("blockMissingColumns", v)}
        />
        <SettingRow
          title="منع تكرار رموز المنتجات (SKU)"
          description="سيتم رفض الملف إذا احتوى على منتجات مكررة."
          checked={draft.preventDuplicateCodes}
          onChange={(v) => set("preventDuplicateCodes", v)}
        />
        <SettingRow
          title="اكتشاف تعارض بيانات المنتجات"
          description="سيتم تنبيه الإدارة عند وجود بيانات تتعارض مع النظام."
          checked={draft.detectProductConflicts}
          onChange={(v) => set("detectProductConflicts", v)}
        />
        <SettingRow
          title="السماح بالاستيراد الجزئي"
          description="سيتم استيراد الصفوف الصحيحة ورفض الصفوف التي تحتوي على أخطاء."
          checked={draft.allowPartialImport}
          onChange={(v) => set("allowPartialImport", v)}
        />
        <SettingRow
          title="إنشاء تقرير بالأخطاء قابل للتحميل"
          description="يمكن تحميل قائمة تفصيلية بالمنتجات غير المقبولة."
          checked={draft.generateErrorReport}
          onChange={(v) => set("generateErrorReport", v)}
        />
      </Section>

      <Section title="حماية الموافقات">
        <SettingRow
          title="حماية الموافقات"
          description="لا يمكن الموافقة أو نشر المنتجات التي تحتوي على أخطاء تحقق."
          checked={draft.approvalProtection}
          onChange={(v) => set("approvalProtection", v)}
        />
      </Section>
    </div>
  );
}
