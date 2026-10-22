import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Clock3, TriangleAlert } from "lucide-react";
import type { Order, OrderItem } from "@/routes/pharmacy.orders";
import type { InventoryItem } from "@/types";
import { InventoryAlternativePicker } from "@/components/InventoryAlternativePicker";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import panadolAdvance from "../../attached_assets/offer-panadol-advance.png";
import panadolExtra from "../../attached_assets/offer-panadol-extra.png";
import panadolHeadache from "../../attached_assets/offer-panadol-headache.png";
import panadolNight from "../../attached_assets/offer-panadol-night.png";

export type OfferSubmissionPayload = {
  discountPercent: number;
  discountRemoved?: boolean;
  preparationTime?: number;
  deliveryTime: number;
  deliveryFee: number;
  freeDelivery: boolean;
  notes: string;
  alternatives: Record<string, InventoryItem[]>;
};

type OfferSubmissionFormProps = {
  order: Order;
  isEditing?: boolean;
  initialPayload?: OfferSubmissionPayload;
  onCancel: () => void;
  onWithdraw?: () => void;
  onSubmit: (payload: OfferSubmissionPayload) => void;
};

const productImages: Record<string, string> = {
  "باندول ادفانس": panadolAdvance,
  "باندول نايت": panadolNight,
  "باندول اكسترا": panadolExtra,
  "باندول صداع نصفي": panadolHeadache,
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const MAX_DISCOUNT_PERCENT = 15;

function filterNumericInput(value: string, allowDecimal = false) {
  const normalized = value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));

  const filtered = normalized
    .replace(/[٫,]/g, ".")
    .replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");

  if (!allowDecimal) return filtered;

  const [integerPart, ...decimalParts] = filtered.split(".");

  return decimalParts.length ? `${integerPart}.${decimalParts.join("")}` : integerPart;
}

function ProductRow({ product }: { product: OrderItem }) {
  return (
    <div className="flex min-h-[48px] items-center gap-2.5 text-right">
      <img
        src={productImages[product.name]}
        alt=""
        aria-hidden="true"
        className="h-11 w-11 shrink-0 rounded-md border border-[#e5e8e6] object-cover"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#363b3a]">{product.name}</p>
        <p className="mt-0.5 text-[11px] text-[#858b88]">الكمية: {product.qty} شريط</p>
      </div>

      <span dir="ltr" className="shrink-0 text-xs text-[#606663]">
        {money(product.price)} ج.م
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[13px] leading-5">
      <span className="shrink-0 text-[#656b68]">{label}:</span>
      <span className="min-w-0 text-left text-[#404643]">{value}</span>
    </div>
  );
}

export function OfferSubmissionForm({
  order,
  isEditing = false,
  initialPayload,
  onCancel,
  onWithdraw,
  onSubmit,
}: OfferSubmissionFormProps) {
  const [discountPercent, setDiscountPercent] = useState("");
  const [preparationTime, setPreparationTime] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [notes, setNotes] = useState("");
  const [alternatives, setAlternatives] = useState<Record<string, InventoryItem[]>>({});
  const [missingAlternativeNames, setMissingAlternativeNames] = useState<string[]>([]);
  const [requestedProduct, setRequestedProduct] = useState<OrderItem | null>(null);
  const [withdrawConfirmationOpen, setWithdrawConfirmationOpen] = useState(false);

  const discountExceedsLimit = Number(discountPercent) > MAX_DISCOUNT_PERCENT;

  useEffect(() => {
    if (!initialPayload) return;

    setDiscountPercent(String(initialPayload.discountPercent));
    setPreparationTime(
      initialPayload.preparationTime == null ? "" : String(initialPayload.preparationTime),
    );
    setDeliveryTime(String(initialPayload.deliveryTime));
    setDeliveryFee(String(initialPayload.deliveryFee));
    setFreeDelivery(initialPayload.freeDelivery);
    setNotes(initialPayload.notes);
    setAlternatives(initialPayload.alternatives);
    setMissingAlternativeNames([]);
  }, [initialPayload]);

  const availableProducts = (order.products ?? []).filter((product) => product.available !== false);

  const unavailableProducts = (order.products ?? []).filter(
    (product) => product.available === false,
  );

  const offerInputClassName = isEditing
    ? "h-9 w-full rounded-[9px] border border-[#628173] bg-white px-3 text-[13px] outline-none transition focus:border-[#285849] focus:ring-2 focus:ring-[#285849]/10"
    : "h-[42px] w-full rounded-xl border border-[#e2e6e3] bg-white px-3 text-sm outline-none transition focus:border-[#6e9b84] focus:ring-2 focus:ring-[#6e9b84]/15";

  const discountInputClassName = isEditing
    ? discountExceedsLimit
      ? "h-9 w-full rounded-[9px] border border-[#f04444] bg-white px-3 text-[13px] outline-none transition focus:border-[#f04444] focus:ring-2 focus:ring-[#f04444]/10"
      : offerInputClassName
    : discountExceedsLimit
      ? "h-[42px] w-full rounded-xl border border-[#f04444] bg-white px-3 text-sm outline-none transition focus:border-[#f04444] focus:ring-2 focus:ring-[#f04444]/15"
      : offerInputClassName;

  const discountedPrice = useMemo(() => {
    const discount = Number(discountPercent) || 0;
    return Math.max(0, order.price - (order.price * discount) / 100);
  }, [discountPercent, order.price]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missingAlternatives = unavailableProducts.filter(
      (product) => !alternatives[product.name]?.length,
    );

    const preparationMinutes = Number(preparationTime);
    const deliveryMinutes = Number(deliveryTime);
    const deliveryFeeAmount = Number(deliveryFee);

    setMissingAlternativeNames(missingAlternatives.map((product) => product.name));

    if (
      discountExceedsLimit ||
      preparationTime.trim() === "" ||
      !Number.isFinite(preparationMinutes) ||
      preparationMinutes < 1 ||
      deliveryTime.trim() === "" ||
      !Number.isFinite(deliveryMinutes) ||
      deliveryMinutes < 1 ||
      (!freeDelivery &&
        (!Number.isFinite(deliveryFeeAmount) ||
          deliveryFee.trim() === "" ||
          deliveryFeeAmount < 0)) ||
      missingAlternatives.length > 0
    ) {
      return;
    }

    onSubmit({
      discountPercent: Number(discountPercent) || 0,
      preparationTime: preparationMinutes,
      deliveryTime: deliveryMinutes,
      deliveryFee: freeDelivery ? 0 : deliveryFeeAmount,
      freeDelivery,
      notes: notes.trim(),
      alternatives,
    });
  };

  return (
    <section
      dir="rtl"
      className={`mx-auto flex w-full max-w-[1400px] flex-col text-[#343a37] ${
        isEditing ? "min-h-[calc(100vh-28px)] gap-2.5" : "min-h-[calc(100vh-4rem)] gap-3"
      }`}
    >
      <header
        className={`flex flex-col items-stretch justify-center gap-3 bg-white px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 ${
          isEditing ? "min-h-14 rounded-[14px]" : "min-h-[68px] rounded-sm"
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start sm:gap-4">
          <h1 className="shrink-0 text-lg font-medium sm:text-2xl">
            {isEditing ? "تعديل العرض" : "تقديم عرض"}
          </h1>

          {isEditing ? (
            <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#e8f2ed] px-2.5 py-1.5 text-[10px] font-medium text-[#4d7462]">
              عرض مقدم — في انتظار العميل
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#fff4eb] px-2.5 py-2 text-xs font-medium text-[#e87512] sm:px-3">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              <span>الوقت المتبقي ({order.remaining})</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className={`shrink-0 self-end rounded-lg bg-[#e2eee8] text-[#557164] transition-colors hover:bg-[#d6e8df] sm:self-auto ${
            isEditing ? "px-3 py-1.5 text-xs" : "px-5 py-2 text-sm"
          }`}
        >
          الرجوع
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className={`flex flex-1 flex-col bg-[#f2f5f3] ${
          isEditing ? "p-2 sm:px-4 sm:py-2" : "p-3 sm:p-4"
        }`}
      >
        <div
          className={`flex flex-1 flex-col bg-white ${
            isEditing ? "px-4 pt-4 pb-5 sm:px-0" : "px-4 py-5 sm:px-5"
          }`}
        >
          <div
            className={`grid flex-1 content-start gap-8 lg:gap-12 ${
              isEditing
                ? "lg:grid-cols-[minmax(0,1.88fr)_minmax(0,1fr)]"
                : "lg:grid-cols-[minmax(0,1.9fr)_minmax(270px,0.95fr)]"
            }`}
          >
            <div className="min-w-0">
              {discountExceedsLimit && (
                <div
                  id="discount-limit-alert"
                  data-testid="alert-discount-over-limit"
                  role="alert"
                  className="mb-5 flex min-h-[47px] items-center gap-2.5 rounded-xl border border-[#efaaaa] bg-[#f5dddd] px-3.5 py-2.5 text-[11px] leading-[18px] text-[#f04444]"
                >
                  <TriangleAlert className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span>
                    الخصم المدخل يتجاوز الحد المسموح به ({MAX_DISCOUNT_PERCENT}%). يرجى تقليل نسبة
                    الخصم.
                  </span>
                </div>
              )}

              <h2 className={`text-lg font-bold text-[#353b38] ${isEditing ? "mb-4" : "mb-5"}`}>
                {isEditing ? "تعديل العرض" : `تقديم العرض — طلب #${order.orderNo}`}
              </h2>

              <div className={isEditing ? "space-y-2" : "space-y-4"}>
                <label className="block text-[13px] font-medium">
                  <span className={`${isEditing ? "mb-1" : "mb-2"} block`}>نسبة الخصم (%)</span>

                  <input
                    id="discount-percent"
                    data-testid="input-discount-percent"
                    type="text"
                    inputMode="decimal"
                    value={discountPercent}
                    onChange={(event) =>
                      setDiscountPercent(filterNumericInput(event.target.value, true))
                    }
                    placeholder="مثال: 10"
                    aria-invalid={discountExceedsLimit}
                    aria-describedby={
                      discountExceedsLimit
                        ? "discount-limit-note discount-limit-alert"
                        : "discount-limit-note"
                    }
                    className={discountInputClassName}
                  />

                  <span
                    id="discount-limit-note"
                    data-testid="text-discount-limit"
                    className={`${isEditing ? "mt-1" : "mt-1.5"} block text-[11px] font-normal ${
                      discountExceedsLimit ? "text-[#f04444]" : "text-[#777e7a]"
                    }`}
                  >
                    {discountExceedsLimit
                      ? `الحد الأقصى المسموح: ${MAX_DISCOUNT_PERCENT}%`
                      : isEditing
                        ? `الحد الأقصى: ${MAX_DISCOUNT_PERCENT}%`
                        : `الحد الأقصى للخصم: ${MAX_DISCOUNT_PERCENT}% (تحدده الإدارة)`}
                  </span>
                </label>

                {/* Preparation time — required by the backend offer request */}
                <label className="block text-[13px] font-medium">
                  <span className={`${isEditing ? "mb-1" : "mb-2"} block`}>
                    وقت التجهيز (بالدقائق)
                  </span>

                  <input
                    id="preparation-time"
                    data-testid="input-preparation-time"
                    type="text"
                    required
                    inputMode="numeric"
                    value={preparationTime}
                    onChange={(event) => setPreparationTime(filterNumericInput(event.target.value))}
                    placeholder="مثال: 15"
                    className={offerInputClassName}
                  />

                  {!isEditing && (
                    <span className="mt-1.5 block text-[11px] font-normal text-[#777e7a]">
                      أدخل الوقت المتوقع لتجهيز الطلب قبل التوصيل
                    </span>
                  )}
                </label>

                <label className="block text-[13px] font-medium">
                  <span className={`${isEditing ? "mb-1" : "mb-2"} block`}>
                    وقت التوصيل (بالدقائق)
                  </span>

                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={deliveryTime}
                    onChange={(event) => setDeliveryTime(filterNumericInput(event.target.value))}
                    placeholder="مثال: 30"
                    className={offerInputClassName}
                  />

                  {!isEditing && (
                    <span className="mt-1.5 block text-[11px] font-normal text-[#777e7a]">
                      التزم بوقت واقعي لتجنب التقييم السلبي
                    </span>
                  )}
                </label>

                <label className="block text-[13px] font-medium">
                  <span className={`${isEditing ? "mb-1" : "mb-2"} block`}>رسوم التوصيل (ج.م)</span>

                  <input
                    type="text"
                    required={!freeDelivery}
                    inputMode="decimal"
                    value={deliveryFee}
                    onChange={(event) =>
                      setDeliveryFee(filterNumericInput(event.target.value, true))
                    }
                    placeholder="مثال: 15"
                    disabled={freeDelivery}
                    className={`${offerInputClassName} placeholder:text-[#a4aaa7] disabled:bg-white`}
                  />
                </label>

                <div className="flex items-center gap-3 text-[13px]">
                  <span>توصيل مجاني</span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={freeDelivery}
                    aria-label="توصيل مجاني"
                    onClick={() => setFreeDelivery((current) => !current)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      freeDelivery ? "bg-[#285849]" : isEditing ? "bg-[#c9d1cd]" : "bg-[#e1e4e2]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                        freeDelivery ? "right-0.5" : "right-[18px]"
                      }`}
                    />
                  </button>
                </div>

                <label className="block text-[13px] font-medium">
                  <span className={`${isEditing ? "mb-1" : "mb-2"} block`}>ملاحظات (اختياري)</span>

                  <input
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={isEditing ? "-" : "أضف ملاحظات للعميل..."}
                    className={`${offerInputClassName} placeholder:text-[#a4aaa7]`}
                  />
                </label>

                {!isEditing && (
                  <div className="flex min-h-[58px] items-center justify-between rounded-xl bg-[#e1eee7] px-4 text-sm">
                    <span className="font-medium">السعر بعد الخصم:</span>

                    <strong dir="ltr" className="text-base font-bold text-[#16831b]">
                      {money(discountedPrice)} ج.م
                    </strong>
                  </div>
                )}
              </div>
            </div>

            <aside className="ml-[10px] mr-[0px] min-w-0 pl-[0px] pr-[0px] lg:pt-1">
              {isEditing ? (
                <>
                  <h3 className="mb-5 text-center text-[15px] font-medium">العرض الحالي</h3>

                  <div className="space-y-2">
                    <DetailRow label="نسبة الخصم" value={`${discountPercent || 0}%`} />

                    <DetailRow
                      label="السعر بعد الخصم"
                      value={
                        <span dir="ltr" className="font-medium text-[#67a277]">
                          {money(discountedPrice)} ج.م
                        </span>
                      }
                    />

                    <DetailRow label="وقت التجهيز" value={`${preparationTime || 0} دقيقة`} />

                    <DetailRow label="وقت التوصيل" value={`${deliveryTime || 0} دقيقة`} />

                    <DetailRow
                      label="رسوم التوصيل"
                      value={
                        freeDelivery ? (
                          <span className="font-medium text-[#67a277]">مجاني</span>
                        ) : (
                          <span dir="ltr">{money(Number(deliveryFee) || 0)} ج.م</span>
                        )
                      }
                    />

                    <DetailRow
                      label="تاريخ التقديم"
                      value={`اليوم ${order.time.replace(/^0/, "")}`}
                    />
                  </div>

                  <div className="mt-0 rounded-[10px] border border-[#f0ddc8] bg-[#fff6eb] px-3.5 py-2 text-[10px] leading-[1.6] text-[#66605a]">
                    <h4 className="mb-1 flex items-center gap-1.5 font-semibold text-[#df8a17]">
                      <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                      تنبيه
                    </h4>

                    <p>سحب العرض بشكل متكرر يؤثر على تقييم الصيدلية وسمعتها لدى العميل.</p>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mb-4 text-center text-base font-medium">تفاصيل الطلب</h3>

                  <div className="space-y-2.5 border-b border-[#eceeec] pb-4">
                    <DetailRow label="اسم العميل" value={order.customer} />

                    <DetailRow label="رقم الطلب" value={`#${order.orderNo}`} />

                    <DetailRow label="عدد المنتجات" value={`${order.items} منتجات`} />

                    <DetailRow
                      label="طريقة الدفع"
                      value={order.payment === "cash" ? "نقد" : "بطاقة ائتمان"}
                    />

                    <DetailRow label="العنوان" value={order.address} />

                    <DetailRow
                      label="المبلغ الأصلي"
                      value={<span dir="ltr">{money(order.price)} ج.م</span>}
                    />
                  </div>

                  <section className="pt-4">
                    <h3 className="mb-3 text-center text-sm font-medium">المنتجات المطلوبة</h3>

                    <div className="space-y-2.5">
                      {availableProducts.map((product) => (
                        <ProductRow key={product.name} product={product} />
                      ))}
                    </div>
                  </section>

                  {unavailableProducts.length > 0 && (
                    <section className="pt-4">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                        منتجات غير متوفرة
                        <span className="text-[11px] text-[#777e7a]">
                          {unavailableProducts.length}
                        </span>
                      </h3>

                      <p className="mb-2 text-[11px] leading-4 text-[#89908c]">
                        اختر بديلاً لكل منتج غير متوفر قبل الإرسال
                      </p>

                      {missingAlternativeNames.length > 0 && (
                        <p
                          role="alert"
                          className="mb-2 rounded-lg border border-[#efaaaa] bg-[#fff2f1] px-3 py-2 text-[11px] leading-4 text-[#c64b47]"
                        >
                          يرجى اختيار بديل لكل منتج غير متوفر قبل إرسال العرض.
                        </p>
                      )}

                      <div className="space-y-2">
                        {unavailableProducts.map((product) => (
                          <div key={product.name} className="space-y-2">
                            <div className="flex min-h-[58px] items-center gap-2 rounded-xl border border-[#e5e8e6] px-2.5 py-2">
                              <img
                                src={productImages[product.name]}
                                alt=""
                                aria-hidden="true"
                                className="h-10 w-10 shrink-0 rounded-md border border-[#e5e8e6] object-cover"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">{product.name}</p>

                                <p className="mt-0.5 text-[10px] text-[#89908c]">
                                  الكمية: {product.qty} شريط
                                </p>
                              </div>

                              <span className="rounded-md bg-[#fff2e8] px-1.5 py-1 text-[10px] text-[#e87512]">
                                غير متوفر
                              </span>

                              <button
                                type="button"
                                onClick={() => setRequestedProduct(product)}
                                className="shrink-0 text-[11px] font-medium text-[#285849] underline underline-offset-2"
                              >
                                {alternatives[product.name]?.length ? "تغيير البديل" : "تقديم بديل"}
                              </button>
                            </div>

                            {alternatives[product.name]?.length > 0 && (
                              <div className="rounded-lg border border-[#d6e7dd] bg-[#f0f7f3] px-3 py-2 text-xs">
                                <span className="text-[#68766e]">البدائل المختارة: </span>

                                <span className="font-medium text-[#285849]">
                                  {alternatives[product.name]
                                    .map((alternative) => alternative.name)
                                    .join("، ")}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </aside>
          </div>

          <div
            className={`mt-6 flex items-center gap-2 pt-4 ${
              isEditing
                ? "justify-start border-0 lg:mt-auto"
                : "border-t border-[#f0f1f0] lg:mt-3 lg:justify-start lg:border-0 lg:pt-0"
            }`}
          >
            <button
              type="submit"
              className={`inline-flex items-center justify-center rounded-full bg-[#ee7917] font-medium text-white transition-colors hover:bg-[#d96b11] ${
                isEditing ? "h-8 w-[98px] whitespace-nowrap px-3 text-[12px]" : "h-10 px-6 text-sm"
              }`}
            >
              {isEditing ? "تحديث العرض" : "تقديم العرض"}
            </button>

            {isEditing ? (
              <button
                type="button"
                onClick={() => setWithdrawConfirmationOpen(true)}
                className="inline-flex h-8 w-[96px] items-center justify-center whitespace-nowrap rounded-full border border-[#dda2a2] bg-white px-2 text-[12px] font-medium text-[#c76d6d] transition-colors hover:bg-[#fff6f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c76d6d]"
              >
                سحب العرض
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#e4e7e5] bg-white px-6 text-sm font-medium text-[#515855] transition-colors hover:bg-[#f7f8f7]"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      </form>

      <Dialog open={withdrawConfirmationOpen} onOpenChange={setWithdrawConfirmationOpen}>
        <DialogContent
          dir="rtl"
          aria-describedby="withdraw-offer-description"
          overlayClassName="bg-black/80"
          closeButtonLabel="إغلاق نافذة التأكيد"
          closeButtonClassName="left-5 right-auto top-5 flex h-7 w-7 items-center justify-center rounded-full border border-[#8a8f8c] bg-white p-0 text-[#525754] opacity-100 hover:bg-[#f5f6f5]"
          className="flex h-[188px] w-[min(444px,calc(100vw-32px))] max-w-none flex-col gap-0 overflow-hidden rounded-lg border border-[#e0e1df] bg-white p-0 text-[#343936] shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        >
          <div className="h-[136px] shrink-0 px-6 pb-4 pt-5 text-right">
            <DialogTitle className="text-[22px] font-normal leading-8">
              هل أنت متأكد من سحب العرض؟
            </DialogTitle>

            <DialogDescription
              id="withdraw-offer-description"
              className="mt-5 text-right text-[15px] leading-6 text-[#373d39]"
            >
              سحب العرض بشكل متكرر سيؤثر سلباً على تقييم صيدليتك. هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </div>

          <div
            dir="ltr"
            className="flex h-[52px] shrink-0 items-center justify-start gap-3 border-t border-[#dedfdf] px-4"
          >
            <button
              type="button"
              onClick={() => {
                setWithdrawConfirmationOpen(false);
                (onWithdraw ?? onCancel)();
              }}
              className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-[#bd1e22] px-4 text-[16px] font-medium text-white shadow-sm transition-colors hover:bg-[#a9181b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd1e22] focus-visible:ring-offset-2"
            >
              نعم، اسحب العرض
            </button>

            <button
              type="button"
              onClick={() => setWithdrawConfirmationOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-md px-2 text-[15px] font-medium text-[#53645c] transition-colors hover:bg-[#f5f6f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#53645c] focus-visible:ring-offset-2"
            >
              الرجوع
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {requestedProduct && (
        <InventoryAlternativePicker
          requestedProduct={requestedProduct}
          onClose={() => setRequestedProduct(null)}
          onChoose={(selectedAlternatives) => {
            setAlternatives((current) => ({
              ...current,
              [requestedProduct.name]: selectedAlternatives,
            }));

            setMissingAlternativeNames((current) =>
              current.filter((name) => name !== requestedProduct.name),
            );

            setRequestedProduct(null);
          }}
        />
      )}
    </section>
  );
}
