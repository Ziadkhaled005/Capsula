import { apiClient, unwrapApiResponse } from "./client";
import type {
  User,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from "@/types";

type BackendUser = Omit<Partial<User>, "role"> & {
  role?: string;
  roles?: string[];
  userId?: string;
  userName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};

type BackendLoginResponse = {
  user?: BackendUser;
  userId?: string;
  userName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  roles?: string[];
  token?: string;
  jwtToken?: string;
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  expiresIn?: number;
  isSuccess?: boolean;
  successMessage?: string;
  errors?: unknown[];
};

function normalizeRole(user: BackendUser): User["role"] {
  const roles = user.roles ?? (user.role ? [user.role] : []);

  const normalizedRoles = roles.map((role) => role.trim().toLowerCase());

  // SuperAdmin is an administrative role in this backend.
  if (normalizedRoles.includes("superadmin") || normalizedRoles.includes("admin")) {
    return "admin";
  }

  if (normalizedRoles.includes("pharmacist")) {
    return "pharmacist";
  }

  throw new Error("Invalid or unsupported user role");
}

function normalizeUser(user: BackendUser, email: string): User {
  return {
    id: String(user.id ?? user.userId ?? ""),
    name: user.name ?? user.fullName ?? user.userName ?? email,
    email: user.email ?? email,
    role: normalizeRole(user),
    pharmacyId: user.pharmacyId,
    pharmacyName: user.pharmacyName,
    avatar: user.avatar,
  };
}

function normalizeLoginResponse(payload: unknown, email: string): LoginResponse {
  const envelope = payload as {
    isSuccess?: boolean;
    successMessage?: string;
  } | null;

  if (envelope?.isSuccess === false) {
    throw new Error(envelope.successMessage ?? "Login failed");
  }

  const response = unwrapApiResponse<BackendLoginResponse>(payload);

  // The backend may return the user fields directly rather
  // than nesting them inside a "user" property.
  const backendUser = response.user ?? response;

  const accessToken =
    response.accessToken ?? response.token ?? response.jwtToken ?? response.access_token ?? "";

  if (!accessToken.trim()) {
    throw new Error("Login response does not contain an access token");
  }

  const user = normalizeUser(backendUser, email);

  if (!user.id) {
    throw new Error("Login response does not contain a user ID");
  }

  return {
    user,
    accessToken,
    refreshToken: response.refreshToken ?? response.refresh_token ?? "",
    expiresIn: response.expiresIn ?? 3600,
  };
}

/**
 * POST /api/Auth/Login
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post("/api/Auth/Login", payload);

  return normalizeLoginResponse(data, payload.email);
}

/**
 * POST /api/Auth/Logout
 */
export async function logout(): Promise<void> {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

/**
 * POST /api/Auth/Refresh
 */
export async function refreshToken(token: string): Promise<RefreshTokenResponse> {
  const { data } = await apiClient.post("/api/Auth/Refresh", { refreshToken: token });

  return unwrapApiResponse<RefreshTokenResponse>(data);
}

/**
 * POST /api/Auth/ForgotPassword
 */
export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await apiClient.post("/api/Auth/ForgotPassword", payload);
}

/**
 * POST /api/Auth/ResetPassword
 */
export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient.post("/api/Auth/ResetPassword", payload);
}

/**
 * POST /api/Auth/ChangePassword
 */
export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await apiClient.put("/api/Auth/ChangePassword", payload);
}
