import { resetSubmittedOffers } from "@/lib/pharmacy-offer-store";
import { resetSavedOrderStatuses } from "@/lib/pharmacy-order-status-store";

const INITIAL_STATE_KEY = "capsoula-pharmacy-orders-initial-state";
const INITIAL_STATE_VERSION = "open-bidding-v1";
const INITIALIZING_STATE = "resetting";

export function initializeSampleOrdersAtOpenBidding(orderNos: string[]): void {
  if (typeof window === "undefined") return;

  try {
    if (window.localStorage.getItem(INITIAL_STATE_KEY)) return;

    window.localStorage.setItem(INITIAL_STATE_KEY, INITIALIZING_STATE);
    resetSavedOrderStatuses(orderNos);
    resetSubmittedOffers(orderNos);
    window.localStorage.setItem(INITIAL_STATE_KEY, INITIAL_STATE_VERSION);
  } catch (error) {
    try {
      window.localStorage.removeItem(INITIAL_STATE_KEY);
    } catch {
      // Leave the original initialization error visible in the warning below.
    }
    console.warn("Could not initialize sample pharmacy orders.", error);
  }
}
