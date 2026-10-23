import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardAPI } from "@/api";
import type { UpdateSystemSettingsDto } from "@/api/contracts";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات - كبسولة" }] }),
  component: Settings,
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
  checked,
  onChange,
}: {
  title: string;
  description: string;
  icon?: "warning" | "info";
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [localOn, setLocalOn] = useState(defaultChecked);
  const on = checked ?? localOn;
  return (
    <div className="flex items-start gap-4 py-5 border-b border-border last:border-0">
      <Toggle checked={on} onChange={onChange ?? setLocalOn} />
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

type BooleanSetting = {
  [K in keyof UpdateSystemSettingsDto]: UpdateSystemSettingsDto[K] extends boolean ? K : never;
}[keyof UpdateSystemSettingsDto];

function Settings() {
  const [settings, setSettings] = useState<UpdateSystemSettingsDto | null>(null);

  useEffect(() => {
    DashboardAPI.getSystemSettings()
      .then(setSettings)
      .catch((error) => toast.error(error instanceof Error ? error.message : "تعذر تحميل الإعدادات."));
  }, []);

  // The API expects the full settings object on every save.
  const bind = (key: BooleanSetting) => ({
    checked: settings ? Boolean(settings[key]) : undefined,
    onChange: async (value: boolean) => {
      if (!settings) return;
      const previous = settings;
      const next = { ...settings, [key]: value };
      setSettings(next);
      try {
        const saved = await DashboardAPI.updateSystemSettings(next);
        setSettings(saved && typeof saved === "object" ? { ...next, ...saved } : next);
        toast.success("تم حفظ الإعدادات");
      } catch (error) {
        setSettings(previous);
        toast.error(error instanceof Error ? error.message : "تعذر حفظ الإعدادات.");
      }
    },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="الإعدادات" subtitle="إدارة اعدادات النظام" />

      <Section title="قواعد رفع الملفات">
        <SettingRow title="الحد الأقصى لحجم الملف: 3MB" description="سيتم رفض أي ملف يتجاوز الحجم المسموح." icon="warning" />
        <SettingRow title="الصيغة المسموح بها: xlsx. فقط" description="لن يتم قبول أي صيغة أخرى." icon="info" />
      </Section>

      <Section title="قواعد التحقق من البيانات">
        <SettingRow {...bind("blockMissingColumns")} title="منع الرفع في حال وجود أعمدة مفقودة" description="سيتم إيقاف العملية إذا لم يتم العثور على الحقول الأساسية." />
        <SettingRow {...bind("preventDuplicateCodes")} title="منع تكرار رموز المنتجات (SKU)" description="سيتم رفض الملف إذا احتوى على منتجات مكررة." />
        <SettingRow {...bind("detectProductConflicts")} title="اكتشاف تعارض بيانات المنتجات" description="سيتم تنبيه الإدارة عند وجود بيانات تتعارض مع النظام." />
        <SettingRow {...bind("allowPartialImport")} title="السماح بالاستيراد الجزئي" description="سيتم استيراد الصفوف الصحيحة ورفض الصفوف التي تحتوي على أخطاء." />
        <SettingRow {...bind("generateErrorReport")} title="إنشاء تقرير بالأخطاء قابل للتحميل" description="يمكن تحميل قائمة تفصيلية بالمنتجات غير المقبولة." defaultChecked={false} />
      </Section>

      <Section title="حماية الموافقات">
        <SettingRow {...bind("approvalProtection")} title="حماية الموافقات" description="لا يمكن الموافقة أو نشر المنتجات التي تحتوي على أخطاء تحقق." />
      </Section>
    </div>
  );
}
