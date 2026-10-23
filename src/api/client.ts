export interface ApiValidationError {
  identifier: string;
  errorMessage: string;
  errorCode: string;
  severity: number;
}

export interface ApiEnvelope<T> {
  value: T | null;
  status: number;
  isSuccess: boolean;
  successMessage?: string;
  correlationId?: string;
  errors?: string[];
  validationErrors?: ApiValidationError[];
}

export class ApiError extends Error {
  readonly errors: string[];
  readonly validationErrors: ApiValidationError[];
  readonly status: number;
  readonly correlationId?: string;

  constructor(envelope: Partial<ApiEnvelope<unknown>>, httpStatus?: number) {
    const errors = envelope.errors ?? [];
    const validationErrors = envelope.validationErrors ?? [];
    super(
      [...errors, ...validationErrors.map((error) => error.errorMessage)]
        .filter(Boolean)
        .join("\n") || "تعذر إكمال الطلب. يرجى المحاولة مرة أخرى.",
    );
    this.name = "ApiError";
    this.errors = errors;
    this.validationErrors = validationErrors;
    this.status = httpStatus ?? envelope.status ?? 500;
    this.correlationId = envelope.correlationId;
  }
}

// Accept the server origin (as the Dockerfile/CI pass it) or the full /api base.
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = RAW_API_BASE_URL
  ? /\/api\/?$/i.test(RAW_API_BASE_URL)
    ? RAW_API_BASE_URL
    : `${RAW_API_BASE_URL.replace(/\/+$/, "")}/api`
  : undefined;

export class ApiNotConfiguredError extends Error {
  constructor() {
    super("لم يتم ربط واجهة API بعد. أضف VITE_API_BASE_URL عند تجهيز الخادم الحقيقي.");
    this.name = "ApiNotConfiguredError";
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  responseType?: "json" | "blob";
};

function buildUrl(path: string, params?: ApiRequestOptions["params"]) {
  if (!API_BASE_URL) throw new ApiNotConfiguredError();

  const normalizedPath = path.replace(/^\/+/, "");
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const url = new URL(normalizedPath, baseUrl);
  if (query) url.search = query;
  return url.toString();
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, params, responseType = "json" } = options;
  const headers = new Headers({ Accept: responseType === "blob" ? "*/*" : "application/json" });
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ?? localStorage.getItem("accessToken")
      : null;

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined && body !== null && !isFormData(body)) {
    headers.set("Content-Type", "application/json");
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    requestBody = isFormData(body) || typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: requestBody,
  });

  // Login answers 401 with its own message for bad credentials; only an
  // authenticated request getting 401 means the session expired.
  if (response.status === 401 && token && !path.replace(/^\/+/, "").startsWith("Auth/Login")) {
    clearSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    throw new ApiError(
      { errors: ["انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى."] },
      401,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  if (responseType === "blob" && response.ok) {
    return (await response.blob()) as T;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      { errors: ["استجابة غير صالحة من خادم كبسولة."] },
      response.status,
    );
  }

  const envelope =
    payload && typeof payload === "object"
      ? (payload as Partial<ApiEnvelope<T>>)
      : undefined;

  if (!response.ok || envelope?.isSuccess === false) {
    throw new ApiError(envelope ?? {}, response.status);
  }

  if (envelope && "value" in envelope) {
    return envelope.value as T;
  }

  // A few older deployments return the resource directly instead of the
  // documented envelope. Keep the boundary tolerant without hiding failures.
  return payload as T;
}

export async function downloadFile(path: string): Promise<Blob> {
  return apiRequest<Blob>(path, { responseType: "blob" });
}

export const isApiConfigured = Boolean(API_BASE_URL);
