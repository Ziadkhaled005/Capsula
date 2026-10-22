import { apiClient, unwrapApiResponse } from "./client";
import type {
  InventoryFilter,
  InventoryResponse,
  InventoryItem,
  UploadInventoryResponse,
  UpdateInventoryItemRequest,
} from "@/types";

type BackendInventoryItem = Record<string, any>;

function toItem(raw: BackendInventoryItem): InventoryItem {
  const quantity = Number(raw.quantity ?? raw.stockCurrent ?? 0);
  const price = Number(raw.price ?? 0);
  return {
    id: String(raw.productId ?? raw.id ?? ""),
    name: String(raw.productName ?? raw.name ?? ""),
    sku: String(raw.code ?? raw.sku ?? ""),
    category: String(raw.categoryName ?? raw.category ?? ""),
    stockTotal: quantity,
    stockCurrent: quantity,
    price,
    stripQuantity: raw.stripQuantity !== undefined ? Number(raw.stripQuantity) : undefined,
    stripPrice: raw.stripPrice !== undefined ? Number(raw.stripPrice) : undefined,
    lastUpdated: String(raw.lastUpdated ?? raw.updatedAt ?? ""),
    imageUrl: raw.imageUrl ?? raw.productImageUrl ?? undefined,
    description: raw.description ?? undefined,
    barcode: raw.barcode ?? raw.code ?? undefined,
    expiryDate: raw.expiryDate ?? undefined,
    manufacturer: raw.manufacturer ?? undefined,
    stockStatus: raw.status,
  };
}

function getList(payload: unknown): BackendInventoryItem[] {
  const value = unwrapApiResponse<unknown>(payload);
  if (Array.isArray(value)) return value as BackendInventoryItem[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as BackendInventoryItem[];
    if (Array.isArray(record.data)) return record.data as BackendInventoryItem[];
  }
  throw new Error("استجابة المخزون من الخادم ليست بالقالب المتوقع.");
}

const API_STATUS: Record<string, string> = {
  "out-of-stock": "OutOfStock",
  "low-stock": "Low",
  "medium-stock": "Medium",
  "in-stock": "Available",
};

function stockStatus(raw: BackendInventoryItem): InventoryItem["stockStatus"] {
  return String(raw.status ?? "");
}

export async function getInventory(filters: InventoryFilter = {}): Promise<InventoryResponse> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 20);

  const params: Record<string, string | number> = { page, pageSize };
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.category?.trim()) {
    const categoryId = Number(filters.category);
    if (Number.isFinite(categoryId)) params.categoryId = categoryId;
  }
  // Server-side status filter — Medium is its own bucket, not "Available".
  if (filters.stockStatus && filters.stockStatus !== "all") {
    params.status = API_STATUS[filters.stockStatus] ?? "Available";
  }

  const { data } = await apiClient.get("/api/admin/inventory", { params });
  const envelope = unwrapApiResponse<any>(data);
  const rawItems: BackendInventoryItem[] = Array.isArray(envelope)
    ? envelope
    : Array.isArray(envelope?.items)
      ? envelope.items
      : [];
  const total = Number(envelope?.totalCount ?? rawItems.length);
  const totalPages = Number(envelope?.totalPages ?? Math.ceil(total / pageSize));

  const categories = [
    ...new Set(
      rawItems.map((item) => String(item.categoryName ?? item.category ?? "")).filter(Boolean),
    ),
  ];

  return {
    data: rawItems.map(toItem),
    total,
    page,
    pageSize,
    totalPages,
    categories,
  };
}

export async function getInventoryAlerts(): Promise<InventoryItem[]> {
  const { data } = await apiClient.get("/api/admin/inventory/alerts");
  return getList(data).map(toItem);
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const { data } = await apiClient.get(`/api/admin/inventory`, { params: { search: id } });
  const item = getList(data)
    .map(toItem)
    .find((row) => row.id === id);
  if (!item) throw new Error("لم يتم العثور على المنتج في المخزون.");
  return item;
}

/**
 * Upload creates a Pending inventory request. It does not immediately alter stock.
 */
export async function uploadInventory(
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<UploadInventoryResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/api/admin/inventory/bulk-update", formData, {
    onUploadProgress: (event) => {
      if (onUploadProgress && event.total) {
        onUploadProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  const result = unwrapApiResponse<Record<string, any>>(data);
  return {
    success: true,
    imported: Number(result?.matchedRows ?? 0),
    skipped: Number(result?.notAllowedRows ?? 0),
    errors: [],
    fileName: String(result?.fileName ?? file.name),
    uploadedAt: String(result?.createdDate ?? new Date().toISOString()),
    requestId: result?.id !== undefined ? String(result.id) : undefined,
    status: result?.status ?? "Pending",
    message: "تم رفع الملف وجاري مراجعته من الإدارة.",
  };
}

/** Sends all editable fields; omit a field in the payload to keep its current value. */
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
  return toItem(unwrapApiResponse<BackendInventoryItem>(data));
}

export async function adjustInventory(id: string, adjustment: number, reason: string) {
  const { data } = await apiClient.put(`/api/admin/inventory/${encodeURIComponent(id)}/adjust`, {
    adjustment,
    reason,
  });
  return unwrapApiResponse<unknown>(data);
}
