import { useSyncExternalStore } from "react";

export type Decision = "accepted" | "rejected" | "review";
export type Check = "all-allowed" | "not-allowed";

const decisions = new Map<string, Decision>();
const checks = new Map<string, Check>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setDecision(id: string, d: Decision) {
  decisions.set(id, d);
  emit();
}

export function getDecision(id: string): Decision | undefined {
  return decisions.get(id);
}

export function setCheck(id: string, c: Check) {
  checks.set(id, c);
  emit();
}

export function getCheck(id: string): Check | undefined {
  return checks.get(id);
}

export function toggleCheck(id: string, current: Check) {
  const next: Check = current === "all-allowed" ? "not-allowed" : "all-allowed";
  checks.set(id, next);
  emit();
  return next;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useDecision(id: string): Decision | undefined {
  return useSyncExternalStore(
    subscribe,
    () => decisions.get(id),
    () => undefined,
  );
}

export function useDecisionsVersion() {
  return useSyncExternalStore(
    subscribe,
    () =>
      decisions.size +
      "-" +
      Array.from(decisions.entries()).map(([k, v]) => k + v).join(",") +
      "|" +
      checks.size +
      "-" +
      Array.from(checks.entries()).map(([k, v]) => k + v).join(","),
    () => "",
  );
}
