import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AuthAPI } from "@/api";
import type { LoginRequest } from "@/types";
import type { LoginResult } from "@/api/contracts";

function saveSession(response: LoginResult) {
  const isAdmin = response.roles.some((role) => role === "SuperAdmin" || role === "Admin");
  localStorage.setItem("token", response.token);
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: response.userId,
      name: response.fullName || response.userName,
      email: response.email,
      role: isAdmin ? "admin" : "pharmacist",
      roles: response.roles,
    }),
  );
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function useLogin() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (payload: LoginRequest): Promise<LoginResult> => {
    setIsPending(true);
    try {
      const data = await AuthAPI.login(payload);
      saveSession(data);
      if (data.roles.some((role) => role === "SuperAdmin" || role === "Admin")) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/pharmacy" });
      }
      return data;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useLogout() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async () => {
    setIsPending(true);
    try {
      clearSession();
      navigate({ to: "/login" });
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "pharmacist";
  roles?: string[];
};

/** Reads the session saved at login; null when logged out or on the server. */
export function readStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  if (!localStorage.getItem("token")) return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function useCurrentUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      id: string;
      name: string;
      email: string;
      role: "admin" | "pharmacist";
      roles?: string[];
    };
  } catch {
    return null;
  }
}
