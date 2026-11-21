const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Small fetch wrapper for the BrainCache FastAPI backend.
 * Pass the current access token explicitly; secure token storage is added
 * with the authentication milestone rather than storing credentials here.
 */
export async function apiRequest(path, { token, method = 'GET', body, headers = {} } = {}) {
  const requestHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(
      'Unable to reach BrainCache. Check the API address and make sure the backend is running.',
      0,
      error
    );
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null
      ? payload.detail || payload.message || 'The request could not be completed.'
      : payload || 'The request could not be completed.';
    throw new ApiError(String(message), response.status, payload);
  }

  return payload;
}

export const apiConfig = { baseUrl: API_BASE_URL };