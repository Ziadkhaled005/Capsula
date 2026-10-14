import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryAPI } from "@/api";
import type { InventoryFilter, UpdateInventoryItemRequest } from "@/types";

export const INVENTORY_KEYS = {
  all: ["inventory"] as const,
  list: (filters: InventoryFilter) => ["inventory", "list", filters] as const,
  detail: (id: string) => ["inventory", "detail", id] as const,
};

/**
 * Fetch paginated/filtered inventory items.
 */
export function useInventory(filters: InventoryFilter = {}) {
  return useQuery({
    queryKey: INVENTORY_KEYS.list(filters),
    queryFn: () => InventoryAPI.getInventory(filters),
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
    }) => InventoryAPI.uploadInventory(file, onProgress),
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
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInventoryItemRequest }) =>
      InventoryAPI.updateInventoryItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
    },
  });
}
