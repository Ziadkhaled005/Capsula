import { apiClient, unwrapApiResponse } from "./client";
import type {
  User,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from "@/types";

type BackendUser = Partial<User> & {
  id?: string | number;
  userId?: string | number;
  userName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  roles?: string[];
};

type BackendLoginResponse = BackendUser & {
  user?: BackendUser;
  token?: string;
  accessToken?: string;
  jwtToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  expiresIn?: number;
};

function normalizeRole(user: BackendUser): User["role"] {
  const roles = (user.roles ?? (user.role ? [user.role] : []))
    .map((role) => role.trim().toLowerCase());

  if (roles.includes("superadmin") || roles.includes("admin")) return "admin";
  if (roles.includes("pharmacist")) return "pharmacist";
  throw new Error("الحساب لا يملك صلاحية دخول لوحة التحكم.");
}

function normalizeUser(user: BackendUser, fallbackEmail: string): User {
  const name =
    user.fullName ||
    user.name ||
    user.userName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    fallbackEmail;

  return {
    id: String(user.id ?? user.userId ?? ""),
    name,
    email: user.email ?? fallbackEmail,
    role: normalizeRole(user),
    pharmacyId: user.pharmacyId,
    pharmacyName: user.pharmacyName,
    avatar: user.avatar,
  };
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post("/api/Auth/Login", payload);
  const response = unwrapApiResponse<BackendLoginResponse>(data);
  const user = normalizeUser(response.user ?? response, payload.email);
  const accessToken =
    response.token ?? response.accessToken ?? response.jwtToken ?? response.access_token ?? "";

  if (!accessToken.trim()) throw new Error("استجابة تسجيل الدخول لا تحتوي على رمز الدخول.");
  if (!user.id) throw new Error("استجابة تسجيل الدخول لا تحتوي على معرّف المستخدم.");

  return {
    user,
    accessToken,
    // The documented API does not issue refresh tokens. Keep this optional for old callers.
    refreshToken: "",
    expiresIn: response.expiresIn ?? 86400,
  };
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get("/api/Auth/GetCurrentUser");
  const response = unwrapApiResponse<BackendUser>(data);
  const user = normalizeUser(response, response.email ?? "");
  if (!user.id) throw new Error("استجابة المستخدم الحالي لا تحتوي على معرّف.");
  return user;
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  const { data } = await apiClient.post("/api/Auth/ForgotPassword", payload);
  unwrapApiResponse<unknown>(data);
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  const { data } = await apiClient.post("/api/Auth/ResetPassword", payload);
  unwrapApiResponse<unknown>(data);
}

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  const { data } = await apiClient.put("/api/Auth/ChangePassword", payload);
  unwrapApiResponse<unknown>(data);
}
