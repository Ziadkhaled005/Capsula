export type CustomerDecisionOutcome = "approved" | "declined";

export type CustomerDecisionNotification = {
  outcome: CustomerDecisionOutcome;
  orderNo: string;
};

const NOTIFICATION_STORAGE_KEY = "capsoula-pharmacy-customer-decision-notification";
const UPDATE_EVENT = "capsoula:pharmacy-customer-decision-notification-updated";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getCustomerDecisionNotification(): CustomerDecisionNotification | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      typeof parsed.orderNo !== "string" ||
      (parsed.outcome !== "approved" && parsed.outcome !== "declined")
    ) {
      return null;
    }

    return { outcome: parsed.outcome, orderNo: parsed.orderNo };
  } catch (error) {
    console.warn("Could not read the customer decision notification.", error);
    return null;
  }
}

export function saveCustomerDecisionNotification(notification: CustomerDecisionNotification): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notification));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function clearCustomerDecisionNotification(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function subscribeToCustomerDecisionNotifications(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(UPDATE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(UPDATE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
