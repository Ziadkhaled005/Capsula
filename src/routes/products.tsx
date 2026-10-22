import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useAllowedProducts, useAllowedProductMutations } from "@/hooks";
import { getApiErrorMessage } from "@/api/client";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "قائمة المنتجات المسموح بها - كبسولة" }] }),
  component: Products,
});

function Products() {
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("");
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useAllowedProducts({
    search,
    isActive: isActive === "" ? undefined : isActive === "true",
    page,
    pageSize: 10,
  });
  const { remove, upload, update } = useAllowedProductMutations();
  const items = data?.items ?? [];

  const onUpload = (file: File) => {
    setFeedback(null);
    setSummary(null);
    upload.mutate(file, {
      onSuccess: (result) => {
        setSummary(
          `تم معالجة ${result.totalRows} صف: ${result.createdCount} جديد، ${result.updatedCount} محدّث، ${result.failedCount} فشل.`,
        );
        if (result.failedRows?.length) {
          setFeedback({
            ok: false,
            text: result.failedRows
              .slice(0, 5)
              .map((row) => `صف ${row.rowNumber} (${row.code}): ${row.reason}`)
              .join(" · "),
          });
        }
      },
      onError: (uploadError) => setFeedback({ ok: false, text: getApiErrorMessage(uploadError) }),
    });
  };

  const toggleActive = (product: {
    productId: number;
    name: string;
    code: string;
    categoryId?: number;
    isActive: boolean;
  }) => {
    setFeedback(null);
    update.mutate(
      {
        productId: product.productId,
        payload: {
          name: product.name,
          code: product.code,
          categoryId: product.categoryId ?? 0,
          isActive: !product.isActive,
        },
      },
      {
        onSuccess: () =>
          setFeedback({
            ok: true,
            text: product.isActive ? "تم إيقاف المنتج." : "تم تفعيل المنتج.",
          }),
        onError: (toggleError) => setFeedback({ ok: false, text: getApiErrorMessage(toggleError) }),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="قائمة المنتجات المسموح بها"
        subtitle="إدارة القائمة الرئيسية للمنتجات المعتمدة للتحقق من بيانات الصيدليات"
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={upload.isPending}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {upload.isPending ? "جاري الرفع..." : "رفع قائمة منتجات مسموحة"}
            </button>
          </>
        }
      />

      {summary && <p className="mb-4 text-sm text-success">{summary}</p>}
      {feedback && (
        <p className={`mb-4 text-sm ${feedback.ok ? "text-success" : "text-destructive"}`}>
          {feedback.text}
        </p>
      )}

      <TableShell
        title="المنتجات المعتمدة"
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
                  className="appearance-none flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm bg-card min-w-36 text-right"
                >
                  <option value="">كل الحالات</option>
                  <option value="true">مفعل</option>
                  <option value="false">موقوف</option>
                </select>
                <ChevronDown className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="البحث عن اسم المنتج أو الكود..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="rounded-full border border-border bg-card pr-10 pl-4 py-2.5 text-sm w-72 text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              <th className="text-right font-medium px-6 py-3">اسم المنتج</th>
              <th className="text-right font-medium px-6 py-3">الكود</th>
              <th className="text-right font-medium px-6 py-3">التصنيف</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
              <th className="text-right font-medium px-6 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-destructive">
                  {getApiErrorMessage(error)}
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  لا توجد منتجات لعرضها.
                </td>
              </tr>
            )}
            {items.map((product) => (
              <tr key={product.productId} className="border-b border-border last:border-0">
                <td className="px-6 py-4 text-right font-medium">{product.name}</td>
                <td className="px-6 py-4 text-right text-muted-foreground" dir="ltr">
                  {product.code}
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {product.categoryName ?? "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <StatusBadge variant={product.isActive ? "success" : "muted"}>
                    {product.isActive ? "مفعل" : "موقوف"}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        remove.mutate(product.productId, {
                          onSuccess: () => setFeedback({ ok: true, text: "تم حذف المنتج." }),
                          onError: (removeError) =>
                            setFeedback({ ok: false, text: getApiErrorMessage(removeError) }),
                        })
                      }
                      className="h-8 px-3 rounded-md border border-border text-xs text-destructive hover:bg-muted"
                    >
                      حذف
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(product)}
                      className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted"
                    >
                      {product.isActive ? "إيقاف" : "تفعيل"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
