const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
const TOKEN_KEY = 'fm_token';

export const session = {
  get: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => window.localStorage.setItem(TOKEN_KEY, token),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: { message?: string | string[]; issues?: { path: string; message: string }[] },
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? `Request failed (${status})`));
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = session.get();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
