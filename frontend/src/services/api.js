const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(message, status = 0, details = null) { super(message); this.name = 'ApiError'; this.status = status; this.details = details; }
}
export async function apiRequest(path, { token, method = 'GET', body, headers = {} } = {}) {
  const requestHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, { method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (error) { throw new ApiError('Unable to reach BrainCache. Check the API address and make sure the backend is running.', 0, error); }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null ? payload.detail || payload.message || 'The request could not be completed.' : payload || 'The request could not be completed.';
    throw new ApiError(String(message), response.status, payload);
  }
  return payload;
}
export const authApi = {
  register: (email, password) => apiRequest('/api/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => apiRequest('/api/auth/me', { token }),
};
export const notesApi = {
  list: (token, q = '') => apiRequest(`/api/notes?limit=100${q ? `&q=${encodeURIComponent(q)}` : ''}`, { token }),
  create: (token, data) => apiRequest('/api/notes', { token, method: 'POST', body: data }),
  update: (token, id, data) => apiRequest(`/api/notes/${id}`, { token, method: 'PATCH', body: data }),
  remove: (token, id) => apiRequest(`/api/notes/${id}`, { token, method: 'DELETE' }),
};
export const tasksApi = {
  list: (token) => apiRequest('/api/tasks?limit=100', { token }),
  create: (token, data) => apiRequest('/api/tasks', { token, method: 'POST', body: data }),
  update: (token, id, data) => apiRequest(`/api/tasks/${id}`, { token, method: 'PATCH', body: data }),
  setStatus: (token, id, status) => apiRequest(`/api/tasks/${id}/status`, { token, method: 'PATCH', body: { status } }),
  remove: (token, id) => apiRequest(`/api/tasks/${id}`, { token, method: 'DELETE' }),
};
export const dashboardApi = { summary: (token) => apiRequest('/api/dashboard/summary', { token }) };
export const apiConfig = { baseUrl: API_BASE_URL };