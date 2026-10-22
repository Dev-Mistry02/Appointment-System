const apiBaseUrl = (import.meta.env.VITE_API_URI || '').replace(/\/+$/, '');

export function apiFetch(path, options = {}) {
  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
  });
}
