export type JsonRecord = Record<string, any>;

export interface LoginResult {
  userId: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  roles: ("SuperAdmin" | "Admin" | "Pharmacist" | string)[];
  token: string;
}

export interface CurrentUser {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
}

export interface PharmacyProfile {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  licenseNumber?: string;
  isActive: boolean;
  isAcceptingOrders: boolean;
  adminUserId?: string;
  allowedProductCount?: number;
  returnPolicy?: string | null;
}

export type ApiOrderStatus =
  | "PendingConfirmation"
  | "Confirmed"
  | "OnHold"
  | "InPreparation"
  | "InRoute"
  | "Delivered"
  | "Cancelled"
  | "WaitingForOffers";

export type BidStatus = "Open" | "Submitted" | "Won" | "Lost" | "Closed";

export interface BidListItem extends JsonRecord {
  orderId: number;
  createdDate: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  region?: string;
  itemCount: number;
  estimatedSubTotal: number;
  isPrescriptionOrder?: boolean;
  distanceKm?: number;
  offersDeadline?: string;
  offersExpireAt?: string;
  bidStatus: BidStatus;
  myOffer?: JsonRecord | null;
}

export interface PharmacyOrderDto extends JsonRecord {
  id: number;
  createdDate: string;
  customerName: string;
  customerPhone: string;
  status: ApiOrderStatus;
  paymentMethod: string;
  totalAmount: number;
  itemCount: number;
  confirmationDeadline?: string | null;
}

export interface InventoryDto extends JsonRecord {
  productId: number;
  productName: string;
  quantity: number;
  stripQuantity?: number | null;
  reorderLevel?: number;
  price: number;
  stripPrice?: number | null;
  categoryId?: number;
  categoryName?: string;
  lastUpdated?: string;
  status?: "OutOfStock" | "Low" | "Medium" | "Available";
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface BidOfferRequest {
  discountPercentage: number;
  preparationMinutes: number;
  deliveryMinutes: number;
  deliveryFee: number;
  notes?: string | null;
  prescriptionAmount?: number | null;
  unavailableItems: {
    orderItemId: number;
    alternativeProductIds: number[];
  }[];
}

export interface UpdateSystemSettingsDto extends JsonRecord {
  maxFileSizeInMB: number;
  fileUploadEnabled: boolean;
  lowStockThreshold: number;
  mediumStockThreshold: number;
  estimatedDeliveryDays: number;
  deliveryFee: number;
  confirmationSlaMinutes: number;
  maxOfferDiscountPercentage: number;
  offerRadiusKm: number;
  offerWindowMinutes: number;
  offerValidityMinutes: number;
  blockMissingColumns: boolean;
  preventDuplicateCodes: boolean;
  detectProductConflicts: boolean;
  allowPartialImport: boolean;
  generateErrorReport: boolean;
  approvalProtection: boolean;
}
