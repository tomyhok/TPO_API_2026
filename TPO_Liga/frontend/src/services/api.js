const TOKEN_KEY = 'auth_token';

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * GET/POST/PUT/DELETE helper que:
 * - usa JSON
 * - agrega Authorization si auth=true y hay token
 * - tira error con mensaje si la API responde mal
 */
export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Intento leer JSON (si hay body)
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (typeof data === 'string' && data) ||
      `API error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}