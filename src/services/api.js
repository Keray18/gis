// Centralized API client for the application

// Read base URL from .env and normalize slashes; default to localhost:5000 for dev
const RAW_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const API_BASE = String(RAW_BASE).replace(/\/+$/, '');

function buildUrl(path) {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path; // absolute URL
  const cleaned = String(path).replace(/^\/+/, '');
  return `${API_BASE}/${cleaned}`;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
export async function loginApi({ email, password }) {
  const resp = await request('api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  // Normalize backend response { success, data: { user, token } }
  const token = resp?.token || resp?.data?.token;
  const user = resp?.user || resp?.data?.user;
  return { token, user, raw: resp };
}

export async function registerApi({ name, email, password }) {
  const resp = await request('api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  const token = resp?.token || resp?.data?.token;
  const user = resp?.user || resp?.data?.user;
  return { token, user, raw: resp };
}

// Dataset & Layer APIs
export async function uploadDataset(file) {
  const url = buildUrl('api/datasets/upload');
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form,
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

export function listDatasets() {
  return request('api/datasets', { headers: { ...authHeaders() } });
}

export function getLayerFeatures(layerId, { q, limit } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (limit) params.set('limit', String(limit));
  const path = `api/datasets/${layerId}/features${params.toString() ? `?${params.toString()}` : ''}`;
  return request(path, { headers: { ...authHeaders() } });
}

export function listLayers() {
  return request('api/layers', { headers: { ...authHeaders() } });
}

// Spatial queries
export function queryLayerAttribute(layerId, { field, regex }) {
  return request(`api/datasets/${layerId}/query/attribute`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ field, regex })
  });
}

export function queryLayerBuffer(layerId, { distance = 100 }) {
  return request(`api/datasets/${layerId}/query/buffer`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ distance })
  });
}

export function queryPointInPolygon(layerId, { point }) {
  return request(`api/datasets/${layerId}/query/point-in-polygon`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ point })
  });
}

// Feature CRUD
export function createFeature(layerId, feature) {
  return request(`api/datasets/${layerId}/features`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify(feature)
  });
}

export function updateFeature(layerId, featureId, feature) {
  return request(`api/datasets/${layerId}/features/${featureId}`, {
    method: 'PUT',
    headers: { ...authHeaders() },
    body: JSON.stringify(feature)
  });
}

export function deleteFeature(layerId, featureId) {
  return request(`api/datasets/${layerId}/features/${featureId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
}

export { API_BASE };


