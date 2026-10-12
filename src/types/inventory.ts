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
}

export interface InventoryFilter {
  search?: string;
  category?: string;
  stockStatus?: "in-stock" | "low-stock" | "out-of-stock" | "all";
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
  success: boolean;
  imported: number;
  skipped: number;
  errors: {
    row: number;
    field: string;
    message: string;
  }[];
  fileName: string;
  uploadedAt: string;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  category?: string;
  stockTotal?: number;
  stockCurrent?: number;
  price?: number;
}
