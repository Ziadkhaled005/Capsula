import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/customer/order/$orderNo/confirmation")({
  head: () => ({ meta: [{ title: "مراجعة العرض - كبسولة" }] }),
  component: CustomerOrderConfirmationPage,
});

function CustomerOrderConfirmationPage() {
  const navigate = useNavigate();

  return (
    <main
      dir="rtl"
      className="grid min-h-[100dvh] place-items-center bg-[#f4f7f3] px-4 py-8 text-[#303a34]"
    >
      <section className="w-full max-w-md rounded-3xl border border-[#e1e9e2] bg-[#fffefa] p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold">لا تتوفر بيانات طلب حقيقية حالياً</h1>
        <p className="mt-2 text-sm leading-6 text-[#758078]">
          ستظهر تفاصيل العرض وخيارات الموافقة بعد ربط واجهة API الحقيقية.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/pharmacy/orders" })}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#145c4c] px-5 text-sm font-semibold text-white hover:bg-[#104b3e]"
        >
          العودة إلى الطلبات
        </button>
      </section>
    </main>
  );
}
