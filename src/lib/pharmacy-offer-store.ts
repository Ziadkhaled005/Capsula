import type { OfferSubmissionPayload } from "@/components/OfferSubmissionForm";
import type { InventoryItem } from "@/types";

const STORAGE_KEY = "capsoula-pharmacy-submitted-offers";
const APPROVALS_STORAGE_KEY = "capsoula-pharmacy-offer-approvals";
const UPDATE_EVENT = "capsoula:pharmacy-offers-updated";
const PENDING_ORDERS_DETAILS_KEY = "capsoula:open-submitted-offer-details";

export type OfferAlternativeSelection = {
  alternativeId: string;
  quantity: number;
};

export type ConfirmedOfferProduct = {
  name: string;
  qty: number;
  price: number;
  color: string;
  available?: boolean;
};

export type SubmittedOfferApproval = {
  selections: Record<string, OfferAlternativeSelection>;
  confirmed: boolean;
  customerDecision?: "pending" | "approved" | "declined";
  confirmedProducts?: ConfirmedOfferProduct[];
};

const emptyApproval = (): SubmittedOfferApproval => ({ selections: {}, confirmed: false });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isConfirmedOfferProduct(value: unknown): value is ConfirmedOfferProduct {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.qty === "number" &&
    Number.isFinite(value.qty) &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    typeof value.color === "string" &&
    (value.available === undefined || typeof value.available === "boolean")
  );
}

function isInventoryItem(value: unknown): value is InventoryItem {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.sku === "string" &&
    typeof value.category === "string" &&
    typeof value.stockTotal === "number" &&
    typeof value.stockCurrent === "number" &&
    typeof value.price === "number" &&
    typeof value.lastUpdated === "string"
  );
}

function isOfferSubmissionPayload(value: unknown): value is OfferSubmissionPayload {
  if (!isRecord(value) || !isRecord(value.alternatives)) return false;

  return (
    typeof value.discountPercent === "number" &&
    (value.discountRemoved === undefined || typeof value.discountRemoved === "boolean") &&
    typeof value.deliveryTime === "number" &&
    typeof value.deliveryFee === "number" &&
    typeof value.freeDelivery === "boolean" &&
    typeof value.notes === "string" &&
    Object.values(value.alternatives).every(
      (items) => Array.isArray(items) && items.every(isInventoryItem),
    )
  );
}

function readOffers(): Record<string, OfferSubmissionPayload> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const validOffers: [string, OfferSubmissionPayload][] = [];
    for (const [orderNo, payload] of Object.entries(parsed)) {
      if (isOfferSubmissionPayload(payload)) validOffers.push([orderNo, payload]);
    }
    return Object.fromEntries(validOffers);
  } catch (error) {
    console.warn("Could not read saved pharmacy offers.", error);
    return {};
  }
}

function readApprovals(): Record<string, SubmittedOfferApproval> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(APPROVALS_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([orderNo, value]) => {
        if (!isRecord(value) || !isRecord(value.selections)) return [];
        const selections = Object.fromEntries(
          Object.entries(value.selections).filter(
            (entry): entry is [string, OfferAlternativeSelection] =>
              isRecord(entry[1]) &&
              typeof entry[1].alternativeId === "string" &&
              typeof entry[1].quantity === "number" &&
              Number.isFinite(entry[1].quantity) &&
              entry[1].quantity >= 0,
          ),
        );
        const confirmedProducts =
          Array.isArray(value.confirmedProducts) &&
          value.confirmedProducts.every(isConfirmedOfferProduct)
            ? value.confirmedProducts
            : undefined;
        return [
          [
            orderNo,
            {
              selections,
              confirmed: value.confirmed === true,
              ...(value.customerDecision === "pending" ||
              value.customerDecision === "approved" ||
              value.customerDecision === "declined"
                ? { customerDecision: value.customerDecision }
                : {}),
              ...(confirmedProducts ? { confirmedProducts } : {}),
            },
          ],
        ];
      }),
    );
  } catch (error) {
    console.warn("Could not read saved pharmacy offer approvals.", error);
    return {};
  }
}

export function getSubmittedOffers(): Record<string, OfferSubmissionPayload> {
  return readOffers();
}

export function getSubmittedOffer(orderNo: string): OfferSubmissionPayload | null {
  return readOffers()[orderNo] ?? null;
}

export function saveSubmittedOffer(orderNo: string, payload: OfferSubmissionPayload): void {
  if (typeof window === "undefined") return;

  const offers = readOffers();
  offers[orderNo] = payload;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  const approvals = readApprovals();
  delete approvals[orderNo];
  window.localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(approvals));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function removeSubmittedOfferDiscount(orderNo: string): boolean {
  if (typeof window === "undefined") return false;

  const offers = readOffers();
  const currentOffer = offers[orderNo];
  if (!currentOffer) return false;

  offers[orderNo] = {
    ...currentOffer,
    discountPercent: 0,
    discountRemoved: true,
    freeDelivery: false,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  window.dispatchEvent(new Event(UPDATE_EVENT));
  return true;
}

export function getSubmittedOfferApproval(orderNo: string): SubmittedOfferApproval {
  return readApprovals()[orderNo] ?? emptyApproval();
}

export function saveSubmittedOfferApproval(
  orderNo: string,
  approval: SubmittedOfferApproval,
): void {
  if (typeof window === "undefined") return;

  const approvals = readApprovals();
  approvals[orderNo] = approval;
  window.localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(approvals));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function removeSubmittedOffer(orderNo: string): void {
  if (typeof window === "undefined") return;

  const offers = readOffers();
  delete offers[orderNo];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  const approvals = readApprovals();
  delete approvals[orderNo];
  window.localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(approvals));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function resetSubmittedOffers(orderNos: string[]): void {
  if (typeof window === "undefined") return;

  const resetOrderNos = new Set(orderNos);
  const offers = readOffers();
  const approvals = readApprovals();
  let changed = false;

  for (const orderNo of resetOrderNos) {
    if (orderNo in offers) {
      delete offers[orderNo];
      changed = true;
    }
    if (orderNo in approvals) {
      delete approvals[orderNo];
      changed = true;
    }
  }

  try {
    const queuedOrderNo = window.sessionStorage.getItem(PENDING_ORDERS_DETAILS_KEY);
    if (queuedOrderNo && resetOrderNos.has(queuedOrderNo)) {
      window.sessionStorage.removeItem(PENDING_ORDERS_DETAILS_KEY);
      changed = true;
    }
  } catch (error) {
    console.warn("Could not clear queued submitted-offer details.", error);
  }

  if (!changed) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  window.localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(approvals));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function subscribeToSubmittedOfferUpdates(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(UPDATE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(UPDATE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function queueSubmittedOfferDetails(orderNo: string): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(PENDING_ORDERS_DETAILS_KEY, orderNo);
  } catch (error) {
    console.warn("Could not queue the submitted offer details drawer.", error);
  }
}

export function consumeQueuedSubmittedOfferDetails(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const orderNo = window.sessionStorage.getItem(PENDING_ORDERS_DETAILS_KEY);
    window.sessionStorage.removeItem(PENDING_ORDERS_DETAILS_KEY);
    return orderNo;
  } catch (error) {
    console.warn("Could not restore the submitted offer details drawer.", error);
    return null;
  }
}
