import { apiRequest } from "./client";
import type { JsonRecord } from "./contracts";

export async function getCustomers(): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>("/superadmin/Customers");
}

export async function getCustomer(id: string | number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/superadmin/Customers/${encodeURIComponent(String(id))}`);
}

export async function getUsers(): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>("/superadmin/Users");
}

export async function getUser(id: string): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/superadmin/Users/${encodeURIComponent(id)}`);
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  await apiRequest<null>(
    `/superadmin/Users/${encodeURIComponent(id)}/${active ? "activate" : "deactivate"}`,
    { method: "PUT" },
  );
}

export async function getSupportTickets(): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>("/superadmin/Supports");
}

export async function getSupportTicket(id: number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/superadmin/Supports/${id}`);
}

export async function updateSupportTicketStatus(
  id: number,
  status: "Pending" | "Contacted" | "Solved",
): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/superadmin/Supports/${id}/status`, {
    method: "PUT",
    body: { status },
  });
}
