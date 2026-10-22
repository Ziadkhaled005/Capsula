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
    lastUpdated: String(raw.lastUpdated ?? raw.updatedAt ?? ""),
    imageUrl: raw.imageUrl ?? raw.productImageUrl ?? undefined,
    description: raw.description ?? undefined,
    barcode: raw.barcode ?? raw.code ?? undefined,
    expiryDate: raw.expiryDate ?? undefined,
    manufacturer: raw.manufacturer ?? undefined,
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

function stockStatus(raw: BackendInventoryItem): InventoryFilter["stockStatus"] {
  const status = String(raw.status ?? "").toLowerCase();
  if (status === "outofstock" || status === "out-of-stock") return "out-of-stock";
  if (status === "low" || status === "low-stock") return "low-stock";
  return "in-stock";
}

export async function getInventory(filters: InventoryFilter = {}): Promise<InventoryResponse> {
  const params: Record<string, string | number> = {};
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.category?.trim()) {
    const categoryId = Number(filters.category);
    if (Number.isFinite(categoryId)) params.categoryId = categoryId;
  }
  if (filters.stockStatus && filters.stockStatus !== "all") {
    params.status = filters.stockStatus === "out-of-stock"
      ? "OutOfStock"
      : filters.stockStatus === "low-stock" ? "Low" : "Available";
  }

  const { data } = await apiClient.get("/api/admin/inventory", { params });
  const rawItems = getList(data);
  const allItems = rawItems.map(toItem);
  const categories = [...new Set(rawItems.map((item) => String(item.categoryName ?? item.category ?? "")).filter(Boolean))];
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 10);
  const total = Number((unwrapApiResponse<any>(data) as any)?.totalCount ?? allItems.length);

  return {
    data: allItems.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    categories,
  };
}

export async function getInventoryAlerts(): Promise<InventoryItem[]> {
  const { data } = await apiClient.get("/api/admin/inventory/alerts");
  return getList(data).map(toItem);
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const { data } = await apiClient.get(`/api/admin/inventory`, { params: { search: id } });
  const item = getList(data).map(toItem).find((row) => row.id === id);
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
    success: Boolean(result && result.status === "Pending"),
    imported: Number(result?.matchedRows ?? result?.imported ?? 0),
    skipped: Number(result?.notAllowedRows ?? result?.skipped ?? 0),
    errors: Array.isArray(result?.errors) ? result.errors : [],
    fileName: String(result?.fileName ?? file.name),
    uploadedAt: String(result?.createdDate ?? new Date().toISOString()),
  };
}

export async function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemRequest,
): Promise<InventoryItem> {
  const body: Record<string, unknown> = {};
  if (payload.stockCurrent !== undefined) body.newQuantity = payload.stockCurrent;
  if (payload.price !== undefined) body.price = payload.price;
  const { data } = await apiClient.put(`/api/admin/inventory/${encodeURIComponent(id)}`, body);
  return toItem(unwrapApiResponse<BackendInventoryItem>(data));
}

export async function adjustInventory(id: string, adjustment: number, reason: string) {
  const { data } = await apiClient.put(
    `/api/admin/inventory/${encodeURIComponent(id)}/adjust`,
    { adjustment, reason },
  );
  return unwrapApiResponse<unknown>(data);
}
