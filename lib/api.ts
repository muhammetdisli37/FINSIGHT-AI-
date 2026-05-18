/** Sabit API tabanı — port 8001 (Windows 8000 çakışmasından kaçınmak için). */
const API_BASE = "http://127.0.0.1:8001";

/** FastAPI / PostgREST gövdesinden okunabilir tek satır mesaj üretir. */
export function formatApiErrorMessage(status: number, bodyText: string): string {
  const raw = bodyText.trim();
  if (!raw) return `API hatası (${status})`;
  try {
    const j = JSON.parse(raw) as { detail?: unknown; message?: string };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) {
      const parts = j.detail.map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: string }).msg);
        }
        return typeof item === "string" ? item : JSON.stringify(item);
      });
      if (parts.length) return parts.join(" · ");
    }
    if (typeof j.message === "string" && j.message) return j.message;
  } catch {
    /* JSON değil */
  }
  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(formatApiErrorMessage(res.status, text));
  }
  return (await res.json()) as T;
}
