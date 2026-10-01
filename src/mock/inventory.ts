import type { InventoryItem, InventoryResponse } from "@/types";

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: "inv-001", name: "بانادول أدفانس، مسكن سريع وفعال للآلام الخفيفة", sku: "92850", category: "أدوية", stockTotal: 120, stockCurrent: 100, price: 20, lastUpdated: "2024-03-05" },
  { id: "inv-002", name: "بلسم مويستر", sku: "12615", category: "عناية بالشعر", stockTotal: 90, stockCurrent: 43, price: 18, lastUpdated: "2024-04-05" },
  { id: "inv-003", name: "دوف، صابون", sku: "67667", category: "عناية بالبشرة", stockTotal: 150, stockCurrent: 0, price: 10, lastUpdated: "2024-02-05" },
  { id: "inv-004", name: "بلسم الفيف هايالورون مويستشر من لوريال باريس", sku: "41536", category: "عناية بالشعر", stockTotal: 80, stockCurrent: 0, price: 25, lastUpdated: "2024-05-05" },
  { id: "inv-005", name: "سيروم دكتور بيلمور فيتا سيرين لتنعيم البشرة – 45 مل", sku: "92463", category: "عناية بالبشرة", stockTotal: 70, stockCurrent: 59, price: 30, lastUpdated: "2024-06-05" },
  { id: "inv-006", name: "واقي شمس كريم للبشرة الجافة و الحساسة SPF50 من افين 50 مل", sku: "81148", category: "عناية بالبشرة", stockTotal: 50, stockCurrent: 50, price: 40, lastUpdated: "2024-07-05" },
  { id: "inv-007", name: "ادول", sku: "1413", category: "أدوية", stockTotal: 100, stockCurrent: 50, price: 15, lastUpdated: "2024-01-05" },
  { id: "inv-008", name: "ادول", sku: "82451", category: "أدوية", stockTotal: 100, stockCurrent: 50, price: 15, lastUpdated: "2024-01-05" },
];

export const MOCK_CATEGORIES = ["كل الفئات", ...Array.from(new Set(MOCK_INVENTORY.map((i) => i.category)))];

export const MOCK_INVENTORY_RESPONSE: InventoryResponse = {
  data: MOCK_INVENTORY,
  total: MOCK_INVENTORY.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  categories: MOCK_CATEGORIES,
};
