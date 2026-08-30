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

export const resolveMediaUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/uploads') || url.startsWith('/')) {
    return apiUrl(url);
  }
  return url;
};

// --- Sesión por cookies httpOnly (BLK-7) ---
// El JWT ya no vive en localStorage. Toda llamada autenticada usa `credentials: "include"`
// y, ante un 401, intenta un refresh silencioso (cookie `refreshToken`) una sola vez.

let refreshInFlight: Promise<boolean> | null = null;

const runRefresh = async (): Promise<boolean> => {
  try {
    const res = await fetch(apiUrl('/api/auth/refresh'), { method: 'POST', credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
};

const redirectToLogin = (): void => {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem('user'); } catch { /* noop */ }
  const { pathname } = window.location;
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    window.location.href = '/admin/login';
  }
};

export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };
  const url = /^https?:\/\//.test(path) ? path : apiUrl(path);
  const init: RequestInit = { ...options, headers, credentials: 'include' };

  let res = await fetch(url, init);
  if (res.status !== 401 || path.includes('/api/auth/')) return res;

  if (!refreshInFlight) {
    refreshInFlight = runRefresh().finally(() => { refreshInFlight = null; });
  }
  const ok = await refreshInFlight;
  if (!ok) {
    redirectToLogin();
    return res;
  }
  res = await fetch(url, init);
  if (res.status === 401) redirectToLogin();
  return res;
};

export const fetcher = async <T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const res = await apiFetch(url, options);
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
