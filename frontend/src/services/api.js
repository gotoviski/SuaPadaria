const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export async function apiFetch(path, { method = 'GET', body, headers, ...rest } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
    ...rest,
  });

  if (!response.ok) {
    const error = new Error(`Erro ${response.status} ao chamar ${path}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path, options) => apiFetch(path, options),
  post: (path, body, options) => apiFetch(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiFetch(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiFetch(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' }),
};
