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

type BackendUser = Partial<User> & {
  userName?: string;
  fullName?: string;
  phoneNumber?: string;
};

type BackendLoginResponse = Partial<LoginResponse> & {
  token?: string;
  jwtToken?: string;
  access_token?: string;
  refresh_token?: string;
  user?: BackendUser;
};

function normalizeUser(user: BackendUser | undefined, email: string): User {
  return {
    id: String(user?.id ?? ""),
    name: user?.name ?? user?.fullName ?? user?.userName ?? email,
    email: user?.email ?? email,
    role: user?.role === "admin" ? "admin" : "pharmacist",
    pharmacyId: user?.pharmacyId,
    pharmacyName: user?.pharmacyName,
    avatar: user?.avatar,
  };
}

function normalizeLoginResponse(payload: unknown, email: string): LoginResponse {
  const response = unwrapApiResponse<BackendLoginResponse>(payload);
  const accessToken =
    response.accessToken ?? response.token ?? response.jwtToken ?? response.access_token ?? "";

  return {
    user: normalizeUser(response.user, email),
    accessToken,
    refreshToken: response.refreshToken ?? response.refresh_token ?? "",
    expiresIn: response.expiresIn ?? 3600,
  };
}

/**
 * POST /auth/login
 * Authenticate user and receive access + refresh tokens.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post("/api/Auth/Login", payload);
  return normalizeLoginResponse(data, payload.email);
}

/**
 * POST /auth/logout
 * Invalidate current session tokens on the server.
 */
export async function logout(): Promise<void> {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

/**
 * POST /auth/refresh
 * Exchange a refresh token for a new access token.
 */
export async function refreshToken(token: string): Promise<RefreshTokenResponse> {
  const { data } = await apiClient.post("/api/Auth/Refresh", {
    refreshToken: token,
  });
  return unwrapApiResponse<RefreshTokenResponse>(data);
}

/**
 * POST /auth/forgot-password
 * Send a password-reset email to the given address.
 */
export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await apiClient.post("/api/Auth/ForgotPassword", payload);
}

/**
 * POST /auth/reset-password
 * Set a new password using the token from the reset email.
 */
export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient.post("/api/Auth/ResetPassword", payload);
}

/**
 * POST /auth/change-password
 * Change password for the currently authenticated user.
 */
export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await apiClient.put("/api/Auth/ChangePassword", payload);
}
