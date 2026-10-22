import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/api";

export const SUPERADMIN_KEYS = {
  all: ["superadmin"] as const,
  settings: () => ["superadmin", "settings"] as const,
  allowedProducts: (f: unknown) => ["superadmin", "allowed-products", f] as const,
  pharmacies: (f: unknown) => ["superadmin", "pharmacies", f] as const,
  requests: (f: unknown) => ["superadmin", "inventory-requests", f] as const,
  request: (id: number, f: unknown) => ["superadmin", "inventory-requests", id, f] as const,
  dashboard: () => ["superadmin", "dashboard"] as const,
  overview: (f: unknown) => ["superadmin", "reports-overview", f] as const,
  performance: (year: number) => ["superadmin", "pharmacy-performance", year] as const,
  customers: () => ["superadmin", "customers"] as const,
  users: () => ["superadmin", "users"] as const,
  supports: () => ["superadmin", "supports"] as const,
};

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const iso = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

// Settings
export function useSettings() {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.settings(),
    queryFn: SuperAdminAPI.getSettings,
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: SuperAdminAPI.updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPERADMIN_KEYS.settings() }),
  });
}

// Allowed products
export function useAllowedProducts(filter: SuperAdminAPI.AllowedProductsFilter = {}) {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.allowedProducts(filter),
    queryFn: () => SuperAdminAPI.getAllowedProducts(filter),
    staleTime: 30_000,
  });
}

export function useAllowedProductMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: SUPERADMIN_KEYS.all });
  return {
    update: useMutation({
      mutationFn: ({
        productId,
        payload,
      }: {
        productId: number;
        payload: { name: string; code: string; categoryId: number; isActive: boolean };
      }) => SuperAdminAPI.updateAllowedProduct(productId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (productId: number) => SuperAdminAPI.deleteAllowedProduct(productId),
      onSuccess: invalidate,
    }),
    upload: useMutation({
      mutationFn: (file: File) => SuperAdminAPI.uploadAllowedProducts(file),
      onSuccess: invalidate,
    }),
  };
}

// Pharmacies
export function usePharmacies(filter: SuperAdminAPI.PharmaciesFilter = {}) {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.pharmacies(filter),
    queryFn: () => SuperAdminAPI.getPharmacies(filter),
    staleTime: 30_000,
  });
}

export function usePharmacyMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: SUPERADMIN_KEYS.all });
  return {
    create: useMutation({
      mutationFn: SuperAdminAPI.createPharmacy,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: SuperAdminAPI.PharmacyPayload }) =>
        SuperAdminAPI.updatePharmacy(id, payload),
      onSuccess: invalidate,
    }),
    suspend: useMutation({
      mutationFn: (id: number) => SuperAdminAPI.suspendPharmacy(id),
      onSuccess: invalidate,
    }),
    activate: useMutation({
      mutationFn: (id: number) => SuperAdminAPI.activatePharmacy(id),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => SuperAdminAPI.deletePharmacy(id),
      onSuccess: invalidate,
    }),
  };
}

// Inventory requests
export function useInventoryRequests(filter: SuperAdminAPI.InventoryRequestsFilter = {}) {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.requests(filter),
    queryFn: () => SuperAdminAPI.getInventoryRequests(filter),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useInventoryRequest(
  id: number,
  opts: { isMatched?: boolean; page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.request(id, opts),
    queryFn: () => SuperAdminAPI.getInventoryRequest(id, opts),
    enabled: Number.isFinite(id),
  });
}

export function useReviewInventoryRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      reviewNote,
    }: {
      id: number;
      decision: "Approved" | "Rejected";
      reviewNote?: string;
    }) => SuperAdminAPI.reviewInventoryRequest(id, { decision, reviewNote }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPERADMIN_KEYS.all }),
  });
}

export function useSetRequestRowNote(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rowId, note }: { rowId: number; note: string }) =>
      SuperAdminAPI.setRequestRowNote(id, rowId, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPERADMIN_KEYS.request(id, {}) }),
  });
}

// Dashboard & reports
export function useSuperAdminDashboardQuery() {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.dashboard(),
    queryFn: () => SuperAdminAPI.getSuperAdminDashboard(),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useReportsOverview(
  filter: {
    period?: "Day" | "Week" | "Month" | "Year";
    from?: string;
    to?: string;
  } = {},
) {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.overview(filter),
    queryFn: () => SuperAdminAPI.getReportsOverview(filter),
    staleTime: 30_000,
  });
}

export function usePharmacyPerformance(year: number) {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.performance(year),
    queryFn: () => SuperAdminAPI.getPharmacyPerformance(year),
    staleTime: 60_000,
  });
}

// People & support
export function useCustomers() {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.customers(),
    queryFn: () => SuperAdminAPI.getCustomers(),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.users(),
    queryFn: () => SuperAdminAPI.getUsers(),
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      SuperAdminAPI.setUserActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPERADMIN_KEYS.users() }),
  });
}

export function useSupportTickets() {
  return useQuery({
    queryKey: SUPERADMIN_KEYS.supports(),
    queryFn: () => SuperAdminAPI.getSupportTickets(),
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "Pending" | "Contacted" | "Solved" }) =>
      SuperAdminAPI.updateTicketStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPERADMIN_KEYS.supports() }),
  });
}
