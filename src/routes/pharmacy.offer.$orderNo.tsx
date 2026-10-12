import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferSubmissionForm, type OfferSubmissionPayload } from "@/components/OfferSubmissionForm";
import { OfferSuccessDialog } from "@/components/OfferSuccessDialog";
import { initialOrders } from "./pharmacy.orders";
import { saveOrderStatus, withSavedOrderStatuses } from "@/lib/pharmacy-order-status-store";
import { initializeSampleOrdersAtOpenBidding } from "@/lib/pharmacy-order-initial-state";
import {
  getSubmittedOffer,
  queueSubmittedOfferDetails,
  removeSubmittedOfferDiscount,
  saveSubmittedOffer,
} from "@/lib/pharmacy-offer-store";

export const Route = createFileRoute("/pharmacy/offer/$orderNo")({
  head: () => ({ meta: [{ title: "تقديم عرض - صيدلية فينوس" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    editOffer: search.editOffer === true || search.editOffer === "true",
  }),
  component: OfferPage,
});

function OfferPage() {
  const { orderNo } = Route.useParams();
  const { editOffer } = Route.useSearch();
  const navigate = useNavigate();
  const [order, setOrder] = useState(
    () =>
      initialOrders.find(
        (candidate) =>
          candidate.orderNo === orderNo &&
          (candidate.status === "open-bidding" || (editOffer && candidate.status === "on-hold")),
      ) ?? null,
  );
  const [submittedOffer, setSubmittedOffer] = useState<OfferSubmissionPayload | null>(null);
  const [savedOfferDraft, setSavedOfferDraft] = useState<OfferSubmissionPayload | null>(null);
  const [isEditingOffer, setIsEditingOffer] = useState(false);

  useEffect(() => {
    initializeSampleOrdersAtOpenBidding(initialOrders.map((candidate) => candidate.orderNo));
    setOrder(
      withSavedOrderStatuses(initialOrders).find(
        (candidate) =>
          candidate.orderNo === orderNo &&
          (candidate.status === "open-bidding" || (editOffer && candidate.status === "on-hold")),
      ) ?? null,
    );
  }, [editOffer, orderNo]);

  useEffect(() => {
    const payload = editOffer ? getSubmittedOffer(orderNo) : null;
    setSavedOfferDraft(payload);
    setIsEditingOffer(Boolean(payload));
  }, [editOffer, orderNo]);

  const goBack = () => navigate({ to: "/pharmacy/orders" });
  const goToOrdersWithSubmittedOffer = () => {
    if (order && submittedOffer) queueSubmittedOfferDetails(order.orderNo);
    navigate({ to: "/pharmacy/orders" });
  };

  const handleOfferSubmit = (payload: OfferSubmissionPayload) => {
    if (order) {
      saveSubmittedOffer(order.orderNo, payload);
      saveOrderStatus(order.orderNo, "on-hold");
    }
    setSavedOfferDraft(payload);
    setIsEditingOffer(false);
    setSubmittedOffer(payload);
  };

  const handleOfferWithdrawWithoutDiscount = () => {
    if (!order || !removeSubmittedOfferDiscount(order.orderNo)) {
      console.warn("Cannot continue the order without a saved offer to preserve its alternatives.");
      return false;
    }

    saveOrderStatus(order.orderNo, "on-hold");
    queueSubmittedOfferDetails(order.orderNo);
    return true;
  };

  const continueWithoutDiscount = () => {
    if (!handleOfferWithdrawWithoutDiscount()) return;
    setSavedOfferDraft(null);
    setIsEditingOffer(false);
    setSubmittedOffer(null);
    navigate({ to: "/pharmacy/orders" });
  };

  if (!order) {
    return (
      <section dir="rtl" className="grid min-h-[60vh] place-items-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <CircleAlert className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-bold text-foreground">الطلب غير متاح لتقديم عرض</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            قد يكون الطلب قد أُغلق أو لم يعد متاحًا.
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
      <OfferSubmissionForm
        order={order}
        isEditing={isEditingOffer}
        initialPayload={isEditingOffer ? (savedOfferDraft ?? undefined) : undefined}
        onCancel={goBack}
        onWithdraw={continueWithoutDiscount}
        onSubmit={handleOfferSubmit}
      />
      <OfferSuccessDialog
        open={Boolean(submittedOffer)}
        onOpenChange={(open) => {
          if (!open) goToOrdersWithSubmittedOffer();
        }}
        onGoToOrders={goToOrdersWithSubmittedOffer}
        onWithdraw={continueWithoutDiscount}
      />
    </>
  );
}
