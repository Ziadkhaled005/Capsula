import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  CircleCheck,
  CreditCard,
  Info,
  Minus,
  MapPin,
  Package,
  Phone,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Order, OrderItem } from "@/routes/pharmacy.orders";
import type { OfferSubmissionPayload } from "@/components/OfferSubmissionForm";
import {
  getSubmittedOfferApproval,
  saveSubmittedOfferApproval,
  type SubmittedOfferApproval,
} from "@/lib/pharmacy-offer-store";
import panadolAdvance from "../../../attached_assets/offer-panadol-advance.png";
import panadolExtra from "../../../attached_assets/offer-panadol-extra.png";
import panadolHeadache from "../../../attached_assets/offer-panadol-headache.png";
import panadolNight from "../../../attached_assets/offer-panadol-night.png";

type OfferSubmittedDialogProps = {
  order: Order;
  payload: OfferSubmissionPayload;
  onClose: () => void;
  onBack: () => void;
  onEdit: () => void;
  onWithdraw: () => void;
  onConfirm: (products: OrderItem[]) => void;
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

function ProductImage({
  name,
  imageUrl,
  className = "",
}: {
  name: string;
  imageUrl?: string;
  className?: string;
}) {
  const source = imageUrl || productImages[name];
  if (!source) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-[#e7e8e5] bg-[#f3f6f4] text-[#7c8981] ${className}`}
      >
        <Package className="h-5 w-5" />
      </span>
    );
  }

  return (
    <img
      src={source}
      alt=""
      aria-hidden="true"
      className={`shrink-0 rounded-md border border-[#e7e8e5] bg-white object-cover ${className}`}
    />
  );
}

export function OfferSubmittedDialog({
  order,
  payload,
  onClose,
  onBack,
  onEdit,
  onWithdraw,
  onConfirm,
}: OfferSubmittedDialogProps) {
  const returningToOrderDetails = useRef(false);
  const [approval, setApproval] = useState<SubmittedOfferApproval>(() =>
    getSubmittedOfferApproval(order.orderNo),
  );
  const products = order.products ?? [];
  const unavailableProducts = products.filter((product) => product.available === false);
  const availableProducts = products.filter((product) => product.available !== false);
  const subtotal = order.subtotal ?? order.price;
  const deliveryFee = payload.freeDelivery ? 0 : payload.deliveryFee;
  const hasSelectedAlternative = Object.keys(approval.selections).length > 0;
  const isEditingOfferAction =
    !payload.discountRemoved &&
    !approval.confirmed &&
    unavailableProducts.length > 0 &&
    !hasSelectedAlternative;
  const isReadyToConfirm = unavailableProducts.every((product) => {
    const alternatives = payload.alternatives[product.name] ?? [];
    const selection = approval.selections[product.name];
    return (
      alternatives.length > 0 &&
      Boolean(selection) &&
      alternatives.some((alternative) => alternative.id === selection.alternativeId) &&
      selection.quantity > 0
    );
  });
  const confirmButtonLabel = approval.confirmed
    ? "تم تأكيد الطلب"
    : isEditingOfferAction
      ? "تعديل العرض"
      : payload.discountRemoved && unavailableProducts.length > 0
        ? "تأكيد البدائل"
        : "تأكيد الطلب";
  const isCustomerOrderConfirmationStep = confirmButtonLabel === "تأكيد الطلب";
  const discountAmount = useMemo(
    () => Math.round(((subtotal * payload.discountPercent) / 100) * 100) / 100,
    [payload.discountPercent, subtotal],
  );
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  useEffect(() => {
    setApproval(getSubmittedOfferApproval(order.orderNo));
  }, [order.orderNo]);

  const updateApproval = (nextApproval: SubmittedOfferApproval) => {
    setApproval(nextApproval);
    saveSubmittedOfferApproval(order.orderNo, nextApproval);
  };

  const chooseAlternative = (productName: string, alternativeId: string) => {
    const currentSelection = approval.selections[productName];
    updateApproval({
      ...approval,
      confirmed: false,
      confirmedProducts: undefined,
      selections: {
        ...approval.selections,
        [productName]: {
          alternativeId,
          quantity:
            currentSelection?.alternativeId === alternativeId ? currentSelection.quantity : 1,
        },
      },
    });
  };

  const changeAlternativeQuantity = (productName: string, delta: number) => {
    const selection = approval.selections[productName];
    if (!selection || approval.confirmed) return;
    updateApproval({
      ...approval,
      confirmedProducts: undefined,
      selections: {
        ...approval.selections,
        [productName]: { ...selection, quantity: Math.max(1, selection.quantity + delta) },
      },
    });
  };

  const confirmOrder = () => {
    if (!isReadyToConfirm || approval.confirmed) return;
    const confirmedProducts = products.flatMap((product) => {
      if (product.available !== false) return [product];

      const selection = approval.selections[product.name];
      const alternative = payload.alternatives[product.name]?.find(
        (item) => item.id === selection?.alternativeId,
      );
      if (!selection || !alternative) return [];

      return [
        {
          name: alternative.name,
          qty: selection.quantity,
          price: alternative.price,
          color: product.color,
          available: true,
        },
      ];
    });
    updateApproval({
      ...approval,
      confirmed: true,
      customerDecision: "pending",
      confirmedProducts,
    });
    onConfirm(confirmedProducts);
  };

  const handleBack = () => {
    returningToOrderDetails.current = true;
    onBack();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !returningToOrderDetails.current) onClose();
      }}
    >
      <DialogContent
        dir="rtl"
        aria-describedby="offer-submitted-description"
        overlayClassName="bg-black/30"
        closeButtonLabel="إغلاق تفاصيل الطلب"
        closeButtonClassName="left-4 right-auto top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#aeb3af] bg-white/90 p-0 text-[#707672] opacity-100 hover:bg-[#f5f6f4] focus:ring-[#6c8c7b]"
        className="left-0 top-0 flex h-[900px] max-h-dvh w-full max-w-[677px] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-lg border-r border-[#e7e8e5] bg-white p-0 text-[#343936] shadow-2xl transition-transform duration-300 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0"
      >
        <header className="flex min-h-[82px] shrink-0 items-center justify-between gap-4 border-b border-[#f0f1ef] px-6 pb-3 pt-4 pl-14 sm:px-7 sm:pl-16">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-[18px] font-semibold leading-6 text-[#323735]">
                تفاصيل الطلب
              </DialogTitle>
              <DialogDescription
                id="offer-submitted-description"
                className="mt-1 text-[12px] text-[#929792]"
              >
                رقم الطلب: <span dir="ltr">#{order.orderNo}</span>
              </DialogDescription>
            </div>
          </div>
          <span className="shrink-0 rounded-lg border border-[#ed7916] bg-white px-3 py-2 text-[12px] font-medium text-[#ed7916]">
            الطلب معلق
          </span>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 sm:pb-5 sm:pt-3">
          <section className="rounded-[14px] border border-[#d9dcd9] px-3 py-4 sm:px-6 sm:py-5">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#363b38]">
              المنتجات
              <span className="text-[12px] font-normal text-[#8c918e]">{order.items}</span>
            </h2>

            {unavailableProducts.length > 0 && (
              <div className="mb-3 rounded-[11px] border border-[#d9dcd9] p-2">
                <div className="mb-2 flex min-h-[70px] items-start gap-2 rounded-md bg-[#fbf4e9] px-3 py-3 text-[#89734e]">
                  <Info className="mt-0.5 h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                  <div className="text-right">
                    <p className="text-[13px] font-semibold">تأكيد المنتج البديل</p>
                    <p className="mt-1 text-[11px] leading-[18px]">
                      {hasSelectedAlternative
                        ? "تم اختيار البديل. حدد الكمية المناسبة من أزرار الكمية أدناه."
                        : "هذا المنتج غير متوفر. اختر البديل المناسب لإكمال الطلب:"}
                    </p>
                  </div>
                </div>

                {unavailableProducts.map((product) => {
                  const alternatives = payload.alternatives[product.name] ?? [];
                  return (
                    <div key={product.name} className="py-1">
                      <div className="flex min-h-[69px] items-center gap-2.5">
                        <ProductImage name={product.name} className="h-11 w-11" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{product.name}</p>
                          <p className="mt-1 text-[11px] text-[#888e8a]">
                            الكمية: {product.qty} شريط
                          </p>
                        </div>
                        <div className="flex min-w-[74px] flex-col items-end gap-1.5">
                          <span className="rounded-md border border-[#e8e8e5] px-2 py-1 text-[10px] text-[#989d99]">
                            غير متوفر
                          </span>
                          <span dir="ltr" className="whitespace-nowrap text-[12px] text-[#6f7571]">
                            {money(product.price)} ج.م
                          </span>
                        </div>
                      </div>

                      {alternatives.length ? (
                        alternatives.map((alternative, index) => (
                          <div
                            key={`${alternative.name}-${index}`}
                            className="flex min-h-[69px] items-center gap-2.5 border-t border-[#f0f0ed] pr-2"
                          >
                            <ProductImage
                              name={alternative.name}
                              imageUrl={alternative.imageUrl}
                              className="h-11 w-11"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium">{alternative.name}</p>
                              <p className="mt-1 text-[11px] text-[#888e8a]">
                                الكمية:{" "}
                                {approval.selections[product.name]?.alternativeId === alternative.id
                                  ? approval.selections[product.name].quantity
                                  : product.qty}{" "}
                                شريط
                              </p>
                            </div>
                            <div className="flex min-w-[105px] flex-col items-end gap-1.5">
                              {approval.selections[product.name]?.alternativeId ===
                              alternative.id ? (
                                <div
                                  dir="ltr"
                                  aria-label={`كمية البديل ${alternative.name}`}
                                  className="inline-flex items-center gap-3"
                                >
                                  <button
                                    type="button"
                                    aria-label={`زيادة كمية ${alternative.name}`}
                                    disabled={approval.confirmed}
                                    onClick={() => changeAlternativeQuantity(product.name, 1)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ed7916] bg-[#ed7916] p-2 text-white shadow-sm transition-colors hover:bg-[#d86b10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ed7916] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                  <span
                                    aria-live="polite"
                                    className="w-5 text-center text-[16px] font-semibold text-[#343936]"
                                  >
                                    {approval.selections[product.name].quantity}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label={`تقليل كمية ${alternative.name}`}
                                    disabled={
                                      approval.confirmed ||
                                      approval.selections[product.name].quantity <= 1
                                    }
                                    onClick={() => changeAlternativeQuantity(product.name, -1)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#747a80] bg-white p-2 text-[#343936] transition-colors hover:bg-[#f5f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#747a80] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    <Minus className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  aria-disabled="true"
                                  tabIndex={-1}
                                  aria-pressed={false}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                    }
                                  }}
                                  onClick={() => chooseAlternative(product.name, alternative.id)}
                                  className="pointer-events-none whitespace-nowrap rounded-full bg-[#145c4c] px-2.5 py-1.5 text-[10px] font-medium text-white opacity-60"
                                >
                                  تأكيد هذا البديل
                                </button>
                              )}
                              {"price" in alternative && typeof alternative.price === "number" && (
                                <span
                                  dir="ltr"
                                  className="whitespace-nowrap text-[12px] text-[#6f7571]"
                                >
                                  {money(alternative.price)} ج.م
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="px-2 pb-2 text-[11px] text-[#9b7a49]">
                          لم يتم إرفاق بديل لهذا المنتج
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="divide-y divide-[#f0f1ef]">
              {availableProducts.map((product) => (
                <div key={product.name} className="flex min-h-[86px] items-center gap-2.5 py-2">
                  <ProductImage name={product.name} className="h-11 w-11" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{product.name}</p>
                    <p className="mt-1 text-[11px] text-[#888e8a]">الكمية: {product.qty} شريط</p>
                  </div>
                  <span dir="ltr" className="shrink-0 whitespace-nowrap text-[12px] text-[#6f7571]">
                    {money(product.price)} ج.م
                  </span>
                </div>
              ))}
              {products.length === 0 && (
                <p className="py-5 text-center text-[12px] text-[#858b87]">
                  لا توجد تفاصيل منتجات لهذا الطلب
                </p>
              )}
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            <section className="rounded-[14px] border border-[#d9dcd9] px-4 py-4 sm:px-5">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold">
                <ReceiptText className="h-4 w-4 text-[#777e79]" aria-hidden="true" />
                ملخص التكلفة
              </h2>
              <div className="space-y-4 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#656b67]">المجموع الفرعي</span>
                  <span dir="ltr" className="whitespace-nowrap text-[#555b57]">
                    {money(subtotal)} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#656b67]">رسوم التوصيل</span>
                  <span dir="ltr" className="whitespace-nowrap text-[#555b57]">
                    {money(deliveryFee)} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#656b67]">خصم الصيدلية</span>
                  <span dir="ltr" className="whitespace-nowrap text-[#3b875e]">
                    − {money(discountAmount)} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#656b67]">وقت التوصيل</span>
                  <span className="whitespace-nowrap text-[#555b57]">
                    {payload.deliveryTime} دقيقة
                  </span>
                </div>
                {payload.notes && (
                  <div className="border-t border-[#eff0ee] pt-2 text-[#747a76]">
                    ملاحظات: {payload.notes}
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between gap-3 border-t border-[#eceeeb] pt-3 font-semibold">
                  <span>
                    {payload.discountRemoved ? "الإجمالي بدون خصم" : "الإجمالي بعد العرض"}
                  </span>
                  <span dir="ltr" className="whitespace-nowrap text-[#2f8052]">
                    {money(total)} ج.م
                  </span>
                </div>
                {payload.freeDelivery && (
                  <p className="inline-flex items-center gap-1 text-[10px] text-[#3b875e]">
                    <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                    التوصيل مجاني
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[14px] border border-[#d9dcd9] px-4 py-4 sm:px-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-bold">العميل</h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#e58b40]">
                  <CircleCheck className="h-4 w-4" aria-hidden="true" />
                  {approval.confirmed
                    ? "تم تأكيد الطلب — الطلب معلق"
                    : hasSelectedAlternative
                      ? "الخطوة التالية: تحديد كمية البديل"
                      : "الخطوة التالية: تأكيد البديل"}
                </span>
              </div>
              <div className="space-y-3 text-[12px]">
                <p className="font-medium text-[#4a504c]">{order.customer}</p>
                <p className="flex items-center gap-2 text-[#929793]">
                  <Phone className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                  <span dir="ltr">{order.phone}</span>
                </p>
                <p className="flex items-center gap-2 text-[#929793]">
                  {order.payment === "cash" ? (
                    <Wallet className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                  ) : (
                    <CreditCard className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                  )}
                  <span>{order.payment === "cash" ? "نقد" : "بطاقة ائتمان"}</span>
                  <span className="text-[#d1d4d1]">·</span>
                  <Clock3 className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                  <span>{order.time}</span>
                </p>
                <p className="flex items-start gap-2 leading-5 text-[#929793]">
                  <MapPin className="mt-0.5 h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                  <span>
                    {order.address}
                    {order.addressDetail ? `، ${order.addressDetail}` : ""}
                  </span>
                </p>
              </div>
            </section>
          </div>
        </div>

        <footer className="z-10 flex min-h-[68px] shrink-0 items-center justify-between gap-2 border-t border-[#e8e9e7] bg-white px-4 py-2.5 shadow-[0_-4px_12px_rgba(35,42,37,.035)] sm:px-5">
          {!payload.discountRemoved && (
            <button
              type="button"
              onClick={onWithdraw}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium text-[#b84f4d] transition-colors hover:bg-[#fff1ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf6e67]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              سحب العرض
            </button>
          )}
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={handleBack}
              className="h-10 shrink-0 rounded-full px-2 text-[11px] font-medium text-[#707672] transition-colors hover:bg-[#f5f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aab0ac] sm:px-3 sm:text-[12px]"
            >
              الرجوع
            </button>
            <div className="flex shrink-0 flex-col items-center gap-0.5">
              <button
                type="button"
                data-testid="button-confirm-order"
                aria-disabled={isCustomerOrderConfirmationStep || undefined}
                tabIndex={isCustomerOrderConfirmationStep ? -1 : undefined}
                disabled={
                  approval.confirmed ||
                  (payload.discountRemoved
                    ? !isReadyToConfirm
                    : hasSelectedAlternative && !isReadyToConfirm)
                }
                onKeyDown={
                  isCustomerOrderConfirmationStep
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                        }
                      }
                    : undefined
                }
                onClick={isEditingOfferAction ? onEdit : confirmOrder}
                className={`inline-flex h-10 items-center justify-center rounded-full bg-[#ed7916] px-4 text-[12px] font-medium text-white transition-colors hover:bg-[#d86b10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ed7916] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#c6cbc7] sm:px-5 sm:text-[13px] ${
                  isCustomerOrderConfirmationStep ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {confirmButtonLabel}
              </button>
            </div>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

export default OfferSubmittedDialog;
