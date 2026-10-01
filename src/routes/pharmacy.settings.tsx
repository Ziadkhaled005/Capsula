import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info } from "lucide-react";
import { useUpload } from "@/contexts/upload-context";

export const Route = createFileRoute("/pharmacy/settings")({
  head: () => ({ meta: [{ title: "الإعدادات - كبسولة" }] }),
  component: PharmacySettings,
});

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
  defaultChecked = true,
}: {
  title: string;
  description: string;
  icon?: "warning" | "info";
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-start gap-4 py-5 border-b border-border last:border-0">
      <Toggle checked={on} onChange={setOn} />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-right mb-2">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function PharmacySettings() {
  const { enforceMaxSize, setEnforceMaxSize } = useUpload();
  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      <PageHeader title="الإعدادات" subtitle="إدارة اعدادات النظام" />

      <Section title="قواعد رفع الملفات">
        <div className="flex items-start gap-4 py-5 border-b border-border">
          <Toggle checked={enforceMaxSize} onChange={setEnforceMaxSize} />
          <div className="flex-1 text-right">
            <div className="text-base font-medium text-foreground">الحد الأقصى لحجم الملف: 3MB</div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 justify-end">
              <span>سيتم رفض أي ملف يتجاوز الحجم المسموح.</span>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
          </div>
        </div>
        <SettingRow title="الصيغة المسموح بها: xlsx. فقط" description="لن يتم قبول أي صيغة أخرى." icon="info" />
      </Section>

      <Section title="قواعد التحقق من البيانات">
        <SettingRow title="منع الرفع في حال وجود أعمدة مفقودة" description="سيتم إيقاف العملية إذا لم يتم العثور على الحقول الأساسية." />
        <SettingRow title="منع تكرار رموز المنتجات (SKU)" description="سيتم رفض الملف إذا احتوى على منتجات مكررة." />
        <SettingRow title="اكتشاف تعارض بيانات المنتجات" description="سيتم تنبيه الإدارة عند وجود بيانات تتعارض مع النظام." />
        <SettingRow title="السماح بالاستيراد الجزئي" description="سيتم استيراد الصفوف الصحيحة ورفض الصفوف التي تحتوي على أخطاء." />
        <SettingRow title="إنشاء تقرير بالأخطاء قابل للتحميل" description="يمكن تحميل قائمة تفصيلية بالمنتجات غير المقبولة." defaultChecked={false} />
      </Section>

      <Section title="حماية الموافقات">
        <SettingRow title="حماية الموافقات" description="لا يمكن الموافقة أو نشر المنتجات التي تحتوي على أخطاء تحقق." />
      </Section>
    </div>
  );
}
