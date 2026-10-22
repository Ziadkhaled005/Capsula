import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown, Ban, Check, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { usePharmacies, usePharmacyMutations } from "@/hooks";
import { getApiErrorMessage } from "@/api/client";
import type { PharmacyPayload } from "@/api/superadmin";

export const Route = createFileRoute("/pharmacies")({
  head: () => ({ meta: [{ title: "الصيدليات - كبسولة" }] }),
  component: Pharmacies,
});

const EMPTY_FORM: PharmacyPayload = {
  name: "",
  address: "",
  phone: "",
  licenseNumber: "",
  isActive: true,
  returnPolicy: "",
};

function Pharmacies() {
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<PharmacyPayload>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const { data, isLoading, error } = usePharmacies({
    search,
    isActive: isActive === "" ? undefined : isActive === "true",
    page,
    pageSize: 10,
  });
  const mutations = usePharmacyMutations();

  const items = data?.items ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
    setFeedback(null);
  };

  const save = () => {
    setFeedback(null);
    const execute = editingId
      ? mutations.update.mutateAsync({ id: editingId, payload: form })
      : mutations.create.mutateAsync(form);
    execute
      .then(() => {
        setDialogOpen(false);
        setFeedback({ ok: true, text: editingId ? "تم تحديث الصيدلية." : "تم إنشاء الصيدلية." });
      })
      .catch((saveError) => setFeedback({ ok: false, text: getApiErrorMessage(saveError) }));
  };

  const act = (fn: () => Promise<unknown>, okText: string) => {
    setFeedback(null);
    fn()
      .then(() => setFeedback({ ok: true, text: okText }))
      .catch((actError) => setFeedback({ ok: false, text: getApiErrorMessage(actError) }));
  };

  const field = (label: string, key: keyof PharmacyPayload, type: string = "text") => (
    <div className="text-right">
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <input
        type={type}
        value={String(form[key] ?? "")}
        onChange={(event) => setForm((f) => ({ ...f, [key]: event.target.value }))}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="الصيدليات"
        subtitle="إدارة الصيدليات المسجلة في النظام"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm"
          >
            <Plus className="h-4 w-4" />
            إضافة صيدلية
          </button>
        }
      />

      {feedback && (
        <p className={`mb-4 text-sm ${feedback.ok ? "text-success" : "text-destructive"}`}>
          {feedback.text}
        </p>
      )}

      <TableShell
        title="قائمة الصيدليات"
        filters={
          <>
            <div className="relative">
              <div className="absolute -top-2.5 right-4 bg-card px-2 text-xs text-muted-foreground z-10">
                الحالات
              </div>
              <div className="relative">
                <select
                  value={isActive}
                  onChange={(event) => {
                    setIsActive(event.target.value);
                    setPage(1);
                  }}
                  className="appearance-none flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm bg-card min-w-36 justify-between text-right"
                >
                  <option value="">كل الحالات</option>
                  <option value="true">مفعلة</option>
                  <option value="false">موقوفة</option>
                </select>
                <ChevronDown className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="البحث بالاسم أو الهاتف..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="rounded-full border border-border bg-card pr-10 pl-4 py-2.5 text-sm w-64 text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        }
        pagination={{
          page: data?.page ?? page,
          pageSize: data?.pageSize ?? 10,
          total: data?.totalCount ?? 0,
          onPageChange: setPage,
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-right font-medium px-6 py-3">الاسم</th>
              <th className="text-right font-medium px-6 py-3">الهاتف</th>
              <th className="text-right font-medium px-6 py-3">رقم الترخيص</th>
              <th className="text-right font-medium px-6 py-3">عدد المنتجات</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
              <th className="text-right font-medium px-6 py-3">إجراءات</th>
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
            {error && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-destructive">
                  {getApiErrorMessage(error)}
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  لا توجد صيدليات لعرضها.
                </td>
              </tr>
            )}
            {items.map((pharmacy) => (
              <tr key={pharmacy.id} className="border-b border-border last:border-0">
                <td className="px-6 py-4 text-right font-medium">{pharmacy.name}</td>
                <td className="px-6 py-4 text-right text-muted-foreground" dir="ltr">
                  {pharmacy.phone}
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {pharmacy.licenseNumber}
                </td>
                <td className="px-6 py-4 text-right">{pharmacy.allowedProductCount ?? 0}</td>
                <td className="px-6 py-4 text-right">
                  <StatusBadge variant={pharmacy.isActive ? "success" : "danger"}>
                    {pharmacy.isActive ? "مفعلة" : "موقوفة"}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      title="حذف"
                      onClick={() =>
                        act(() => mutations.remove.mutateAsync(pharmacy.id), "تم حذف الصيدلية.")
                      }
                      className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {pharmacy.isActive ? (
                      <button
                        type="button"
                        title="تعليق"
                        onClick={() =>
                          act(
                            () => mutations.suspend.mutateAsync(pharmacy.id),
                            "تم تعليق الصيدلية.",
                          )
                        }
                        className="h-8 px-3 rounded-md border border-border flex items-center gap-1 text-warning hover:bg-muted text-xs"
                      >
                        <Ban className="h-3.5 w-3.5" /> تعليق
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="إعادة تفعيل"
                        onClick={() =>
                          act(
                            () => mutations.activate.mutateAsync(pharmacy.id),
                            "تمت إعادة تفعيل الصيدلية.",
                          )
                        }
                        className="h-8 px-3 rounded-md border border-border flex items-center gap-1 text-success hover:bg-muted text-xs"
                      >
                        <Check className="h-3.5 w-3.5" /> تفعيل
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(pharmacy.id);
                        setForm({
                          name: pharmacy.name,
                          address: pharmacy.address,
                          phone: pharmacy.phone,
                          licenseNumber: pharmacy.licenseNumber,
                          isActive: pharmacy.isActive,
                          returnPolicy: pharmacy.returnPolicy ?? "",
                          latitude: pharmacy.latitude,
                          longitude: pharmacy.longitude,
                          adminUserId: pharmacy.adminUserId,
                        });
                        setDialogOpen(true);
                        setFeedback(null);
                      }}
                      className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted"
                    >
                      تعديل
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-right mb-4">
              {editingId ? "تعديل صيدلية" : "إضافة صيدلية"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {field("اسم الصيدلية", "name")}
              {field("الهاتف", "phone")}
              {field("العنوان", "address")}
              {field("رقم الترخيص", "licenseNumber")}
              {field("معرّف حساب الصيدلي (adminUserId)", "adminUserId")}
              {field("سياسة الإرجاع", "returnPolicy")}
              {field("خط العرض (latitude)", "latitude", "number")}
              {field("خط الطول (longitude)", "longitude", "number")}
            </div>
            <label className="mt-4 flex items-center justify-end gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((f) => ({ ...f, isActive: event.target.checked }))}
              />
              صيدلية مفعلة
            </label>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={save}
                disabled={mutations.create.isPending || mutations.update.isPending}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
