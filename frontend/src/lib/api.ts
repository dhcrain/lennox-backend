import { getToken } from "./token";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...init, headers });

  if (!res.ok) {
    let code = "unknown_error";
    let message = res.statusText || `request failed with status ${res.status}`;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 202 || res.status === 204) {
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  return res.json() as Promise<T>;
}

export const apiGet = <T,>(path: string) => request<T>(path);
export const apiPost = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
