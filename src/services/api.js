// Centralized API client for the application

// Read base URL ONLY from .env and normalize slashes
const RAW_BASE = process.env.REACT_APP_API_BASE;

if (!RAW_BASE) {
  throw new Error('REACT_APP_API_BASE is not defined. Set it in .env and restart the dev server.');
}

const API_BASE = String(RAW_BASE).replace(/\/+$/, '');

function buildUrl(path) {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path; // absolute URL
  const cleaned = String(path).replace(/^\/+/, '');
  return `${API_BASE}/${cleaned}`;
}

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const url = buildUrl(path);
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (isJson ? data?.message || data?.error : data) || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

// Auth helpers
export function saveToken(token) {
  try { localStorage.setItem('authToken', token); } catch (_) {}
}

export function getToken() {
  try { return localStorage.getItem('authToken'); } catch (_) { return null; }
}

export function clearToken() {
  try { localStorage.removeItem('authToken'); } catch (_) {}
}

// Auth endpoints
export function loginApi({ email, password }) {
  return request('api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function registerApi({ name, email, password }) {
  return request('api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
}

export { API_BASE };


