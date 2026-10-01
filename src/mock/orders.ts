import type { Order, OrdersResponse } from "@/types";

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord-001",
    orderNo: "13554",
    customer: {
      id: "cust-001",
      name: "احمد محمد",
      phone: "011432567875",
      address: "مكان عمل، القاهرة الجديدة السفارة الا...",
      addressDetail: "مبنى ابسيسز، الدور الرابع، مكتب 11 الاسانسير كوده 4235",
    },
    products: [
      { id: "prod-001", name: "باندول ادفانس", sku: "92850", qty: 2, unitPrice: 15, totalPrice: 30, available: false },
      { id: "prod-002", name: "باندول نايت", sku: "12615", qty: 2, unitPrice: 15, totalPrice: 30, available: true },
      { id: "prod-003", name: "باندول اكسترا", sku: "67667", qty: 2, unitPrice: 30, totalPrice: 60, available: true },
      { id: "prod-004", name: "باندول صداع نصفي", sku: "41536", qty: 2, unitPrice: 100, totalPrice: 200, available: false },
    ],
    status: "pending-confirm",
    payment: "cash",
    subtotal: 160,
    deliveryFee: 30,
    discount: -100,
    total: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    remainingMinutes: 533,
  },
  {
    id: "ord-002",
    orderNo: "13555",
    customer: {
      id: "cust-002",
      name: "محمد فتح الله",
      phone: "011432567875",
      address: "مكان عمل، القاهرة الجديدة السفارة الا...",
    },
    products: [
      { id: "prod-001", name: "باندول ادفانس", sku: "92850", qty: 2, unitPrice: 15, totalPrice: 30, available: false },
      { id: "prod-002", name: "باندول نايت", sku: "12615", qty: 2, unitPrice: 15, totalPrice: 30, available: true },
      { id: "prod-003", name: "باندول اكسترا", sku: "67667", qty: 2, unitPrice: 30, totalPrice: 60, available: true },
      { id: "prod-004", name: "باندول صداع نصفي", sku: "41536", qty: 2, unitPrice: 100, totalPrice: 200, available: false },
    ],
    status: "pending-confirm",
    payment: "card",
    subtotal: 160,
    deliveryFee: 30,
    discount: -100,
    total: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-003",
    orderNo: "13556",
    customer: {
      id: "cust-003",
      name: "عبدالله",
      phone: "011432567875",
      address: "مكان عمل، القاهرة الجديدة السفارة الا...",
    },
    products: [
      { id: "prod-001", name: "باندول ادفانس", sku: "92850", qty: 2, unitPrice: 15, totalPrice: 30, available: true },
      { id: "prod-002", name: "باندول نايت", sku: "12615", qty: 2, unitPrice: 15, totalPrice: 30, available: true },
    ],
    status: "pending-confirm",
    payment: "card",
    subtotal: 160,
    deliveryFee: 30,
    discount: -100,
    total: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_ORDERS_RESPONSE: OrdersResponse = {
  data: MOCK_ORDERS,
  total: MOCK_ORDERS.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};
