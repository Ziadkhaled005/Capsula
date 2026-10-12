import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CustomerOrderConfirmation } from "@/components/order-customer-flow/CustomerOrderConfirmation";
import {
  getSubmittedOffer,
  getSubmittedOfferApproval,
  removeSubmittedOffer,
  saveSubmittedOfferApproval,
  subscribeToSubmittedOfferUpdates,
} from "@/lib/pharmacy-offer-store";
import {
  saveCustomerDecisionNotification,
  type CustomerDecisionOutcome,
} from "@/lib/pharmacy-customer-decision-store";
import {
  saveOrderStatus,
  subscribeToOrderStatusUpdates,
  withSavedOrderStatuses,
} from "@/lib/pharmacy-order-status-store";
import { initialOrders, type Order } from "./pharmacy.orders";
import type { OfferSubmissionPayload } from "@/components/OfferSubmissionForm";
import type { SubmittedOfferApproval } from "@/lib/pharmacy-offer-store";

export const Route = createFileRoute("/customer/order/$orderNo/confirmation")({
  head: () => ({ meta: [{ title: "مراجعة العرض - كبسولة" }] }),
  component: CustomerOrderConfirmationPage,
});

type CustomerOrderSnapshot = {
  order: Order | null;
  offer: OfferSubmissionPayload | null;
  approval: SubmittedOfferApproval;
};

function CustomerOrderConfirmationPage() {
  const { orderNo } = Route.useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CustomerOrderSnapshot | null>(null);

  useEffect(() => {
    const refresh = () => {
      const order =
        withSavedOrderStatuses(initialOrders).find((candidate) => candidate.orderNo === orderNo) ??
        null;
      setSnapshot({
        order,
        offer: getSubmittedOffer(orderNo),
        approval: getSubmittedOfferApproval(orderNo),
      });
    };

    refresh();
    const unsubscribeFromStatuses = subscribeToOrderStatusUpdates(refresh);
    const unsubscribeFromOffers = subscribeToSubmittedOfferUpdates(refresh);
    return () => {
      unsubscribeFromStatuses();
      unsubscribeFromOffers();
    };
  }, [orderNo]);

  const order = snapshot?.order ?? null;
  const offer = snapshot?.offer ?? null;
  const approval = snapshot?.approval;
  const products = approval?.confirmedProducts ?? [];
  const isAwaitingCustomer =
    order?.status === "awaiting-customer-confirmation" &&
    approval?.confirmed === true &&
    approval.customerDecision === "pending";
  const subtotal = products.reduce((sum, product) => sum + product.price * product.qty, 0);
  const deliveryFee = offer?.freeDelivery ? 0 : (offer?.deliveryFee ?? order?.delivery ?? 0);
  const discountAmount =
    offer && !offer.discountRemoved
      ? Math.round(((subtotal * offer.discountPercent) / 100) * 100) / 100
      : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  const respondToOffer = (outcome: CustomerDecisionOutcome) => {
    const currentOrder = withSavedOrderStatuses(initialOrders).find(
      (candidate) => candidate.orderNo === orderNo,
    );
    const currentApproval = getSubmittedOfferApproval(orderNo);
    if (
      currentOrder?.status !== "awaiting-customer-confirmation" ||
      currentApproval.confirmed !== true ||
      currentApproval.customerDecision !== "pending"
    ) {
      return;
    }

    if (outcome === "approved") {
      saveSubmittedOfferApproval(orderNo, {
        ...currentApproval,
        customerDecision: "approved",
      });
      saveOrderStatus(orderNo, "confirmed");
    } else {
      removeSubmittedOffer(orderNo);
      saveOrderStatus(orderNo, "open-bidding");
    }

    saveCustomerDecisionNotification({ outcome, orderNo });
    navigate({ to: "/pharmacy/orders" });
  };

  if (!snapshot) {
    return (
      <main
        dir="rtl"
        className="grid min-h-[100dvh] place-items-center bg-[#f4f7f3] px-4 text-sm text-[#65776a]"
      >
        جارٍ تحميل تفاصيل العرض...
      </main>
    );
  }

  if (!order || !isAwaitingCustomer || !offer) {
    return (
      <main
        dir="rtl"
        className="grid min-h-[100dvh] place-items-center bg-[#f4f7f3] px-4 py-8 text-[#303a34]"
      >
        <section className="w-full max-w-md rounded-3xl border border-[#e1e9e2] bg-[#fffefa] p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold">لا يوجد عرض بانتظار تأكيدك</h1>
          <p className="mt-2 text-sm leading-6 text-[#758078]">
            قد يكون الطلب قد تم تأكيده أو لم يعد متاحاً للمراجعة.
          </p>
          <button
            type="button"
            data-testid="button-return-to-orders"
            onClick={() => navigate({ to: "/pharmacy/orders" })}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#145c4c] px-5 text-sm font-semibold text-white hover:bg-[#104b3e]"
          >
            العودة إلى الطلبات
          </button>
        </section>
      </main>
    );
  }

  return (
    <CustomerOrderConfirmation
      orderNo={order.orderNo}
      customerName={order.customer}
      products={products.map((product) => ({
        name: product.name,
        qty: product.qty,
        price: product.price,
      }))}
      total={total}
      deliveryTime={offer.deliveryTime}
      onApprove={() => respondToOffer("approved")}
      onDecline={() => respondToOffer("declined")}
    />
  );
}
