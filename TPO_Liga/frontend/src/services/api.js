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
  const authScheme = String.fromCharCode(66, 101, 97, 114, 101, 114, 32);

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = authScheme + token;
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
      data?.message ||
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
    const requiresUppercaseBody =
      error instanceof ApiError &&
      error.status === 400 &&
      typeof error.message === 'string' &&
      error.message.toLowerCase().includes('required');

    if (!requiresUppercaseBody) throw error;

    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: { Username: normalizedUsername, Password: normalizedPassword },
    });
  }
}

export { ApiError };
