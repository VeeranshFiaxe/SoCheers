/* The admin panel's one way to talk to the server (worker/api). Every
   call carries the X-SC-Admin header the server requires on writes, and
   the session cookie rides along on its own (HttpOnly - script never
   sees it). */

export class ApiError extends Error {
  constructor(public status: number, message: string, public body: Record<string, unknown> = {}) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T = Record<string, unknown>>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "X-SC-Admin": "1", ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }
  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch { /* empty or not JSON */ }
  if (!res.ok) {
    if (res.status === 401 && path !== "/login" && path !== "/me") window.dispatchEvent(new Event("sc-admin-signed-out"));
    throw new ApiError(res.status, String(data.error || `Request failed (${res.status})`), data);
  }
  return data as T;
}

export type Upload = { id: string; kind: "image" | "font" | "pdf"; url: string; name: string; width?: number | null; height?: number | null; size: number };

export function imageSize(file: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ width: 0, height: 0 }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export async function upload(file: Blob, kind: Upload["kind"], name?: string): Promise<Upload> {
  const form = new FormData();
  form.set("file", file, (file as File).name || name || "file");
  form.set("kind", kind);
  if (name) form.set("name", name);
  if (kind === "image") {
    const { width, height } = await imageSize(file);
    form.set("width", String(width));
    form.set("height", String(height));
  }
  let res: Response;
  try {
    res = await fetch("/api/admin/uploads", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-SC-Admin": "1" },
      body: form,
    });
  } catch {
    throw new ApiError(0, "Upload failed - can't reach the server.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Upload failed.");
  return data as Upload;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
