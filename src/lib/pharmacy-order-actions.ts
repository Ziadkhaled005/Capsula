import { InventoryAPI, OrdersAPI } from "@/api";
import type { OfferSubmissionPayload } from "@/components/OfferSubmissionForm";
import type { ApiOrderStatus, BidListItem, JsonRecord } from "@/api/contracts";
import { mapBidToOrder, mapPharmacyOrderToOrder } from "@/lib/pharmacy-api-mappers";
import type { Order, StatusKey } from "@/routes/pharmacy.orders";

const orderStatusMap: Partial<Record<Exclude<StatusKey, "all">, ApiOrderStatus>> = {
  "awaiting-customer-confirmation": "PendingConfirmation",
  "on-hold": "OnHold",
  confirmed: "Confirmed",
  preparing: "InPreparation",
  "on-delivery": "InRoute",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Loads bids (still open for offers) and this pharmacy's orders as one list. */
export async function loadPharmacyOrders() {
  const [bids, serverOrders] = await Promise.all([OrdersAPI.getBids(), OrdersAPI.getOrders()]);
  const relevantBids = bids.filter(
    (bid) => bid.bidStatus === "Open" || bid.bidStatus === "Submitted",
  );
  return {
    relevantBids,
    orders: [
      ...relevantBids.map((bid) => mapBidToOrder(bid)),
      ...serverOrders.map((order) => mapPharmacyOrderToOrder(order)),
    ],
  };
}

/** Fetches the full bid/order detail behind a list row. */
export async function loadOrderDetail(selected: Order): Promise<Order> {
  if (selected.bidStatus === "Open" || selected.bidStatus === "Submitted") {
    const detail = await OrdersAPI.getBid(selected.apiId!);
    const bid = {
      ...(selected.rawBid ?? {}),
      orderId: selected.apiId,
      bidStatus: selected.bidStatus,
      customerName: selected.customer,
      customerPhone: selected.phone,
      paymentMethod: selected.payment,
      createdDate: selected.rawBid?.createdDate ?? "",
      itemCount: selected.items,
      estimatedSubTotal: selected.subtotal ?? selected.price,
      ...detail,
    } as BidListItem;
    return mapBidToOrder(bid, detail);
  }
  const detail = await OrdersAPI.getOrder(selected.apiId!);
  return mapPharmacyOrderToOrder({
    ...(selected.rawOrder ?? {}),
    id: selected.apiId,
    createdDate: selected.rawOrder?.createdDate ?? "",
    customerName: selected.customer,
    customerPhone: selected.phone,
    status: "PendingConfirmation",
    paymentMethod: selected.payment,
    totalAmount: selected.price,
    itemCount: selected.items,
    ...detail,
  } as Parameters<typeof mapPharmacyOrderToOrder>[0] & JsonRecord);
}

/**
 * Applies a status change from the order panel. Cancelling an open bid declines it,
 * cancelling a submitted bid withdraws the offer; everything else moves the order.
 * Returns the success message, or null when nothing was sent.
 */
export async function applyOrderStatusChange(
  order: Order,
  status: Exclude<StatusKey, "all">,
): Promise<string | null> {
  if (!order.apiId) return null;
  if (order.bidStatus === "Open" && status === "cancelled") {
    await OrdersAPI.declineBid(order.apiId);
    return "تم رفض استقبال الطلب";
  }
  if (order.bidStatus === "Submitted" && status === "cancelled") {
    if (!order.offerId || !window.confirm("سحب العرض نهائيًا؟ لن يظهر العرض للعميل بعد ذلك.")) {
      return null;
    }
    await OrdersAPI.withdrawBidOffer(order.offerId);
    return "تم سحب العرض";
  }
  const apiStatus = orderStatusMap[status];
  if (!apiStatus) return null;
  // OnHold -> OnHold is not a valid transition; the order is already paused.
  if (apiStatus === "OnHold" && order.rawOrder?.status === "OnHold") {
    return "الطلب قيد الانتظار بالفعل";
  }
  await OrdersAPI.updateOrderStatus(order.apiId, apiStatus);
  return "تم تحديث حالة الطلب";
}

/**
 * A submitted offer lists its alternatives without prices; look each one up in the
 * pharmacy's own inventory, which holds the price the offer was made at.
 */
export async function fillAlternativePrices(
  payload: OfferSubmissionPayload,
): Promise<OfferSubmissionPayload> {
  const entries = await Promise.all(
    Object.entries(payload.alternatives).map(async ([productName, alternatives]) => {
      const filled = await Promise.all(
        alternatives.map(async (alternative) => {
          if (alternative.price > 0 || !alternative.name) return alternative;
          try {
            const page = await InventoryAPI.getInventory({ search: alternative.name, pageSize: 20 });
            const match = page.items.find((item) => String(item.productId) === alternative.id);
            return match
              ? {
                  ...alternative,
                  price: Number(match.price ?? 0),
                  stockCurrent: Number(match.quantity ?? alternative.stockCurrent),
                  stockTotal: Number(match.quantity ?? alternative.stockTotal),
                }
              : alternative;
          } catch {
            return alternative;
          }
        }),
      );
      return [productName, filled] as const;
    }),
  );
  return { ...payload, alternatives: Object.fromEntries(entries) };
}
