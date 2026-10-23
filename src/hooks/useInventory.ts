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
    queryFn: () =>
      InventoryAPI.getInventory({
        search: filters.search,
        page: filters.page,
        pageSize: filters.pageSize,
        status:
          filters.stockStatus === "in-stock"
            ? "Available"
            : filters.stockStatus === "low-stock"
              ? "Low"
              : filters.stockStatus === "out-of-stock"
                ? "OutOfStock"
                : undefined,
      }),
    staleTime: 60_000,
  });
}

/**
 * Mutation: upload a CSV or XLSX file to bulk-update inventory.
 */
export function useUploadInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file }: { file: File }) => InventoryAPI.uploadInventory(file),
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
      return InventoryAPI.updateInventory(Number(id), {
        newQuantity: payload.stockCurrent,
        price: payload.price,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
    },
  });
}
