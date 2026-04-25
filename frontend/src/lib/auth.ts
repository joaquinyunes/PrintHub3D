import { apiUrl } from "./api";

export interface UserData {
  id?: string;
  name?: string;
  role: string;
  email?: string;
  tenantId?: string;
}

export const getAuthHeaders = () => {
  const stored = localStorage.getItem("user");
  if (!stored) return {};
  
  try {
    const parsed = JSON.parse(stored);
    return {
      "Authorization": `Bearer ${parsed.token}`
    };
  } catch {
    return {};
  }
};

export const getStoredUser = (): UserData | null => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    return parsed.user || null;
  } catch {
    return null;
  }
};

export const saveAuth = (token: string, user: UserData) => {
  localStorage.setItem("user", JSON.stringify({ token, user }));
};

export const clearAuth = () => {
  localStorage.removeItem("user");
};