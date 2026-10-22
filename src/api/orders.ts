import { apiClient, unwrapApiResponse } from "./client";
import type {
  Order,
  OrdersFilter,
  OrdersResponse,
  UpdateOrderStatusRequest,
  ProposeAlternativeRequest,
  ProposeAlternativeResponse,
} from "@/types";

const STATUS_TO_API: Record<string, string> = {
  "open-bidding": "WaitingForOffers",
  "awaiting-customer-confirmation": "PendingConfirmation",
  "on-hold": "OnHold",
  confirmed: "Confirmed",
  preparing: "InPreparation",
  "on-delivery": "InRoute",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_FROM_API: Record<string, Order["status"]> = {
  WaitingForOffers: "open-bidding",
  PendingConfirmation: "awaiting-customer-confirmation",
  Confirmed: "confirmed",
  OnHold: "on-hold",
  InPreparation: "preparing",
  InRoute: "on-delivery",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

function statusFromApi(value: unknown): Order["status"] {
  const status = String(value ?? "");
  return STATUS_FROM_API[status] ?? STATUS_FROM_API[status[0]?.toUpperCase() + status.slice(1)] ?? "awaiting-customer-confirmation";
}

function mapOrder(raw: any): Order {
  const address = raw.deliveryAddress ?? raw.customer?.address ?? {};
  const addressText = typeof address === "string"
    ? address
    : [address.region, address.buildingName, address.street, address.address]
        .filter(Boolean).join("، ");
  const items = raw.items ?? raw.products ?? [];
  const subtotal = Number(raw.subTotal ?? raw.subtotal ?? raw.estimatedSubTotal ?? 0);
  const deliveryFee = Number(raw.deliveryFee ?? raw.chosenOffer?.deliveryFee ?? 0);
  const discount = Number(raw.offerDiscount ?? raw.discount ?? raw.chosenOffer?.discountAmount ?? 0);
  const total = Number(raw.totalAmount ?? raw.total ?? subtotal - discount + deliveryFee);

  return {
    id: String(raw.id ?? raw.orderId ?? ""),
    orderNo: String(raw.orderNo ?? raw.id ?? raw.orderId ?? ""),
    customer: {
      id: String(raw.customerId ?? raw.customer?.id ?? ""),
      name: raw.customerName ?? raw.customer?.name ?? "—",
      phone: raw.customerPhone ?? raw.customer?.phone ?? address.phoneNumber ?? "",
      address: addressText || "—",
      addressDetail: address.deliveryInstructions ?? address.apartmentNumber ?? undefined,
    },
    products: items.map((item: any) => ({
      id: String(item.productId ?? item.id ?? item.orderItemId ?? ""),
      name: String(item.productName ?? item.name ?? "—"),
      sku: String(item.code ?? item.sku ?? item.productId ?? ""),
      qty: Number(item.quantity ?? item.qty ?? 0),
      unitPrice: Number(item.price ?? item.unitPrice ?? 0),
      totalPrice: Number(item.subTotal ?? item.totalPrice ?? (Number(item.quantity ?? item.qty ?? 0) * Number(item.price ?? item.unitPrice ?? 0))),
      available: Boolean(item.isInStock ?? item.available ?? true),
      imageUrl: item.productImageUrl ?? item.imageUrl,
    })),
    status: statusFromApi(raw.status),
    payment: String(raw.paymentMethod ?? raw.payment ?? "Cash").toLowerCase().includes("cash") ? "cash" : "card",
    subtotal,
    deliveryFee,
    discount,
    total,
    createdAt: raw.createdDate ?? raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdDate ?? raw.createdAt ?? new Date().toISOString(),
    remainingMinutes: raw.remainingMinutes,
    alternatives: raw.alternatives,
    notes: raw.notes,
  };
}

function getQueryStatus(status?: OrdersFilter["status"]): string | undefined {
  if (!status || status === "all" || status === "open-bidding") return undefined;
  return STATUS_TO_API[status];
}

export async function getOrders(filters: OrdersFilter = {}): Promise<OrdersResponse> {
  // Bids are a separate API collection from fulfilled orders.
  const isBidsTab = filters.status === "open-bidding";
  const { data } = isBidsTab
    ? await apiClient.get("/api/admin/bids", { params: { status: "Open" } })
    : await apiClient.get("/api/admin/orders", {
        params: {
          status: getQueryStatus(filters.status),
          search: filters.search?.trim() || undefined,
        },
      });

  const result = unwrapApiResponse<any>(data);
  const rows = Array.isArray(result) ? result : (result?.items ?? result?.data ?? []);
  const mapped = rows.map((row: any) => {
    if (isBidsTab) {
      return mapOrder({
        ...row,
        id: row.orderId,
        orderNo: row.orderId,
        status: "WaitingForOffers",
        paymentMethod: row.paymentMethod,
        totalAmount: row.estimatedSubTotal,
        items: [],
      });
    }
    return mapOrder(row);
  });

  const search = filters.search?.trim().toLowerCase();
  const filtered = search
    ? mapped.filter((order: Order) =>
        [order.id, order.orderNo, order.customer.name, order.customer.phone]
          .some((value) => value.toLowerCase().includes(search)),
      )
    : mapped;

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 10);
  const start = (page - 1) * pageSize;
  const dataPage = filtered.slice(start, start + pageSize);

  return {
    data: dataPage,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get(`/api/admin/orders/${encodeURIComponent(id)}`);
  return mapOrder(unwrapApiResponse<any>(data));
}

export async function updateOrderStatus(id: string, payload: UpdateOrderStatusRequest): Promise<Order> {
  const newStatus = STATUS_TO_API[payload.status];
  if (!newStatus) throw new Error("حالة الطلب غير مدعومة.");
  const { data } = await apiClient.put(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
    newStatus,
    note: payload.notes,
  });
  return mapOrder(unwrapApiResponse<any>(data));
}

export async function proposeAlternative(payload: ProposeAlternativeRequest): Promise<ProposeAlternativeResponse> {
  // The documented endpoint is per order item and uses multipart fields.
  for (const proposal of payload.proposals) {
    for (const alternative of proposal.alternatives) {
      const form = new FormData();
      form.append("SuggestedProductId", alternative.productId);
      form.append("Quantity", String(alternative.qty));
      form.append("AdminNote", "");
      await apiClient.post(
        `/api/admin/orders/items/${encodeURIComponent(proposal.originalProductId)}/alternatives`,
        form,
      );
    }
  }
  return {
    success: true,
    orderId: payload.orderId,
    newStatus: "awaiting-customer-confirmation",
  };
}

export async function cancelOrder(id: string, reason?: string): Promise<void> {
  const { data } = await apiClient.put(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
    newStatus: "Cancelled",
    note: reason,
  });
  unwrapApiResponse<unknown>(data);
}
