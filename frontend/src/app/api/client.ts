import createClient from 'openapi-fetch';
import type { paths } from './schema';

const getAccessToken = () => localStorage.getItem('kitchenflow_access_token');

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '/api';
  }

  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '/api';
  }

  return '/awe/api';
};

const authFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  if (input instanceof Request) {
    input.headers.forEach((value, key) => {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    });
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}) as typeof fetch;

export const apiClient = createClient<paths>({
  baseUrl: getApiBaseUrl(),
  fetch: authFetch,
  pathSerializer: (path) => path.replace(/^(\/(?:awe\/)?api)\/api\//, '$1/'),
});
