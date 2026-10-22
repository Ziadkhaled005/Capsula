import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, PackageCheck } from "lucide-react";
import { useSuperAdminDashboardQuery, formatDateTime } from "@/hooks/useSuperAdmin";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم - كبسولة" },
      { name: "description", content: "نظرة عامة على نشاط الصيدليات ومراجعة تحديثات المخزون" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const dashboard = useSuperAdminDashboardQuery();
  const data = dashboard.data;
  const metrics = [
    { id: "pending-inventory", label: "طلبات تحديث المخزون المعلقة", value: data?.pendingInventoryRequests ?? 0, icon: ClipboardCheck },
    { id: "rejected-orders", label: "طلبات مرفوضة", value: data?.rejectedOrders ?? 0, icon: PackageCheck },
    { id: "active-orders", label: "الطلبات النشطة", value: data?.activeOrders ?? 0, icon: ClipboardCheck },
  ];
  const activities = data?.recentActivities ?? [];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-7" dir="rtl" data-testid="page-dashboard">
      <header className="text-right">
        <h1 className="text-2xl font-bold tracking-tight text-[#293b31] sm:text-[30px]">مرحباً بك في لوحة التحكم</h1>
        <p className="mt-2 text-sm text-[#829087] sm:text-base">نظرة عامة على طلبات تحديث المخزون ونشاط الصيدليات</p>
      </header>

      <section aria-label="ملخص لوحة التحكم">
        {dashboard.isLoading ? (
          <p role="status" className="py-8 text-center text-sm text-[#829087]">جارٍ تحميل بيانات لوحة التحكم...</p>
        ) : dashboard.isError ? (
          <div role="alert" className="py-8 text-center text-sm text-destructive">
            <p>تعذر تحميل بيانات لوحة التحكم.</p>
            <button type="button" onClick={() => void dashboard.refetch()} className="mt-2 underline">إعادة المحاولة</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.id} className="flex min-h-[154px] flex-col justify-between rounded-2xl border border-[#e5e9e4] bg-[#fffefa] p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f2ec] text-[#3d7956] ring-1 ring-[#d6e9dd]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-medium text-[#9aa69e]">من الخادم</span>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="text-sm font-medium text-[#69776e]">{metric.label}</p>
                    <p className="font-mono text-[32px] font-bold leading-none tracking-tight text-[#2e4939]">{metric.value}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-[#e5e9e4] bg-[#fffefa] shadow-sm">
          <div className="border-b border-[#edf0ec] px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-[#293b31]">آخر تحديثات المخزون</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <thead>
                <tr className="border-b border-[#edf0ec] bg-[#fafbf8] text-xs font-medium text-[#8b978f]">
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">الصيدلية</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">النشاط</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">الحالة</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">التاريخ</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-medium">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={String(activity.requestId)} className="border-b border-[#f0f2ef] last:border-0 hover:bg-[#fbfcfa]">
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#3c4c42]">{activity.pharmacyName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#738078]">تحديث المخزون</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#738078]">{activity.status}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#849087]" dir="ltr">{formatDateTime(activity.date)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link to="/requests/$id" params={{ id: String(activity.requestId) }} className="inline-flex items-center gap-1 text-primary underline">
                        فتح الطلب <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!dashboard.isLoading && !dashboard.isError && activities.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-[#849087]">لا توجد تحديثات حديثة.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-[#e5e9e4] bg-[#fffefa] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="shrink-0 text-lg font-semibold text-[#293b31]">إجراءات سريعة</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/requests" className="inline-flex items-center gap-2 rounded-full bg-[#477d64] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#35674f]">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> طلبات تحديث المخزون <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/products" className="inline-flex items-center gap-2 rounded-full border border-[#d9e8df] bg-[#f4f8f4] px-4 py-2.5 text-sm font-semibold text-[#477d64] hover:bg-[#e8f2eb]">
              <PackageCheck className="h-4 w-4" aria-hidden="true" /> المنتجات المسموح بها <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
