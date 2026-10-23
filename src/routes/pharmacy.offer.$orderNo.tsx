import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  OfferSubmissionForm,
  type OfferSubmissionPayload,
} from "@/components/OfferSubmissionForm";
import { OfferSuccessDialog } from "@/components/OfferSuccessDialog";
import { OrdersAPI, ApiError } from "@/api";
import type { BidListItem, JsonRecord } from "@/api/contracts";
import {
  mapBidToOrder,
} from "@/lib/pharmacy-api-mappers";
import { fillAlternativePrices } from "@/lib/pharmacy-order-actions";
import {
  toOfferFormPayload,
  toOfferRequest,
  type Order,
} from "./pharmacy.orders";

export const Route = createFileRoute("/pharmacy/offer/$orderNo")({
  head: () => ({ meta: [{ title: "تقديم عرض - لوحة الصيدلية" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    editOffer: search.editOffer === true || search.editOffer === "true",
  }),
  component: OfferPage,
});

function OfferPage() {
  const { orderNo } = Route.useParams();
  const { editOffer } = Route.useSearch();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [savedOfferDraft, setSavedOfferDraft] = useState<OfferSubmissionPayload | null>(null);
  const [isEditingOffer, setIsEditingOffer] = useState(false);
  const [submittedOffer, setSubmittedOffer] = useState<OfferSubmissionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [defaultPreparationMinutes, setDefaultPreparationMinutes] = useState<number | null>(null);

  // The form has no preparation-time field; use the pharmacy's own default.
  useEffect(() => {
    OrdersAPI.getAutoOfferTemplate()
      .then((template) => {
        const minutes = Number(template?.preparationMinutes);
        if (Number.isFinite(minutes) && minutes > 0) setDefaultPreparationMinutes(minutes);
      })
      .catch(() => setDefaultPreparationMinutes(null));
  }, []);

  useEffect(() => {
    let current = true;
    const loadBid = async () => {
      setLoading(true);
      setPageError("");
      const id = Number(orderNo);
      if (!Number.isInteger(id) || id <= 0) {
        setPageError("رقم الطلب غير صحيح.");
        setLoading(false);
        return;
      }

      try {
        const detail = await OrdersAPI.getBid(id);
        if (!current) return;
        const bid = {
          ...detail,
          orderId: id,
          bidStatus: detail.bidStatus ?? (editOffer ? "Submitted" : "Open"),
          createdDate: detail.createdDate ?? "",
          customerName: detail.customerName ?? "",
          customerPhone: detail.customerPhone ?? "",
          paymentMethod: detail.paymentMethod ?? "Cash",
          itemCount: detail.itemCount ?? detail.items?.length ?? 0,
          estimatedSubTotal: detail.estimatedSubTotal ?? 0,
        } as BidListItem;
        if (!editOffer && bid.bidStatus !== "Open") {
          setPageError("لم يعد هذا الطلب مفتوحًا لاستقبال العروض.");
          return;
        }
        const mappedOrder = mapBidToOrder(bid, detail);
        setOrder(mappedOrder);
        const existingOffer = (detail.myOffer ?? bid.myOffer) as JsonRecord | null;
        setIsEditingOffer(Boolean(editOffer && existingOffer?.id));
        if (editOffer && existingOffer) {
          const draft = await fillAlternativePrices(toOfferFormPayload(mappedOrder, existingOffer));
          if (!current) return;
          setSavedOfferDraft(draft);
        }
      } catch (error) {
        setPageError(
          error instanceof ApiError
            ? error.message
            : "تعذر تحميل الطلب من الخادم.",
        );
      } finally {
        if (current) setLoading(false);
      }
    };
    void loadBid();
    return () => {
      current = false;
    };
  }, [editOffer, orderNo]);

  const goBack = () => navigate({ to: "/pharmacy/orders" });
  const goToOrders = () => navigate({ to: "/pharmacy/orders" });

  const withdrawOffer = async () => {
    if (!order?.offerId) {
      toast.error("لا يوجد عرض قابل للسحب.");
      return;
    }
    if (!window.confirm("سحب العرض نهائيًا؟ لن يظهر العرض للعميل بعد ذلك.")) return;
    try {
      await OrdersAPI.withdrawBidOffer(order.offerId);
      toast.success("تم سحب العرض");
      goToOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر سحب العرض.");
    }
  };

  const handleOfferSubmit = async (payload: OfferSubmissionPayload) => {
    if (!order?.apiId) return;
    try {
      const request = toOfferRequest(
        order,
        isEditingOffer || defaultPreparationMinutes === null
          ? payload
          : { ...payload, preparationMinutes: defaultPreparationMinutes },
      );
      if (isEditingOffer) {
        if (!order.offerId) throw new Error("تعذر تحديد العرض الحالي لتعديله.");
        await OrdersAPI.updateBidOffer(order.offerId, request);
      } else {
        await OrdersAPI.submitBidOffer(order.apiId, request);
      }
      setSavedOfferDraft(payload);
      setSubmittedOffer(payload);
      toast.success(isEditingOffer ? "تم تحديث العرض" : "تم إرسال العرض");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إرسال العرض.");
    }
  };

  if (loading || pageError || !order) {
    return (
      <section dir="rtl" className="grid min-h-[60vh] place-items-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <CircleAlert className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-bold text-foreground">
            {loading ? "جارٍ تحميل الطلب..." : "الطلب غير متاح لتقديم عرض"}
          </h1>
          <p role={pageError ? "alert" : undefined} className="mt-2 text-sm leading-6 text-muted-foreground">
            {pageError || "يرجى الانتظار أثناء تحميل بيانات الطلب."}
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
        onWithdraw={withdrawOffer}
        onSubmit={handleOfferSubmit}
      />
      <OfferSuccessDialog
        open={Boolean(submittedOffer)}
        onOpenChange={(open) => {
          if (!open) goToOrders();
        }}
        onGoToOrders={goToOrders}
        onWithdraw={withdrawOffer}
      />
    </>
  );
}
