import { UserData } from "@/types";

export const getAuthHeaders = (): Record<string, string> => {
  const stored = localStorage.getItem("user");
  if (!stored) return {};
  
  try {
    const parsed = JSON.parse(stored);
    const token = parsed.token ?? parsed?.accessToken;
    return token ? { "Authorization": `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const getStoredUser = (): UserData | null => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    return (parsed.user ?? parsed) as UserData;
  } catch {
    return null;
  }
};

export const saveAuth = (token: string, user: UserData, refreshToken?: string): void => {
  const payload: Record<string, any> = { token, user };
  if (refreshToken) payload.refreshToken = refreshToken;
  localStorage.setItem("user", JSON.stringify(payload));
};

export const clearAuth = (): void => {
  localStorage.removeItem("user");
};
