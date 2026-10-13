import { apiClient, unwrapApiResponse } from "./client";
import type {
  InventoryFilter,
  InventoryResponse,
  InventoryItem,
  UploadInventoryResponse,
  UpdateInventoryItemRequest,
} from "@/types";

const STOCK_STATUS_TO_API: Record<
  Exclude<InventoryFilter["stockStatus"], undefined | "all">,
  number
> = {
  "in-stock": 0,
  "low-stock": 1,
  "out-of-stock": 2,
};

function toInventoryParams(filters: InventoryFilter) {
  const { stockStatus, category, ...params } = filters;
  const categoryId = category ? Number(category) : undefined;

  return {
    ...params,
    ...(categoryId && Number.isFinite(categoryId) ? { categoryId } : {}),
    ...(stockStatus && stockStatus !== "all" ? { status: STOCK_STATUS_TO_API[stockStatus] } : {}),
  };
}

/**
 * GET /inventory
 * Fetch paginated inventory with optional search, category, and stock-status filters.
 */
export async function getInventory(filters: InventoryFilter = {}): Promise<InventoryResponse> {
  const { data } = await apiClient.get("/api/admin/inventory", {
    params: toInventoryParams(filters),
  });
  return unwrapApiResponse<InventoryResponse>(data);
}

/**
 * GET /inventory/:id
 * Fetch a single inventory item by ID.
 */
export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const { data } = await apiClient.get("/api/admin/inventory", {
    params: { search: id, pageSize: 1 },
  });
  const response = unwrapApiResponse<InventoryResponse>(data);
  const item = response.data?.[0];
  if (!item) throw new Error("Inventory item not found");
  return item;
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

  const { data } = await apiClient.post("/api/admin/inventory/bulk-update", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onUploadProgress && e.total) {
        onUploadProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return unwrapApiResponse<UploadInventoryResponse>(data);
}

/**
 * PATCH /inventory/:id
 * Update a single inventory item's fields (name, price, stock, etc.).
 */
export async function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemRequest,
): Promise<InventoryItem> {
  const { data } = await apiClient.put(`/api/admin/inventory/${id}`, {
    newQuantity: payload.stockCurrent,
    price: payload.price,
  });
  return unwrapApiResponse<InventoryItem>(data);
}
