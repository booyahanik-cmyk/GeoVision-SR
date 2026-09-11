/**
 * GeoVision-SR API Bridge
 * Directs all API communication through the centralized Axios client.
 * Preserves backwards compatibility for existing imports across the application.
 */

import api, {
  ApiError,
  getToken,
  setToken,
  removeToken,
  TOKEN_STORAGE_KEY,
} from '../api/axios';
import { AxiosRequestConfig } from 'axios';

export {
  api,
  ApiError,
  getToken,
  setToken,
  removeToken,
  TOKEN_STORAGE_KEY,
};

/**
 * Backwards-compatible apiFetch wrapper delegating to central Axios instance
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const config: AxiosRequestConfig = {
    url: endpoint,
    method: method as AxiosRequestConfig['method'],
    headers: options.headers as Record<string, string>,
  };

  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        config.data = JSON.parse(options.body);
      } catch {
        config.data = options.body;
      }
    } else {
      config.data = options.body;
    }
  }

  const response = await api.request<T>(config);
  return response.data;
}
