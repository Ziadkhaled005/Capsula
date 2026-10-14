import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";

export const Route = createFileRoute("/customer/order/$orderNo/confirmation")({
  head: () => ({ meta: [{ title: "مراجعة العرض - كبسولة" }] }),
  component: CustomerOrderConfirmationPage,
});

function CustomerOrderConfirmationPage() {
  return (
    <main
      dir="rtl"
      className="grid min-h-[100dvh] place-items-center bg-[#f4f7f3] px-4 py-8 text-[#303a34]"
    >
      <section className="w-full max-w-md rounded-3xl border border-[#e1e9e2] bg-[#fffefa] p-7 text-center shadow-sm">
        <CircleAlert className="mx-auto h-8 w-8 text-[#8a7041]" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold">تأكيد عروض العملاء غير متاح</h1>
        <p className="mt-2 text-sm leading-6 text-[#758078]">
          لا توجد واجهة API موثقة لتحميل عرض العميل أو إرسال قرار الموافقة أو الرفض. لم يتم تغيير
          حالة أي طلب.
        </p>
      </section>
    </main>
  );
}
