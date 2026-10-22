import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferSubmissionForm, type OfferSubmissionPayload } from "@/components/OfferSubmissionForm";
import { useOrders, useSubmitOffer } from "@/hooks/useOrders";
import { useBidDetail } from "@/hooks/useBids";
import type { SubmitOfferRequest } from "@/types";
import { mapOrder } from "./pharmacy.orders";

export const Route = createFileRoute("/pharmacy/offer/$orderNo")({
  head: () => ({ meta: [{ title: "اقتراح بدائل - كبسولة" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    editOffer: search.editOffer === true || search.editOffer === "true",
  }),
  component: OfferPage,
});

function OfferPage() {
  const { orderNo } = Route.useParams();
  const { editOffer } = Route.useSearch();
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState("");

  const ordersQuery = useOrders({ search: orderNo, pageSize: 100 });
  const apiOrder = ordersQuery.data?.data.find((candidate) => candidate.orderNo === orderNo);
  const order = apiOrder ? mapOrder(apiOrder) : null;

  // The bid detail contains item IDs required by unavailableItems.
  const bidDetailQuery = useBidDetail(apiOrder?.id ?? "");
  const submitOffer = useSubmitOffer();

  const goBack = () => navigate({ to: "/pharmacy/orders" });

  const handleSubmit = async (form: OfferSubmissionPayload) => {
    if (!apiOrder || !order) {
      setSubmitError("بيانات الطلب غير مكتملة. يرجى إعادة تحميل الصفحة.");
      return;
    }

    if (!bidDetailQuery.data) {
      setSubmitError("تعذر تحميل تفاصيل الطلب اللازمة لإرسال العرض.");
      return;
    }

    setSubmitError("");

    try {
      const bidItems = bidDetailQuery.data.items ?? [];

      const unavailableItems: SubmitOfferRequest["unavailableItems"] = order.products
        .filter((product) => product.available === false)
        .map((product) => {
          const originalItem = bidItems.find(
            (item) => String(item.productName ?? "").trim() === product.name.trim(),
          );

          if (!originalItem || !Number.isInteger(Number(originalItem.id))) {
            throw new Error(`تعذر تحديد معرّف المنتج المطلوب: ${product.name}`);
          }

          const alternatives = form.alternatives[product.name] ?? [];

          if (alternatives.length === 0) {
            throw new Error(`يرجى اختيار بديل للمنتج غير المتوفر: ${product.name}`);
          }

          const alternativeProductIds = alternatives.map((alternative) => {
            const id = Number(alternative.id);

            if (!Number.isInteger(id) || id <= 0) {
              throw new Error(`معرّف المنتج البديل غير صالح: ${alternative.name}`);
            }

            return id;
          });

          return {
            orderItemId: Number(originalItem.id),
            alternativeProductIds,
          };
        });

      const payload: SubmitOfferRequest = {
        discountPercentage: form.discountPercent,
        preparationMinutes: form.preparationTime,
        deliveryMinutes: form.deliveryTime,
        deliveryFee: form.freeDelivery ? 0 : form.deliveryFee,
        notes: form.notes || null,
        unavailableItems,
      };

      await submitOffer.mutateAsync({
        orderId: String(apiOrder.id),
        payload,
      });

      goBack();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "تعذر إرسال العرض. يرجى المحاولة مرة أخرى.",
      );
    }
  };

  if (ordersQuery.isLoading) {
    return (
      <section dir="rtl" className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          جارٍ تحميل الطلب...
        </span>
      </section>
    );
  }

  if (ordersQuery.isError) {
    return (
      <section dir="rtl" className="grid min-h-[60vh] place-items-center">
        <div
          role="alert"
          className="max-w-md rounded-2xl border border-border bg-card p-8 text-center"
        >
          <CircleAlert className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">تعذر تحميل الطلب من الخادم.</p>
          <Button type="button" onClick={() => void ordersQuery.refetch()} className="mt-5">
            إعادة المحاولة
          </Button>
        </div>
      </section>
    );
  }

  if (!order || order.status !== "open-bidding" || editOffer) {
    return (
      <section dir="rtl" className="grid min-h-[60vh] place-items-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <CircleAlert className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-bold text-foreground">
            {editOffer ? "تعديل العرض غير متاح" : "الطلب غير متاح لتقديم عرض"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {editOffer
              ? "تعديل العرض السابق يحتاج إلى تحميل بيانات العرض الحالي."
              : "قد يكون الطلب مغلقاً أو لا يوجد طلب مطابق."}
          </p>
          <Button type="button" onClick={goBack} className="mt-5 gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة إلى الطلبات
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      {submitError && (
        <p role="alert" className="mx-auto mb-3 max-w-[1400px] text-right text-sm text-destructive">
          {submitError}
        </p>
      )}

      <OfferSubmissionForm
        order={order}
        onCancel={goBack}
        onSubmit={(payload) => void handleSubmit(payload)}
      />
    </>
  );
}
