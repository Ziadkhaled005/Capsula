import { PartyPopper, X } from "lucide-react";

type OrderResponseNotificationProps = {
  outcome: "approved" | "declined";
  orderNo: string;
  onDismiss(): void;
  onOpenOrder(): void;
};

export function OrderResponseNotification({
  outcome,
  orderNo,
  onDismiss,
  onOpenOrder,
}: OrderResponseNotificationProps) {
  const approved = outcome === "approved";

  return (
    <aside
      dir="rtl"
      role="status"
      aria-live="polite"
      data-testid={`order-response-notification-${outcome}`}
      className={`fixed left-1/2 z-[100] w-[calc(100vw-32px)] max-w-[686px] -translate-x-1/2 rounded-[8px] border p-4 shadow-[0_12px_38px_rgba(45,59,48,0.14)] ${
        approved
          ? "top-[15.5px] min-h-[170px] border-[#cce4d1] bg-[#eaf5ec] text-[#244d31]"
          : "top-3 min-h-[106px] border-[#f0dfc5] bg-[#fbf4e8] text-[#76542e]"
      }`}
    >
      <button
        type="button"
        data-testid="button-dismiss-order-response"
        aria-label="إغلاق الإشعار"
        onClick={onDismiss}
        className={`absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 ${
          approved
            ? "text-[#54765b] hover:bg-[#dceede] focus-visible:ring-[#4c8b59]"
            : "text-[#9a7a50] hover:bg-[#f3e8d5] focus-visible:ring-[#d38a36]"
        }`}
      >
        <X className="h-[17px] w-[17px]" aria-hidden="true" />
      </button>

      <div className="flex items-start gap-2 pl-8">
        {approved && (
          <span
            className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#367148]"
            aria-hidden="true"
          >
            <PartyPopper className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2
            className={`text-[15px] font-bold leading-6 sm:text-[16px] ${
              approved ? "text-[#285a35]" : "text-[#c16d22]"
            }`}
          >
            {approved
              ? `مبروك! كسبت المزايدة لطلب رقم #${orderNo}`
              : `العميل اختار عرضاً آخر لطلب رقم #${orderNo}`}
          </h2>
          <p className="mt-1 text-[12px] leading-[21px] text-[#657268] sm:text-[13px]">
            {approved
              ? "العميل اختار عرضك. تم إنشاء الطلب تلقائياً في نظام إدارة الطلبات."
              : "تم إغلاق هذه المزايدة تلقائياً. لا يتطلب الأمر أي إجراء من طرفك."}
          </p>

          {approved && (
            <button
              type="button"
              data-testid="button-open-order-from-notification"
              onClick={onOpenOrder}
              className="absolute bottom-4 left-12 inline-flex min-h-10 items-center justify-center rounded-full bg-[#145c4c] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#104b3e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145c4c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eaf5ec]"
            >
              الذهاب لتفاصيل الطلب
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default OrderResponseNotification;
