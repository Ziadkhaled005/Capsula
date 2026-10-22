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
  jwtToken?: string;
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  expiresIn?: number;
};

function normalizeRole(user: BackendUser): User["role"] {
  const roles = (user.roles ?? (user.role ? [user.role] : []))
    .map((role) => role.trim().toLowerCase());

  if (roles.some((role) => role === "superadmin" || role === "admin")) return "admin";
  if (roles.includes("pharmacist")) return "pharmacist";
  throw new Error("الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة أو الصيدلية.");
}

function normalizeUser(user: BackendUser, fallbackEmail: string): User {
  const name =
    user.name ||
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.userName ||
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

function normalizeLoginResponse(payload: unknown, email: string): LoginResponse {
  const response = unwrapApiResponse<BackendLoginResponse>(payload);
  const backendUser = response.user ?? response;
  const accessToken =
    response.accessToken ??
    response.token ??
    response.jwtToken ??
    response.access_token ??
    "";

  if (!accessToken.trim()) {
    throw new Error("استجابة تسجيل الدخول لا تحتوي على رمز الدخول.");
  }

  const user = normalizeUser(backendUser, email);
  if (!user.id) {
    throw new Error("استجابة تسجيل الدخول لا تحتوي على معرّف المستخدم.");
  }

  return {
    user,
    accessToken,
    // Capsula's integration guide explicitly states there is no refresh endpoint.
    refreshToken: "",
    expiresIn: response.expiresIn ?? 86400,
  };
}

/** POST /api/Auth/Login */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post("/api/Auth/Login", payload);
  return normalizeLoginResponse(data, payload.email);
}

/** GET /api/Auth/GetCurrentUser */
export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get("/api/Auth/GetCurrentUser");
  const raw = unwrapApiResponse<BackendUser>(data);
  return normalizeUser(raw, raw.email ?? raw.userName ?? "");
}

export async function logout(): Promise<void> {
  for (const key of ["accessToken", "token", "refreshToken", "user"]) {
    localStorage.removeItem(key);
  }
}

/**
 * Kept for compatibility with older imports only. The documented backend
 * has no refresh endpoint, so this function intentionally does not issue a request.
 */
export async function refreshToken(_token: string): Promise<RefreshTokenResponse> {
  throw new Error("تسجيل الدخول في كبسولة لا يدعم تجديد الرمز؛ يرجى تسجيل الدخول مرة أخرى.");
}

/** POST /api/Auth/ForgotPassword */
export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await apiClient.post("/api/Auth/ForgotPassword", payload);
}

/** POST /api/Auth/ResetPassword */
export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient.post("/api/Auth/ResetPassword", payload);
}

/** PUT /api/Auth/ChangePassword */
export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await apiClient.put("/api/Auth/ChangePassword", payload);
}
