export function getBackendBaseURL() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || '';
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function postJSON<T = any>(
  path: string,
  body: any,
  withAuth = false,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
): Promise<T> {
  const url = `${getBackendBaseURL()}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) Object.assign(headers, authHeaders());
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Erro ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function getJSON<T = any>(path: string, withAuth = false): Promise<T> {
  const url = `${getBackendBaseURL()}${path}`;
  const headers: Record<string, string> = {};
  if (withAuth) Object.assign(headers, authHeaders());
  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
  return res.json();
}
