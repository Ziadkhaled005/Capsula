import { apiClient, unwrapApiResponse } from "./client";
import type {
  InventoryFilter,
  InventoryResponse,
  InventoryItem,
  UploadInventoryResponse,
  UpdateInventoryItemRequest,
} from "@/types";

const STOCK_STATUS_TO_API: Record<string, string> = {
  "in-stock": "Available",
  "low-stock": "Low",
  "out-of-stock": "OutOfStock",
};

function mapInventoryItem(raw: any): InventoryItem {
  return {
    id: String(raw.productId ?? raw.id ?? ""),
    name: String(raw.productName ?? raw.name ?? "—"),
    sku: String(raw.code ?? raw.sku ?? raw.productId ?? ""),
    category: String(raw.categoryName ?? raw.category ?? "—"),
    stockTotal: Number(raw.reorderLevel ?? raw.stockTotal ?? 0),
    stockCurrent: Number(raw.quantity ?? raw.stockCurrent ?? 0),
    price: Number(raw.price ?? 0),
    lastUpdated: raw.lastUpdated ?? "",
    imageUrl: raw.imageUrl,
    description: raw.description,
    barcode: raw.barcode,
    expiryDate: raw.expiryDate,
    manufacturer: raw.manufacturer,
    stripQuantity: raw.stripQuantity == null ? undefined : Number(raw.stripQuantity),
    stripPrice: raw.stripPrice == null ? undefined : Number(raw.stripPrice),
    stockStatus: raw.status,
  };
}

export async function getInventory(filters: InventoryFilter = {}): Promise<InventoryResponse> {
  const { data } = await apiClient.get("/api/admin/inventory", {
    params: {
      categoryId: filters.category ? Number(filters.category) || undefined : undefined,
      search: filters.search?.trim() || undefined,
      status: filters.stockStatus && filters.stockStatus !== "all"
        ? STOCK_STATUS_TO_API[filters.stockStatus]
        : undefined,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10,
    },
  });

  const result = unwrapApiResponse<any>(data);
  const rows = Array.isArray(result) ? result : (result?.items ?? result?.data ?? []);
  const mapped = rows.map(mapInventoryItem);
  const total = Number(result?.totalCount ?? result?.total ?? mapped.length);
  const page = Number(result?.page ?? filters.page ?? 1);
  const pageSize = Number(result?.pageSize ?? filters.pageSize ?? 10);

  return {
    data: mapped,
    total,
    page,
    pageSize,
    totalPages: Number(result?.totalPages ?? Math.ceil(total / Math.max(1, pageSize))),
    categories: [...new Set(mapped.map((item: InventoryItem) => item.category).filter((value: string) => value && value !== "—"))],
  };
}

export async function getInventoryAlerts(): Promise<InventoryItem[]> {
  const { data } = await apiClient.get("/api/admin/inventory/alerts");
  const result = unwrapApiResponse<any>(data);
  const rows = Array.isArray(result) ? result : (result?.items ?? result?.data ?? []);
  return rows.map(mapInventoryItem);
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const response = await getInventory({ search: id, page: 1, pageSize: 100 });
  const item = response.data.find((entry) => entry.id === id || entry.sku === id);
  if (!item) throw new Error("لم يتم العثور على المنتج في المخزون.");
  return item;
}

export async function uploadInventory(
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<UploadInventoryResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/api/admin/inventory/bulk-update", formData, {
    onUploadProgress: (event) => {
      if (onUploadProgress && event.total) onUploadProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  const request = unwrapApiResponse<any>(data);
  // This endpoint creates a review request; it does not apply stock immediately.
  return {
    success: true,
    imported: 0,
    skipped: Number(request?.notAllowedRows ?? 0),
    errors: [],
    fileName: request?.fileName ?? file.name,
    uploadedAt: request?.createdDate ?? new Date().toISOString(),
    requestId: request?.id == null ? undefined : String(request.id),
    status: request?.status ?? "Pending",
    message: "تم رفع الملف بنجاح، والمخزون ينتظر المراجعة والموافقة.",
  };
}

export async function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemRequest,
): Promise<InventoryItem> {
  const body: Record<string, unknown> = {};
  if (payload.stockCurrent !== undefined) body.newQuantity = payload.stockCurrent;
  if (payload.stripQuantity !== undefined) body.newStripQuantity = payload.stripQuantity;
  if (payload.price !== undefined) body.price = payload.price;
  if (payload.stripPrice !== undefined) body.stripPrice = payload.stripPrice;

  const { data } = await apiClient.put(`/api/admin/inventory/${encodeURIComponent(id)}`, body);
  return mapInventoryItem(unwrapApiResponse<any>(data));
}

export async function adjustInventory(id: string, adjustment: number, reason: string): Promise<void> {
  const { data } = await apiClient.put(`/api/admin/inventory/${encodeURIComponent(id)}/adjust`, {
    adjustment,
    reason,
  });
  unwrapApiResponse<unknown>(data);
}
