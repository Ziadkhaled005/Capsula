import { apiClient } from "./client";
import type {
  InventoryFilter,
  InventoryResponse,
  InventoryItem,
  UploadInventoryResponse,
  UpdateInventoryItemRequest,
} from "@/types";

/**
 * GET /inventory
 * Fetch paginated inventory with optional search, category, and stock-status filters.
 */
export async function getInventory(filters: InventoryFilter = {}): Promise<InventoryResponse> {
  const { data } = await apiClient.get<InventoryResponse>("/inventory", { params: filters });
  return data;
}

/**
 * GET /inventory/:id
 * Fetch a single inventory item by ID.
 */
export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const { data } = await apiClient.get<InventoryItem>(`/inventory/${id}`);
  return data;
}

/**
 * POST /inventory/upload
 * Upload a CSV or XLSX file to bulk-update pharmacy inventory.
 * Returns import summary with success count and any row-level errors.
 */
export async function uploadInventory(
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<UploadInventoryResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<UploadInventoryResponse>("/inventory/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onUploadProgress && e.total) {
        onUploadProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return data;
}

/**
 * PATCH /inventory/:id
 * Update a single inventory item's fields (name, price, stock, etc.).
 */
export async function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemRequest,
): Promise<InventoryItem> {
  const { data } = await apiClient.patch<InventoryItem>(`/inventory/${id}`, payload);
  return data;
}
