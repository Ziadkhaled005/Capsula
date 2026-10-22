import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TableShell } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useInventoryRequests, formatDateTime } from "@/hooks";
import type { InventoryRequestsFilter } from "@/api/superadmin";

export const Route = createFileRoute("/requests/")({
  head: () => ({ meta: [{ title: "طلبات تحديث المخزون - كبسولة" }] }),
  component: Requests,
});

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value)?.label ?? value;
  return (
    <div className="relative">
      <div className="absolute -top-2.5 right-4 bg-card px-2 text-xs text-muted-foreground z-10">
        {label}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm bg-card min-w-36 justify-between"
      >
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
        <span>{current}</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-full bg-card border border-border rounded-xl shadow-md z-20 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="w-full text-right px-4 py-2.5 text-sm hover:bg-muted"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function statusVariant(status: string): "success" | "danger" | "warning" | "muted" {
  if (status === "Approved") return "success";
  if (status === "Rejected") return "danger";
  return "warning";
}

function Requests() {
  const [filters, setFilters] = useState<InventoryRequestsFilter>({ page: 1, pageSize: 10 });
  const { data, isLoading, error } = useInventoryRequests(filters);
  const navigate = useNavigate();
  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="طلبات تحديث المخزون"
        subtitle="إدارة ومراجعة طلبات تحديث المحتوى المقدمة من الصيدليات"
      />

      <TableShell
        title="قائمة الطلبات"
        filters={
          <>
            <FilterDropdown
              label="النتائج"
              value={filters.result ?? ""}
              options={[
                { value: "", label: "كل النتائج" },
                { value: "AllAllowed", label: "كلها مسموحة" },
                { value: "HasNotAllowed", label: "بها غير مسموح" },
              ]}
              onChange={(result) =>
                setFilters((f) => ({
                  ...f,
                  result: result as InventoryRequestsFilter["result"],
                  page: 1,
                }))
              }
            />
            <FilterDropdown
              label="الحالات"
              value={filters.status ?? ""}
              options={[
                { value: "", label: "كل الحالات" },
                { value: "Pending", label: "قيد المراجعة" },
                { value: "Approved", label: "مقبول" },
                { value: "Rejected", label: "مرفوض" },
              ]}
              onChange={(status) =>
                setFilters((f) => ({
                  ...f,
                  status: status as InventoryRequestsFilter["status"],
                  page: 1,
                }))
              }
            />
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="البحث عن اسم الصيدلية..."
                value={filters.search ?? ""}
                onChange={(event) =>
                  setFilters((f) => ({ ...f, search: event.target.value, page: 1 }))
                }
                className="rounded-full border border-border bg-card pr-10 pl-4 py-2.5 text-sm w-64 text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        }
        pagination={{
          page: data?.page ?? 1,
          pageSize: data?.pageSize ?? 10,
          total: data?.totalCount ?? 0,
          onPageChange: (page) => setFilters((f) => ({ ...f, page })),
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-right font-medium px-6 py-3">اسم الصيدلية</th>
              <th className="text-right font-medium px-6 py-3">التاريخ و الوقت</th>
              <th className="text-right font-medium px-6 py-3">عدد المنتجات</th>
              <th className="text-right font-medium px-6 py-3">نتيجة التحقق الالي</th>
              <th className="text-right font-medium px-6 py-3">نوع النشاط</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
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
            {!isLoading && error && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-destructive">
                  {error instanceof Error ? error.message : "تعذر تحميل الطلبات."}
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  لا توجد طلبات لعرضها.
                </td>
              </tr>
            )}
            {items.map((request) => (
              <tr
                key={request.id}
                onClick={() =>
                  navigate({ to: "/requests/$id", params: { id: String(request.id) } })
                }
                className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer"
              >
                <td className="px-6 py-4 text-right font-medium">{request.pharmacyName}</td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {formatDateTime(request.createdDate)}
                </td>
                <td className="px-6 py-4 text-right">{request.totalRows}</td>
                <td className="px-6 py-4 text-right">
                  <StatusBadge
                    variant={request.validationResult === "AllAllowed" ? "success" : "danger"}
                  >
                    {request.validationResult === "AllAllowed"
                      ? "كلها مسموحة"
                      : "بها صفوف غير مسموحة"}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">تحديث المخزون</td>
                <td className="px-6 py-4 text-right">
                  <StatusBadge variant={statusVariant(request.status)}>
                    {request.status === "Pending"
                      ? "قيد المراجعة"
                      : request.status === "Approved"
                        ? "مقبول"
                        : "مرفوض"}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
