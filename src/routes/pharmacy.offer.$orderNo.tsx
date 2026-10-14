import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferSubmissionForm, type OfferSubmissionPayload } from "@/components/OfferSubmissionForm";
import { useOrders, useProposeAlternative } from "@/hooks/useOrders";
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
  const proposeAlternative = useProposeAlternative();
  const apiOrder = ordersQuery.data?.data.find((candidate) => candidate.orderNo === orderNo);
  const order = apiOrder ? mapOrder(apiOrder) : null;

  const goBack = () => navigate({ to: "/pharmacy/orders" });
  const handleSubmit = async (payload: OfferSubmissionPayload) => {
    if (!order || !apiOrder) return;
    setSubmitError("");
    try {
      const proposals = Object.entries(payload.alternatives).map(([productName, alternatives]) => {
        const product = order.products.find((candidate) => candidate.name === productName);
        if (!product || !product.productId.trim() || !Number.isFinite(Number(product.productId))) {
          throw new Error("يتعذر إرسال البدائل: معرّف المنتج الأصلي غير متوافق مع عقد API الحالي.");
        }
        const mappedAlternatives = alternatives.map((alternative) => {
          if (!alternative.id.trim() || !Number.isFinite(Number(alternative.id))) {
            throw new Error("يتعذر إرسال البدائل: معرّف منتج المخزون غير متوافق مع عقد API الحالي.");
          }
          return { productId: alternative.id, qty: product.qty };
        });
        return { originalProductId: product.productId, alternatives: mappedAlternatives };
      });

      const result = await proposeAlternative.mutateAsync({
        orderId: apiOrder.id,
        proposals,
      });
      if (!result.success) {
        throw new Error("لم يؤكد الخادم إرسال اقتراح البدائل.");
      }
      goBack();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "تعذر إرسال اقتراح البدائل. يرجى المحاولة مجدداً.",
      );
    }
  };

  if (ordersQuery.isLoading) {
    return (
      <section dir="rtl" className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" /> جارٍ تحميل الطلب...</span>
      </section>
    );
  }

  if (ordersQuery.isError) {
    return (
      <section dir="rtl" className="grid min-h-[60vh] place-items-center">
        <div role="alert" className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <CircleAlert className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">تعذر تحميل الطلب من الخادم.</p>
          <Button type="button" onClick={() => void ordersQuery.refetch()} className="mt-5">إعادة المحاولة</Button>
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
            {editOffer ? "تعديل العرض غير متاح" : "الطلب غير متاح لاقتراح بدائل"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {editOffer
              ? "لا يوجد endpoint لقراءة أو تعديل عرض سابق."
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
      <div role="note" className="mx-auto mb-3 max-w-[1400px] rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-right text-sm text-amber-900">
        endpoint الحالي يرسل بدائل المنتجات فقط. الخصم ووقت/رسوم التوصيل والملاحظات لا تدخل في طلب API ولن تُحفظ. يلزم endpoint خلفي موثق لدعم هذه الحقول.
      </div>
      {submitError && <p role="alert" className="mx-auto mb-3 max-w-[1400px] text-right text-sm text-destructive">{submitError}</p>}
      <OfferSubmissionForm
        order={order}
        onCancel={goBack}
        onSubmit={(payload) => void handleSubmit(payload)}
      />
    </>
  );
}
