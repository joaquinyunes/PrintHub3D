const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const apiUrl = (path: string): string => {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
};

export const fetcher = async <T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const res = await fetch(apiUrl(url), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}`);
    }
    const data = await res.json();
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
};
