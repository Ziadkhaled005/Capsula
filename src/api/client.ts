import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://capsula.prognil.com"
).replace(/\/+$/, "");

export type ApiValidationError = {
  identifier?: string;
  errorMessage?: string;
  errorCode?: string;
  severity?: number;
};

export type ApiEnvelope<T> = {
  value: T | null;
  status?: number;
  isSuccess: boolean;
  successMessage?: string;
  correlationId?: string;
  errors?: string[];
  validationErrors?: ApiValidationError[];
};

export class ApiResponseError extends Error {
  readonly errors: string[];
  readonly validationErrors: ApiValidationError[];
  readonly status?: number;
  readonly correlationId?: string;

  constructor(body: Partial<ApiEnvelope<unknown>>, fallback = "تعذر إكمال الطلب.") {
    const errors = Array.isArray(body.errors) ? body.errors.filter(Boolean) : [];
    const validationErrors = Array.isArray(body.validationErrors) ? body.validationErrors : [];
    super(errors[0] || validationErrors[0]?.errorMessage || body.successMessage || fallback);
    this.name = "ApiResponseError";
    this.errors = errors;
    this.validationErrors = validationErrors;
    this.status = body.status;
    this.correlationId = body.correlationId;
  }
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  // Let the browser set the multipart boundary for FormData.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

function clearSession() {
  if (typeof window === "undefined") return;
  for (const key of ["accessToken", "token", "refreshToken", "user"]) {
    localStorage.removeItem(key);
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as Partial<ApiEnvelope<unknown>> | undefined;
    if (body && typeof body === "object" && body.isSuccess === false) {
      throw new ApiResponseError(body, "فشل الطلب.");
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const url = error.config?.url ?? "";
      const isPublicAuthCall =
        /\/api\/Auth\/(Login|ForgotPassword|ResetPassword)$/i.test(url);

      if (!isPublicAuthCall) {
        clearSession();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(error);
  },
);

export function unwrapApiResponse<T>(response: unknown): T {
  if (response && typeof response === "object") {
    const record = response as Record<string, unknown>;

    // Handle the documented Capsula envelope. Failure is also checked here
    // in case a caller passes a body that did not go through apiClient.
    if (record.isSuccess === false) {
      throw new ApiResponseError(record as Partial<ApiEnvelope<unknown>>);
    }
    if ("value" in record) return record.value as T;
    if ("data" in record) return record.data as T;
  }

  return response as T;
}

export function getApiErrorMessage(error: unknown, fallback = "حدث خطأ. يرجى المحاولة مرة أخرى.") {
  if (error instanceof ApiResponseError) return error.message;
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined;
    if (body) {
      const first = body.errors?.[0] || body.validationErrors?.[0]?.errorMessage;
      if (first) return first;
    }
    if (!error.response) return "تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.";
  }
  return error instanceof Error ? error.message : fallback;
}
