// Labels for the InventoryValidationResult and InventoryRequestStatus enums.
export const checkMap = {
  AllAllowed: { label: "جميع المنتجات مسموحة", variant: "success" as const },
  HasNotAllowed: { label: "منتجات غير مسموحة", variant: "danger" as const },
};
export const requestStatusMap = {
  Approved: { label: "مقبول", variant: "success" as const },
  Rejected: { label: "مرفوض", variant: "danger" as const },
  Pending: { label: "قيد المراجعة", variant: "warning" as const },
};
