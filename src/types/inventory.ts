export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stockTotal: number;
  stockCurrent: number;
  price: number;
  lastUpdated: string;
  imageUrl?: string;
  description?: string;
  barcode?: string;
  expiryDate?: string;
  manufacturer?: string;
  stripQuantity?: number;
  stripPrice?: number;
  stockStatus?: "OutOfStock" | "Low" | "Medium" | "Available" | string;
}

export interface InventoryFilter {
  search?: string;
  category?: string;
  stockStatus?: "in-stock" | "medium-stock" | "low-stock" | "out-of-stock" | "all";
  page?: number;
  pageSize?: number;
}

export interface InventoryResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: string[];
}

export interface UploadInventoryResponse {
  /** True means the request was accepted for review, not that stock was changed. */
  success: boolean;
  imported: number;
  skipped: number;
  errors: { row: number; field: string; message: string }[];
  fileName: string;
  uploadedAt: string;
  requestId?: string;
  status?: "Pending" | "Approved" | "Rejected" | string;
  message?: string;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  category?: string;
  stockTotal?: number;
  stockCurrent?: number;
  price?: number;
  stripQuantity?: number;
  stripPrice?: number;
}
