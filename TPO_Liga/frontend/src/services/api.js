const TOKEN_KEY = 'authToken';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = 'Bearer '.concat(token);
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!response.ok) {
    const message =
      data?.message || data?.error ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function login(username, password) {
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();

  try {
    return await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { username: normalizedUsername, password: normalizedPassword },
    });
  } catch (error) {
    const backendMessage =
      error instanceof ApiError && typeof error.data?.message === 'string' ? error.data.message : '';
    const requiresUppercaseBody =
      error instanceof ApiError &&
      error.status === 400 &&
      normalizedUsername.length > 0 &&
      normalizedPassword.length > 0 &&
      backendMessage.toLowerCase().includes('username') &&
      backendMessage.toLowerCase().includes('password') &&
      backendMessage.toLowerCase().includes('required');

    if (!requiresUppercaseBody) throw error;

    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: { Username: normalizedUsername, Password: normalizedPassword },
    });
  }
}

export { ApiError };
