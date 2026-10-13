const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint.replace(/^\/+/, "")}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${await response.text()}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
