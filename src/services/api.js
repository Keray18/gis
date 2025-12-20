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
  return request(`api/datasets?t=${Date.now()}`, { 
    headers: { 
      ...authHeaders(),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    } 
  });
}

export function getLayerFeatures(layerId, { q, limit } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (limit) params.set('limit', String(limit));
  const path = `api/layers/${layerId}/features${params.toString() ? `?${params.toString()}` : ''}`;
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
  return request(`api/layers/${layerId}/features`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify(feature)
  });
}

export function updateFeature(layerId, featureId, feature) {
  return request(`api/layers/${layerId}/features/${featureId}`, {
    method: 'PUT',
    headers: { ...authHeaders() },
    body: JSON.stringify(feature)
  });
}

export function deleteFeature(layerId, featureId) {
  return request(`api/layers/${layerId}/features/${featureId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
}

// Advanced Geometry Operations
export function bufferAnalysis(datasetId, features, distance, unit = 'kilometers') {
  return request(`api/datasets/${datasetId}/analysis/buffer`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ features, distance, unit })
  });
}

export function unionFeatures(datasetId, features) {
  return request(`api/datasets/${datasetId}/geometry/union`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ features })
  });
}

export function intersectFeatures(datasetId1, datasetId2, features1, features2) {
  return request('api/datasets/geometry/intersect', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ datasetId1, datasetId2, features1, features2 })
  });
}

export function clipFeatures(datasetId, boundaryDatasetId, features, boundary) {
  return request('api/datasets/geometry/clip', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ datasetId, boundaryDatasetId, features, boundary })
  });
}

export function dissolveFeatures(datasetId, features, attribute) {
  return request(`api/datasets/${datasetId}/geometry/dissolve`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ features, attribute })
  });
}

// Raster API functions
export function getRasterStatistics(datasetId) {
  return request(`api/raster/datasets/${datasetId}/statistics`, {
    headers: { ...authHeaders() }
  });
}

export function getRasterHistogram(datasetId, band = 0, bins = 256) {
  return request(`api/raster/datasets/${datasetId}/histogram?band=${band}&bins=${bins}`, {
    headers: { ...authHeaders() }
  });
}

export function getRasterMetadata(datasetId) {
  return request(`api/raster/datasets/${datasetId}/metadata`, {
    headers: { ...authHeaders() }
  });
}

export function getColorRamps() {
  return request('api/raster/color-ramps', {
    headers: { ...authHeaders() }
  });
}

export function generateColorRamp(colorRamp, steps = 256) {
  return request('api/raster/color-ramps', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ colorRamp, steps })
  });
}

export function getStretchTypes() {
  return request('api/raster/stretch-types', {
    headers: { ...authHeaders() }
  });
}

export function updateRasterStyling(layerId, rasterStyle) {
  return request(`api/raster/layers/${layerId}/styling`, {
    method: 'PUT',
    headers: { ...authHeaders() },
    body: JSON.stringify({ raster: rasterStyle })
  });
}

export function getRasterTileUrl(datasetId, z, x, y, options = {}) {
  const token = localStorage.getItem('authToken');
  
  // Create a style hash for consistent caching (same style = same hash)
  const styleString = `${options.colorRamp || 'viridis'}-${options.stretchType || 'linear'}-${options.opacity || 1.0}-${options.bands?.join(',') || '0,1,2'}-${options.minValue || ''}-${options.maxValue || ''}-${options.blendingMode || 'normal'}`;
  const styleHash = styleString.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const params = new URLSearchParams({
    colorRamp: options.colorRamp || 'viridis',
    stretchType: options.stretchType || 'linear',
    opacity: options.opacity || 1.0,
    bands: options.bands ? options.bands.join(',') : '0,1,2',
    ...(options.minValue && { minValue: options.minValue }),
    ...(options.maxValue && { maxValue: options.maxValue }),
    blendingMode: options.blendingMode || 'normal',
    _v: Math.abs(styleHash).toString(36), // Style version hash for cache-busting when style changes
    ...(token && { token: token }) // Add token as query parameter
  });
  
  const url = `${API_BASE}/api/raster/datasets/${datasetId}/tiles/${z}/${x}/${y}?${params}`;
  console.log('Generated raster tile URL:', url);
  return url;
}

// Advanced Query API functions

// Get dataset field information for query builder
export function getDatasetFields(datasetId) {
  return request(`api/datasets/${datasetId}/fields`, {
    headers: { ...authHeaders() }
  });
}

// Advanced attribute filter with multi-criteria
export function advancedAttributeFilter(datasetId, criteria) {
  return request(`api/datasets/${datasetId}/query/advanced-attribute`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ criteria })
  });
}

// Spatial query with multiple criteria
export function spatialQuery(datasetId, spatialCriteria) {
  return request(`api/datasets/${datasetId}/query/spatial`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ spatialCriteria })
  });
}

// Combined query (spatial + attribute)
export function combinedQuery(datasetId, queryCriteria) {
  return request(`api/datasets/${datasetId}/query/combined`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ queryCriteria })
  });
}

// Terrain Analysis API functions
export function calculateSlope(datasetId, unit = 'degrees') {
  return request(`api/terrain/datasets/${datasetId}/slope`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ unit })
  });
}

export function calculateAspect(datasetId) {
  return request(`api/terrain/datasets/${datasetId}/aspect`, {
    method: 'POST',
    headers: { ...authHeaders() }
  });
}

export function generateHillshade(datasetId, azimuth = 315, altitude = 45) {
  return request(`api/terrain/datasets/${datasetId}/hillshade`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ azimuth, altitude })
  });
}

export function generateContours(datasetId, interval = 10) {
  return request(`api/terrain/datasets/${datasetId}/contours`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ interval })
  });
}

export function calculateWatershed(datasetId, pourPoint) {
  return request(`api/terrain/datasets/${datasetId}/watershed`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify({ pourPoint })
  });
}

export function getTerrainAnalyses(datasetId) {
  return request(`api/terrain/datasets/${datasetId}/analyses`, {
    headers: { ...authHeaders() }
  });
}

// Clipping API functions
export function saveClipping(clippingData) {
  return request('api/clippings', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: JSON.stringify(clippingData)
  });
}

export function listClippings(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.projectId) queryParams.append('projectId', params.projectId);
  if (params.sourceDatasetId) queryParams.append('sourceDatasetId', params.sourceDatasetId);
  if (params.boundaryDatasetId) queryParams.append('boundaryDatasetId', params.boundaryDatasetId);
  if (params.search) queryParams.append('search', params.search);
  
  const queryString = queryParams.toString();
  return request(`api/clippings${queryString ? `?${queryString}` : ''}`, {
    headers: { ...authHeaders() }
  });
}

export function getClipping(clippingId) {
  return request(`api/clippings/${clippingId}`, {
    headers: { ...authHeaders() }
  });
}

export function getClippingFeatures(clippingId, { limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (offset) params.append('offset', offset);
  // Add cache-busting parameter to prevent 304 responses
  params.append('_t', Date.now());
  
  const queryString = params.toString();
  return request(`api/clippings/${clippingId}/features?${queryString}`, {
    headers: { 
      ...authHeaders(),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
}

export function updateClipping(clippingId, updates) {
  return request(`api/clippings/${clippingId}`, {
    method: 'PUT',
    headers: { ...authHeaders() },
    body: JSON.stringify(updates)
  });
}

export function deleteClipping(clippingId) {
  return request(`api/clippings/${clippingId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
}

export function convertClippingToDataset(clippingId) {
  return request(`api/clippings/${clippingId}/convert-to-dataset`, {
    method: 'POST',
    headers: { ...authHeaders() }
  });
}

export { API_BASE };


