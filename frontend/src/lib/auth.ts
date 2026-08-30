import { UserData } from "@/types";
import { apiUrl } from "@/lib/api";

// BLK-7: la sesión vive en cookies httpOnly. En localStorage solo queda el perfil
// (nombre / rol / email) para pintar la UI; nada sensible ni utilizable para auth.

/** @deprecated El token ya no se envía por header. Las llamadas usan cookies vía apiFetch. */
export const getAuthHeaders = (): Record<string, string> => ({});

export const getStoredUser = (): UserData | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return (parsed.user ?? parsed) as UserData;
  } catch {
    return null;
  }
};

export const saveAuth = (user: UserData): void => {
  localStorage.setItem("user", JSON.stringify({ user }));
};

export const clearAuth = (): void => {
  try {
    fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" }).catch(() => {});
  } catch {
    /* noop */
  }
  localStorage.removeItem("user");
  localStorage.removeItem("ph_role");
};
