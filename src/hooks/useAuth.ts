import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AuthAPI } from "@/api";
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
    mutationFn: (payload: LoginRequest): Promise<LoginResponse> => AuthAPI.login(payload),

    onSuccess: (data) => {
      // Do not save a session with an invalid role or missing token.
      if (data.user.role !== "admin" && data.user.role !== "pharmacist") {
        clearSession();
        return;
      }

      if (!data.accessToken) {
        clearSession();
        return;
      }

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
    mutationFn: () => AuthAPI.logout(),

    onSettled: () => {
      clearSession();
      navigate({ to: "/login" });
    },
  });
}

export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  const accessToken = localStorage.getItem("accessToken");

  if (!raw || !accessToken) {
    clearSession();
    return null;
  }

  try {
    const user = JSON.parse(raw);

    if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
      clearSession();
      return null;
    }

    return user as LoginResponse["user"];
  } catch {
    clearSession();
    return null;
  }
}
