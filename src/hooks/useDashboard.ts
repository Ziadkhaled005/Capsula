import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardAPI, isMockMode } from "@/api";
import { MOCK_DASHBOARD } from "@/mock/dashboard";

export const DASHBOARD_KEYS = {
  all: ["dashboard"] as const,
  stats: () => ["dashboard", "stats"] as const,
  pharmacy: () => ["dashboard", "pharmacy"] as const,
};

/**
 * Fetch live dashboard stats and recent orders.
 * Falls back to mock data when VITE_API_BASE_URL is not set.
 */
export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats(),
    queryFn: async () => {
      if (isMockMode) return MOCK_DASHBOARD;
      return DashboardAPI.getDashboard();
    },
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
    queryFn: async () => {
      if (isMockMode) {
        return {
          id: "pharmacy-001",
          name: "صيدلية فينوس",
          address: "القاهرة الجديدة",
          phone: "01234567890",
          email: "venus@pharmacy.com",
          isAcceptingOrders: true,
          createdAt: new Date().toISOString(),
        };
      }
      return DashboardAPI.getPharmacy();
    },
    staleTime: 300_000,
  });
}

/**
 * Mutation: toggle pharmacy availability (accepting orders on/off).
 */
export function useSetPharmacyAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isAccepting: boolean) => {
      if (isMockMode) return Promise.resolve({ isAcceptingOrders: isAccepting } as any);
      return DashboardAPI.setPharmacyAvailability(isAccepting);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.pharmacy() });
    },
  });
}
