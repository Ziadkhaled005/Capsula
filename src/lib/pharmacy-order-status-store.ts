import type { OrderStatus } from "@/types";

const STORAGE_KEY = "capsoula-pharmacy-order-statuses";
const UPDATE_EVENT = "capsoula:pharmacy-order-status-updated";

const orderStatuses: OrderStatus[] = [
  "open-bidding",
  "on-hold",
  "awaiting-customer-confirmation",
  "confirmed",
  "preparing",
  "on-delivery",
  "delivered",
  "cancelled",
];

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && orderStatuses.includes(value as OrderStatus);
}

function readStatusOverrides(): Partial<Record<string, OrderStatus>> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, OrderStatus] => isOrderStatus(entry[1]),
      ),
    );
  } catch (error) {
    console.warn("Could not read saved pharmacy order statuses.", error);
    return {};
  }
}

export function withSavedOrderStatuses<T extends { orderNo: string; status: OrderStatus }>(
  orders: T[],
): T[] {
  const overrides = readStatusOverrides();
  return orders.map((order) => {
    const status = overrides[order.orderNo];
    return status ? { ...order, status } : order;
  });
}

export function saveOrderStatus(orderNo: string, status: OrderStatus): void {
  if (typeof window === "undefined") return;

  const overrides = readStatusOverrides();
  overrides[orderNo] = status;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function resetSavedOrderStatuses(orderNos: string[]): void {
  if (typeof window === "undefined") return;

  const overrides = readStatusOverrides();
  let changed = false;
  for (const orderNo of orderNos) {
    if (orderNo in overrides) {
      delete overrides[orderNo];
      changed = true;
    }
  }

  if (!changed) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function subscribeToOrderStatusUpdates(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(UPDATE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(UPDATE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
