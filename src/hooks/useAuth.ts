import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AuthAPI, isMockMode } from "@/api";
import { MOCK_CREDENTIALS, MOCK_PHARMACIST } from "@/mock/auth";
import type { LoginRequest, LoginResponse } from "@/types";

function saveSession(response: LoginResponse) {
  localStorage.setItem("accessToken", response.accessToken);
  localStorage.setItem("refreshToken", response.refreshToken);
  localStorage.setItem("user", JSON.stringify(response.user));
}

function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (payload: LoginRequest): Promise<LoginResponse> => {
      if (isMockMode) {
        const key = `${payload.email}:${payload.password}`;
        const match = MOCK_CREDENTIALS[key] ?? MOCK_PHARMACIST;
        return match;
      }
      return AuthAPI.login(payload);
    },
    onSuccess: (data) => {
      saveSession(data);
      if (data.user.role === "admin") {
        navigate({ to: "/pharmacies" });
      } else {
        navigate({ to: "/pharmacy" });
      }
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (!isMockMode) {
        await AuthAPI.logout();
      }
    },
    onSettled: () => {
      clearSession();
      navigate({ to: "/login" });
    },
  });
}

export function useCurrentUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginResponse["user"];
  } catch {
    return null;
  }
}
