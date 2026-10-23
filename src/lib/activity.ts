import type { JsonRecord } from "@/api/contracts";
import { formatTimeAndDate } from "@/lib/datetime";

export type Activity = {
  id: string;
  status: "accepted" | "rejected" | "review";
  label: string;
  time: string;
  date: string;
  reference: string;
  pharmacy: string;
};

export function activityStatus(status: unknown): Pick<Activity, "status" | "label"> {
  if (status === "Approved") return { status: "accepted", label: "مقبول" };
  if (status === "Rejected") return { status: "rejected", label: "مرفوض" };
  return { status: "review", label: "قيد المراجعة" };
}

export function mapActivity(item: JsonRecord, index: number): Activity {
  const { time, date } = formatTimeAndDate(item.date);
  return {
    id: String(item.requestId ?? index),
    ...activityStatus(item.status),
    time,
    date,
    reference: item.activityType === "InventoryUpdate" || !item.activityType ? "طلب تحديث مخزون" : String(item.activityType),
    pharmacy: String(item.pharmacyName ?? "—"),
  };
}
