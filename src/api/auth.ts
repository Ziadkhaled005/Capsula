import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from "@/types";

/**
 * POST /auth/login
 * Authenticate user and receive access + refresh tokens.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

/**
 * POST /auth/logout
 * Invalidate current session tokens on the server.
 */
export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem("refreshToken");
  await apiClient.post("/auth/logout", { refreshToken });
}

/**
 * POST /auth/refresh
 * Exchange a refresh token for a new access token.
 */
export async function refreshToken(token: string): Promise<RefreshTokenResponse> {
  const { data } = await apiClient.post<RefreshTokenResponse>("/auth/refresh", {
    refreshToken: token,
  });
  return data;
}

/**
 * POST /auth/forgot-password
 * Send a password-reset email to the given address.
 */
export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await apiClient.post("/auth/forgot-password", payload);
}

/**
 * POST /auth/reset-password
 * Set a new password using the token from the reset email.
 */
export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient.post("/auth/reset-password", payload);
}

/**
 * POST /auth/change-password
 * Change password for the currently authenticated user.
 */
export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await apiClient.post("/auth/change-password", payload);
}
