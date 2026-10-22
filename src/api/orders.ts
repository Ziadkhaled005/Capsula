import { apiClient, unwrapApiResponse } from "./client";
import type {
  Order,
  OrderProduct,
  OrderStatus,
  OrdersFilter,
  OrdersResponse,
  UpdateOrderStatusRequest,
  SubmitOfferRequest,
} from "@/types";

type BackendOrder = Record<string, any>;
type BackendBid = Record<string, any>;

const STATUS_TO_API: Partial<Record<OrderStatus, string>> = {
  "on-hold": "OnHold",
  "awaiting-customer-confirmation": "PendingConfirmation",
  confirmed: "Confirmed",
  preparing: "InPreparation",
  "on-delivery": "InRoute",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function statusFromApi(value: unknown): OrderStatus {
  switch (String(value ?? "").toLowerCase()) {
    case "waitingforoffers":
      return "open-bidding";
    case "pendingconfirmation":
      return "awaiting-customer-confirmation";
    case "confirmed":
      return "confirmed";
    case "onhold":
      return "on-hold";
    case "inpreparation":
      return "preparing";
    case "inroute":
      return "on-delivery";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "awaiting-customer-confirmation";
  }
}

function paymentFromApi(value: unknown): "cash" | "card" | "card-on-delivery" {
  const v = String(value ?? "").toLowerCase();
  if (v === "cash") return "cash";
  if (v === "cardondelivery") return "card-on-delivery";
  return "card";
}

function toIso(value: unknown): string {
  if (typeof value !== "string" || !value) return new Date(0).toISOString();
  // Backend timestamps are UTC ISO strings without a zone suffix.
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
}

function mapProduct(item: BackendOrder, index: number): OrderProduct {
  const id = String(item.productId ?? item.id ?? index);
  const qty = Number(item.quantity ?? item.qty ?? 0);
  const unitPrice = Number(item.price ?? item.unitPrice ?? 0);
  return {
    id,
    name: String(item.productName ?? item.name ?? "منتج"),
    sku: String(item.code ?? item.sku ?? ""),
    qty,
    unitPrice,
    totalPrice: Number(item.subTotal ?? item.totalPrice ?? qty * unitPrice),
    available: item.isInStock !== false && item.available !== false,
    imageUrl: item.productImageUrl ?? item.imageUrl ?? undefined,
  };
}

function mapBackendOrder(raw: BackendOrder): Order {
  const address = raw.deliveryAddress ?? {};
  const items = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.products)
      ? raw.products
      : [];
  const total = Number(raw.totalAmount ?? raw.total ?? raw.initialTotal ?? raw.subTotal ?? 0);
  const subtotal = Number(raw.subTotal ?? raw.subtotal ?? total);
  const discount = Number(raw.offerDiscount ?? raw.discount ?? 0);
  return {
    id: String(raw.id ?? raw.orderId ?? ""),
    orderNo: String(raw.orderNo ?? raw.id ?? raw.orderId ?? ""),
    customer: {
      id: String(raw.customerId ?? ""),
      name: String(raw.customerName ?? raw.customer?.name ?? "عميل"),
      phone: String(raw.customerPhone ?? raw.customer?.phone ?? address.phoneNumber ?? ""),
      address:
        [address.region, address.buildingName, address.street, raw.region]
          .filter((part) => typeof part === "string" && part.trim())
          .join("، ") || String(raw.address ?? raw.customer?.address ?? "—"),
      addressDetail:
        [address.apartmentNumber, address.floorNumber, address.deliveryInstructions]
          .filter(Boolean)
          .join("، ") || undefined,
    },
    products: items.map(mapProduct),
    status: statusFromApi(raw.status),
    payment: paymentFromApi(raw.paymentMethod ?? raw.payment),
    subtotal,
    deliveryFee: Number(raw.deliveryFee ?? 0),
    discount,
    total,
    createdAt: toIso(raw.createdDate ?? raw.createdAt),
    updatedAt: toIso(raw.updatedDate ?? raw.updatedAt ?? raw.createdDate ?? raw.createdAt),
    notes: raw.notes ?? undefined,
    remainingMinutes: raw.remainingMinutes,
  };
}

function mapBid(raw: BackendBid): Order {
  const orderId = String(raw.orderId ?? raw.id ?? "");
  const estimatedSubtotal = Number(raw.estimatedSubTotal ?? raw.estimatedSubtotal ?? 0);
  const createdAt = toIso(raw.createdDate ?? raw.createdAt);
  const deadline = raw.offersDeadline ? new Date(toIso(raw.offersDeadline)).getTime() : 0;
  const remainingMinutes = deadline > Date.now() ? Math.ceil((deadline - Date.now()) / 60000) : 0;

  return {
    id: orderId,
    orderNo: orderId,
    customer: {
      id: String(raw.customerId ?? ""),
      name: String(raw.customerName ?? "عميل"),
      phone: String(raw.customerPhone ?? ""),
      address: String(raw.region ?? raw.deliveryAddress?.region ?? "—"),
    },
    products: (Array.isArray(raw.items) ? raw.items : []).map(mapProduct),
    status: "open-bidding",
    payment: paymentFromApi(raw.paymentMethod),
    subtotal: estimatedSubtotal,
    deliveryFee: 0,
    discount: 0,
    total: estimatedSubtotal,
    createdAt,
    updatedAt: createdAt,
    remainingMinutes,
    notes: raw.notes ?? undefined,
  };
}

function getArray(payload: unknown): BackendOrder[] {
  const value = unwrapApiResponse<unknown>(payload);
  if (Array.isArray(value)) return value as BackendOrder[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as BackendOrder[];
    if (Array.isArray(record.data)) return record.data as BackendOrder[];
  }
  throw new Error("استجابة الطلبات من الخادم ليست بالقالب المتوقع.");
}

function matchesSearch(order: Order, search: string) {
  const term = search.trim().toLowerCase();
  return (
    !term ||
    [order.id, order.orderNo, order.customer.name, order.customer.phone].some((part) =>
      String(part ?? "")
        .toLowerCase()
        .includes(term),
    )
  );
}

function paginate(orders: Order[], filters: OrdersFilter): OrdersResponse {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 10);
  const total = orders.length;
  const totalPages = Math.ceil(total / pageSize);
  return {
    data: orders.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * GET /api/admin/orders and GET /api/admin/bids.
 * The documented orders endpoint returns an array; bidding orders live in /bids.
 */
export async function getOrders(filters: OrdersFilter = {}): Promise<OrdersResponse> {
  const status = filters.status ?? "all";
  const search = filters.search ?? "";
  let orders: Order[] = [];

  if (status === "open-bidding") {
    const { data } = await apiClient.get("/api/admin/bids", { params: { status: "Open" } });
    orders = getArray(data).map(mapBid);
  } else {
    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();
    if (status !== "all" && STATUS_TO_API[status]) params.status = STATUS_TO_API[status]!;
    const { data } = await apiClient.get("/api/admin/orders", { params });
    orders = getArray(data).map(mapBackendOrder);

    if (status === "all") {
      const bidsResponse = await apiClient.get("/api/admin/bids", { params: { status: "Open" } });
      const bids = getArray(bidsResponse.data).map(mapBid);
      orders = [...bids.filter((bid) => matchesSearch(bid, search)), ...orders];
    }
  }

  if (status !== "all") orders = orders.filter((order) => order.status === status);
  if (search.trim()) orders = orders.filter((order) => matchesSearch(order, search));
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return paginate(orders, filters);
}

export async function getOrder(id: string): Promise<Order> {
  try {
    const { data } = await apiClient.get(`/api/admin/orders/${encodeURIComponent(id)}`);
    return mapBackendOrder(unwrapApiResponse<BackendOrder>(data));
  } catch (orderError) {
    const { data } = await apiClient.get(`/api/admin/bids/${encodeURIComponent(id)}`);
    const bid = unwrapApiResponse<BackendBid>(data);
    if (!bid || typeof bid !== "object") throw orderError;
    return mapBid(bid);
  }
}

export async function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusRequest,
): Promise<Order> {
  const apiStatus =
    payload.status === "awaiting-customer-confirmation"
      ? "Confirmed"
      : payload.status === "preparing"
        ? "InPreparation"
        : payload.status === "on-delivery"
          ? "InRoute"
          : payload.status === "on-hold"
            ? "OnHold"
            : payload.status === "cancelled"
              ? "Cancelled"
              : payload.status === "delivered"
                ? "Delivered"
                : payload.status === "confirmed"
                  ? "Confirmed"
                  : undefined;

  if (!apiStatus) throw new Error("لا يمكن تحديث حالة طلب المزايدة من شاشة الطلبات.");

  const { data } = await apiClient.put(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
    newStatus: apiStatus,
    note: payload.notes,
  });
  return mapBackendOrder(unwrapApiResponse<BackendOrder>(data));
}

export async function submitOffer(orderId: string, payload: SubmitOfferRequest) {
  const { data } = await apiClient.post(
    `/api/admin/bids/${encodeURIComponent(orderId)}/offer`,
    payload,
  );
  return unwrapApiResponse<Record<string, unknown>>(data);
}

export async function declineBid(orderId: string, reason?: string) {
  const { data } = await apiClient.post(`/api/admin/bids/${encodeURIComponent(orderId)}/decline`, {
    reason,
  });
  return unwrapApiResponse<unknown>(data);
}

export async function cancelOrder(id: string, reason?: string): Promise<void> {
  await updateOrderStatus(id, { status: "cancelled", notes: reason });
}

export async function getBidDetail(orderId: string): Promise<Record<string, any>> {
  const { data } = await apiClient.get(`/api/admin/bids/${encodeURIComponent(orderId)}`);
  return unwrapApiResponse<Record<string, any>>(data);
}

/** POST /api/admin/orders/items/{itemId}/alternatives (multipart form) */
export async function proposeAlternative(itemId: string, formData: FormData) {
  const { data } = await apiClient.post(
    `/api/admin/orders/items/${encodeURIComponent(itemId)}/alternatives`,
    formData,
  );
  return unwrapApiResponse<unknown>(data);
}
