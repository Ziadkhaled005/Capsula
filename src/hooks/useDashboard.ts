import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardAPI } from "@/api";

export const DASHBOARD_KEYS = {
  all: ["dashboard"] as const,
  stats: () => ["dashboard", "stats"] as const,
  pharmacy: () => ["dashboard", "pharmacy"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats(),
    queryFn: DashboardAPI.getDashboard,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "superadmin"] as const,
    queryFn: () => DashboardAPI.getSuperAdminDashboard(),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function usePharmacy() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.pharmacy(),
    queryFn: DashboardAPI.getPharmacy,
    staleTime: 300000,
  });
}

export function useSetPharmacyAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: DashboardAPI.setPharmacyAvailability,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.pharmacy() });
    },
  });
}
