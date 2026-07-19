import { authHeaders, getApiAccessToken } from "../lib/api-auth";
import { resolveApiBase } from "../lib/billing-api-base";

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = await resolveApiBase();
  const headers = await authHeaders(
    (init.headers as Record<string, string> | undefined) ?? {},
  );
  if (init.body instanceof FormData) {
    delete (headers as Record<string, string>)["Content-Type"];
  }
  return fetch(`${base}${path}`, { ...init, headers });
}

export async function hasAuthenticatedApiAccess(): Promise<boolean> {
  const token = await getApiAccessToken();
  return Boolean(token?.trim());
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await apiFetch(path, init);
  const raw = await res.text();
  let data: T & { error?: string } = {} as T & { error?: string };
  try {
    data = JSON.parse(raw) as T & { error?: string };
  } catch {
    if (!res.ok) {
      return { ok: false, status: res.status, error: "Request failed" };
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data.error ?? "Request failed",
    };
  }

  return { ok: true, data };
}
