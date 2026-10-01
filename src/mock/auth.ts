import type { LoginResponse } from "@/types";

export const MOCK_ADMIN: LoginResponse = {
  user: {
    id: "user-001",
    name: "مدير النظام",
    email: "admin@admin.com",
    role: "admin",
  },
  accessToken: "mock-access-token-admin",
  refreshToken: "mock-refresh-token-admin",
  expiresIn: 3600,
};

export const MOCK_PHARMACIST: LoginResponse = {
  user: {
    id: "user-002",
    name: "صيدلاني",
    email: "pharmacist@pharmacy.com",
    role: "pharmacist",
    pharmacyId: "pharmacy-001",
    pharmacyName: "صيدلية فينوس",
  },
  accessToken: "mock-access-token-pharmacist",
  refreshToken: "mock-refresh-token-pharmacist",
  expiresIn: 3600,
};

export const MOCK_CREDENTIALS: Record<string, LoginResponse> = {
  "admin@admin.com:123456789": MOCK_ADMIN,
};
