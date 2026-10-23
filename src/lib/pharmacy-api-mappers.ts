import type {
  ApiOrderStatus,
  BidListItem,
  JsonRecord,
  PharmacyOrderDto,
} from "@/api/contracts";
import type { Order, OrderItem, StatusKey } from "@/routes/pharmacy.orders";

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function remainingTime(deadline?: string | null) {
  if (!deadline) return "";
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(deadline) ? deadline : `${deadline}Z`);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function statusForOrder(status: ApiOrderStatus): Exclude<StatusKey, "all"> {
  switch (status) {
    case "WaitingForOffers":
      return "open-bidding";
    case "PendingConfirmation":
      return "awaiting-customer-confirmation";
    case "Confirmed":
      return "confirmed";
    // "on-hold" is the design's state for a submitted offer (edit/withdraw actions).
    // An order the pharmacy paused is still waiting for its confirmation, and that
    // panel offers "تأكيد الطلب" to resume it (OnHold -> Confirmed).
    case "OnHold":
      return "awaiting-customer-confirmation";
    case "InPreparation":
      return "preparing";
    case "InRoute":
      return "on-delivery";
    case "Delivered":
      return "delivered";
    case "Cancelled":
      return "cancelled";
  }
}

function mapItems(items: JsonRecord[] = []): OrderItem[] {
  return items.map((item) => ({
    name: String(item.productName ?? item.name ?? "منتج"),
    qty: numberValue(item.quantity ?? item.qty, 1),
    price: numberValue(item.pharmacyUnitPrice ?? item.price),
    color: "bg-sky-100",
    available: item.isInStock ?? item.available ?? true,
    apiId: Number(item.id ?? item.orderItemId) || undefined,
    productId: Number(item.productId) || undefined,
    unit: String(item.unit ?? "Box"),
    imageUrl: item.productImageUrl ?? item.imageUrl,
  }));
}

export function mapBidToOrder(bid: BidListItem, detail?: JsonRecord): Order {
  const source = detail ?? bid;
  const address = source.deliveryAddress ?? {};
  const status: Exclude<StatusKey, "all"> =
    bid.bidStatus === "Submitted" ? "on-hold" : "open-bidding";
  const createdDate = String(source.createdDate ?? bid.createdDate ?? "");
  const myOffer = source.myOffer ?? bid.myOffer ?? null;

  return {
    apiId: Number(bid.orderId),
    offerId: myOffer?.id ? Number(myOffer.id) : undefined,
    bidStatus: bid.bidStatus,
    customer: String(source.customerName ?? bid.customerName ?? "العميل"),
    orderNo: String(bid.orderId),
    phone: String(source.customerPhone ?? bid.customerPhone ?? ""),
    address: String(address.region ?? source.region ?? bid.region ?? ""),
    addressDetail: [
      address.buildingName,
      address.floorNumber ? `الدور ${address.floorNumber}` : "",
      address.apartmentNumber ? `شقة ${address.apartmentNumber}` : "",
      address.deliveryInstructions,
    ]
      .filter(Boolean)
      .join("، "),
    time: formatTime(createdDate),
    payment: String(source.paymentMethod ?? bid.paymentMethod).toLowerCase().includes("cash")
      ? "cash"
      : "card",
    remaining: remainingTime(source.offersDeadline ?? bid.offersDeadline),
    items: numberValue(source.items?.length ?? bid.itemCount),
    price: numberValue(source.estimatedSubTotal ?? bid.estimatedSubTotal),
    status,
    products: mapItems(source.items),
    subtotal: numberValue(source.estimatedSubTotal ?? bid.estimatedSubTotal),
    delivery: numberValue(myOffer?.deliveryFee),
    discount: -numberValue(myOffer?.discountAmount),
    total: numberValue(myOffer?.total ?? source.estimatedSubTotal ?? bid.estimatedSubTotal),
    isPrescriptionOrder: Boolean(source.isPrescriptionOrder ?? bid.isPrescriptionOrder),
    maxDiscountPercentage: numberValue(source.maxDiscountPercentage, 15),
    rawOffer: myOffer ?? undefined,
    rawBid: source,
  };
}

export function mapPharmacyOrderToOrder(order: PharmacyOrderDto & JsonRecord): Order {
  const address = order.deliveryAddress ?? {};
  const products = mapItems(order.items ?? []);
  const subtotal = numberValue(order.subTotal ?? order.totalAmount);
  const delivery = numberValue(order.deliveryFee);
  const discount = numberValue(order.offerDiscount);
  const status = statusForOrder(order.status);

  return {
    apiId: Number(order.id),
    customer: String(order.customerName ?? "العميل"),
    orderNo: String(order.id),
    phone: String(order.customerPhone ?? ""),
    address: String(address.region ?? address.address ?? ""),
    addressDetail: [
      address.buildingName,
      address.floorNumber ? `الدور ${address.floorNumber}` : "",
      address.apartmentNumber ? `شقة ${address.apartmentNumber}` : "",
      address.deliveryInstructions,
    ]
      .filter(Boolean)
      .join("، "),
    time: formatTime(order.createdDate),
    payment: String(order.paymentMethod).toLowerCase().includes("cash") ? "cash" : "card",
    remaining: remainingTime(order.confirmationDeadline),
    items: numberValue(order.itemCount ?? products.length),
    price: numberValue(order.totalAmount),
    status,
    products,
    subtotal,
    delivery,
    discount: -discount,
    total: numberValue(order.totalAmount),
    rawOrder: order,
  };
}

/** Arabic word for an order item's unit; defaults to the strip label the design shows. */
export function unitLabel(unit?: string) {
  return unit === "Box" ? "علبة" : "شريط";
}
