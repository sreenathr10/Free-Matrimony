export const DEFAULT_API_URL = 'http://localhost:4000/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: { message?: string | string[]; issues?: { path: string; message: string }[] },
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? `Request failed (${status})`));
  }

  /** The most useful message to show a person: the first validation issue, or the server's message. */
  get friendly() {
    return this.body.issues?.[0]?.message ?? this.message;
  }
}

export interface Session {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

export type ApiFn = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface Client {
  api: ApiFn;
  session: Session;
  baseUrl: string;
}

/**
 * Creates an API client. Each app keeps its own token key, so signing in to a staff portal
 * never signs you in or out of the member website on the same machine.
 */
export function createClient({ baseUrl = DEFAULT_API_URL, tokenKey }: { baseUrl?: string; tokenKey: string }): Client {
  const session: Session = {
    get: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(tokenKey)),
    set: (token) => window.localStorage.setItem(tokenKey, token),
    clear: () => window.localStorage.removeItem(tokenKey),
  };

  const api: ApiFn = async <T>(path: string, init: RequestInit = {}) => {
    const token = session.get();
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body);
    return body as T;
  };

  return { api, session, baseUrl };
}

/** Uploads a file to a signed URL from the API (S3 in production, the API itself in development). */
export async function putToSignedUrl(upload: { url: string; headers: Record<string, string> }, file: Blob) {
  const res = await fetch(upload.url, { method: 'PUT', headers: upload.headers, body: file });
  if (!res.ok) throw new Error('Upload failed. Check your connection and try again.');
}
