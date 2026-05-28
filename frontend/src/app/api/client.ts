import createClient from 'openapi-fetch';
import type { paths } from './schema';

const getAccessToken = () => localStorage.getItem('kitchenflow_access_token');

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
  baseUrl: '/api',
  fetch: authFetch,
});
