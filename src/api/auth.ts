import { apiRequest } from "./client";
import type { CurrentUser, LoginResult } from "./contracts";

export interface LoginRequest {
  email: string;
  password: string;
}

export async function login(payload: LoginRequest): Promise<LoginResult> {
  return apiRequest<LoginResult>("/Auth/Login", {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>("/Auth/GetCurrentUser");
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest<null>("/Auth/ForgotPassword", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(payload: {
  email: string;
  otpCode: string;
  newPassword: string;
}): Promise<void> {
  await apiRequest<null>("/Auth/ResetPassword", {
    method: "POST",
    body: payload,
  });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiRequest<null>("/Auth/ChangePassword", {
    method: "PUT",
    body: payload,
  });
}
