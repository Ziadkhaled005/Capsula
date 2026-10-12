import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryAPI, isMockMode } from "@/api";
import { MOCK_INVENTORY_RESPONSE } from "@/mock/inventory";
import type { InventoryFilter, UpdateInventoryItemRequest } from "@/types";

export const INVENTORY_KEYS = {
  all: ["inventory"] as const,
  list: (filters: InventoryFilter) => ["inventory", "list", filters] as const,
  detail: (id: string) => ["inventory", "detail", id] as const,
};

/**
 * Fetch paginated/filtered inventory items.
 * Falls back to mock data when VITE_API_BASE_URL is not set.
 */
export function useInventory(filters: InventoryFilter = {}) {
  return useQuery({
    queryKey: INVENTORY_KEYS.list(filters),
    queryFn: async () => {
      if (isMockMode) return MOCK_INVENTORY_RESPONSE;
      return InventoryAPI.getInventory(filters);
    },
    staleTime: 60_000,
  });
}

/**
 * Mutation: upload a CSV or XLSX file to bulk-update inventory.
 */
export function useUploadInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
    }) => {
      if (isMockMode) {
        return new Promise<ReturnType<typeof InventoryAPI.uploadInventory>>((resolve) =>
          setTimeout(
            () =>
              resolve(
                Promise.resolve({
                  success: true,
                  imported: 8,
                  skipped: 0,
                  errors: [],
                  fileName: file.name,
                  uploadedAt: new Date().toISOString(),
                }),
              ),
            2500,
          ),
        );
      }
      return InventoryAPI.uploadInventory(file, onProgress);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
    },
  });
}

/**
 * Mutation: update a single inventory item.
 */
export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInventoryItemRequest }) => {
      if (isMockMode) return Promise.resolve({ id } as any);
      return InventoryAPI.updateInventoryItem(id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
    },
  });
}
