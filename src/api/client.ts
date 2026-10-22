import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://capsula.prognil.com").replace(/\/+$/, "");

export type ApiEnvelope<T> = {
  value: T | null;
  status?: number;
  isSuccess: boolean;
  successMessage?: string;
  correlationId?: string;
  errors?: string[];
  validationErrors?: Array<{
    identifier: string;
    errorMessage: string;
    errorCode?: string;
    severity?: number;
  }>;
};

export class ApiRequestError extends Error {
  status?: number;
  errors: string[];
  validationErrors: NonNullable<ApiEnvelope<unknown>["validationErrors"]>;
  correlationId?: string;

  constructor(message: string, envelope?: Partial<ApiEnvelope<unknown>>, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status ?? envelope?.status;
    this.errors = envelope?.errors ?? [];
    this.validationErrors = envelope?.validationErrors ?? [];
    this.correlationId = envelope?.correlationId;
  }
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  // Do not force application/json for FormData. The browser must add the multipart boundary.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (config.data !== undefined && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url ?? "");
    const isLoginRequest = /\/api\/Auth\/Login(?:\?|$)/i.test(requestUrl);

    if (status === 401 && !isLoginRequest && typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);

export function unwrapApiResponse<T>(response: unknown): T {
  if (!response || typeof response !== "object") return response as T;

  const envelope = response as Partial<ApiEnvelope<T>>;
  if ("isSuccess" in envelope) {
    if (envelope.isSuccess !== true) {
      const message =
        envelope.errors?.filter(Boolean).join("، ") ||
        envelope.validationErrors?.map((item) => item.errorMessage).filter(Boolean).join("، ") ||
        envelope.successMessage ||
        "تعذر تنفيذ الطلب.";
      throw new ApiRequestError(message, envelope as ApiEnvelope<unknown>);
    }
    return envelope.value as T;
  }

  // Compatibility for endpoints returning a direct value or an Axios-style data wrapper.
  if ("value" in (response as Record<string, unknown>)) {
    return (response as { value: T }).value;
  }
  if ("data" in (response as Record<string, unknown>)) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export function getApiErrorMessage(error: unknown, fallback = "حدث خطأ. يرجى المحاولة مرة أخرى."): string {
  if (error instanceof ApiRequestError) return error.message;
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined;
    if (body) {
      const message = [
        ...(body.errors ?? []),
        ...(body.validationErrors ?? []).map((item) => item.errorMessage),
      ].filter(Boolean).join("، ");
      if (message) return message;
    }
    if (error.response?.status === 401) return "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.";
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
