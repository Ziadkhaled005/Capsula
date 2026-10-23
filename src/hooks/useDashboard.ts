import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardAPI } from "@/api";

export const DASHBOARD_KEYS = {
  all: ["dashboard"] as const,
  stats: () => ["dashboard", "stats"] as const,
  pharmacy: () => ["dashboard", "pharmacy"] as const,
};

/**
 * Fetch live dashboard stats.
 */
export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats(),
    queryFn: DashboardAPI.getAdminDashboardSummary,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/**
 * Fetch the current pharmacy profile.
 */
export function usePharmacy() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.pharmacy(),
    queryFn: DashboardAPI.getPharmacy,
    staleTime: 300_000,
  });
}

/**
 * Mutation: toggle pharmacy availability (accepting orders on/off).
 */
export function useSetPharmacyAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: DashboardAPI.setPharmacyAvailability,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.pharmacy() });
    },
  });
}
