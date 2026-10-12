import { Clock3, PackageCheck, ShieldCheck, ShoppingBag } from "lucide-react";

type CustomerOrderConfirmationProps = {
  orderNo: string;
  customerName: string;
  products: { name: string; qty: number; price: number }[];
  total: number;
  deliveryTime: number;
  onApprove(): void;
  onDecline(): void;
};

const money = (amount: number) =>
  new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export function CustomerOrderConfirmation({
  orderNo,
  customerName,
  products,
  total,
  deliveryTime,
  onApprove,
  onDecline,
}: CustomerOrderConfirmationProps) {
  return (
    <main
      dir="rtl"
      data-testid="customer-order-confirmation"
      className="min-h-[100dvh] bg-[#f4f7f3] px-4 py-6 text-[#303a34] sm:flex sm:items-center sm:justify-center sm:px-6"
    >
      <section className="mx-auto w-full max-w-[480px] overflow-hidden rounded-[24px] border border-[#e1e9e2] bg-[#fffefa] shadow-[0_18px_50px_rgba(43,75,54,0.09)]">
        <header className="relative overflow-hidden bg-[#145c4c] px-5 pb-6 pt-7 text-white sm:px-7">
          <div
            aria-hidden="true"
            className="absolute -left-8 -top-12 h-40 w-40 rounded-full border-[24px] border-white/5"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium text-[#c8ded2]">Capsoula · صيدليتك أقرب</p>
              <h1 className="mt-3 text-[23px] font-bold leading-[1.35]">راجع عرض طلبك</h1>
              <p className="mt-1.5 text-[13px] leading-6 text-[#e1eee6]">
                أهلاً {customerName}، تأكد من التفاصيل قبل تأكيد الطلب.
              </p>
            </div>
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <PackageCheck className="h-6 w-6" aria-hidden="true" />
            </span>
          </div>
          <div className="relative mt-5 flex items-center justify-between border-t border-white/15 pt-4 text-[12px]">
            <span className="text-[#c8ded2]">رقم الطلب</span>
            <span dir="ltr" className="font-semibold tracking-wide text-white">
              #{orderNo}
            </span>
          </div>
        </header>

        <div className="px-5 py-5 sm:px-7">
          <div className="mb-3 flex items-center gap-2 text-[14px] font-bold">
            <ShoppingBag className="h-[17px] w-[17px] text-[#ed7916]" aria-hidden="true" />
            المنتجات المقترحة
            <span className="mr-auto rounded-full bg-[#f3f6f1] px-2.5 py-1 text-[11px] font-medium text-[#7a887e]">
              {products.length} منتجات
            </span>
          </div>

          {products.length > 0 ? (
            <ul className="divide-y divide-[#edf0eb] rounded-2xl border border-[#e7ece6] px-3">
              {products.map((product, index) => (
                <li
                  key={`${product.name}-${index}`}
                  data-testid={`confirmation-product-${index}`}
                  className="flex min-h-[66px] items-center gap-3 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3f6f1] text-[#638270]">
                    <PackageCheck className="h-[17px] w-[17px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{product.name}</p>
                    <p className="mt-1 text-[11px] text-[#89948c]">الكمية: {product.qty}</p>
                  </div>
                  <span dir="ltr" className="shrink-0 text-[12px] font-medium text-[#4c5a50]">
                    {money(product.price)} ج.م
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#dce5dc] bg-[#f8faf7] px-4 py-6 text-center text-[13px] text-[#818d83]">
              لا توجد منتجات لعرضها
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#f5f7f2] px-4 py-3.5">
            <div>
              <p className="text-[11px] text-[#7c887f]">الإجمالي</p>
              <p dir="ltr" className="mt-1 text-[19px] font-bold text-[#145c4c]">
                {money(total)} <span className="text-[12px] font-medium">ج.م</span>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#e2e9df] bg-[#fffefa] px-3 py-2.5 text-[11px] font-medium text-[#65776a]">
              <Clock3 className="h-4 w-4 text-[#ed7916]" aria-hidden="true" />
              التوصيل خلال {deliveryTime} دقيقة
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#879188]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#5f9270]" aria-hidden="true" />
            لن يتم تأكيد الطلب إلا بعد موافقتك على العرض.
          </p>
        </div>

        <footer className="flex flex-col gap-2.5 border-t border-[#edf0eb] bg-[#fffefa] px-5 py-4 sm:flex-row sm:px-7">
          <button
            type="button"
            data-testid="button-approve-customer-order"
            onClick={onApprove}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#145c4c] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[#104b3e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145c4c] focus-visible:ring-offset-2"
          >
            موافق على العرض
          </button>
          <button
            type="button"
            data-testid="button-decline-customer-order"
            onClick={onDecline}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[#e6e7e2] bg-[#fffefa] px-5 text-[13px] font-semibold text-[#777e78] transition-colors hover:border-[#edc9a7] hover:bg-[#fff8f1] hover:text-[#c66b20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ed7916] focus-visible:ring-offset-2"
          >
            لا يناسبني
          </button>
        </footer>
      </section>
    </main>
  );
}

export default CustomerOrderConfirmation;
