import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AuthAPI, isMockMode } from "@/api";
import { MOCK_CREDENTIALS } from "@/mock/auth";
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
        const key = `${payload.email.trim()}:${payload.password}`;
        const match = MOCK_CREDENTIALS[key];

        // Never accept arbitrary credentials in mock mode.
        if (!match) {
          throw new Error("Invalid email or password");
        }

        return match;
      }

      // Production authentication is handled by the backend.
      return AuthAPI.login(payload);
    },

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

  if (!raw) {
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
