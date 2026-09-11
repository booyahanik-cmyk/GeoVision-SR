import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const TOKEN_STORAGE_KEY = 'geovision_auth_token';

/**
 * Standardized application API error.
 * Preserves HTTP status codes, structured backend validation errors, and server messages.
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string>;
  raw?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors?: Record<string, string>,
    raw?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.raw = raw;
  }
}

/**
 * Token management helpers
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (e) {
    console.error('Failed to save token to localStorage:', e);
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove token from localStorage:', e);
  }
}

/**
 * Centralized Axios instance configured for GeoVision-SR
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor
 * - Injects JWT Bearer token if present
 * - Handles multipart/form-data FormData boundary automatically
 * - Logs outgoing requests during development
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser/Axios set the Content-Type boundary for FormData automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    if (import.meta.env.DEV) {
      console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Centrally handles HTTP statuses (401, 403, 404, 422, 500)
 * - Detects true network connection failures vs server response errors
 * - Emits global unauthorized event on 401
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<any>) => {
    // 1. True Network or Timeout Failure (No HTTP response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
        const timeoutError = new ApiError(
          'Request timed out. The server took too long to respond.',
          0,
          'TIMEOUT',
          undefined,
          error
        );
        return Promise.reject(timeoutError);
      }

      const networkError = new ApiError(
        'Unable to connect to the server. Please check your connection and ensure backend service is running.',
        0,
        'NETWORK_ERROR',
        undefined,
        error
      );
      return Promise.reject(networkError);
    }

    // 2. Server responded with an HTTP error status code
    const { status, data } = error.response;
    let errorMessage = 'An unexpected server error occurred. Please try again.';
    let fieldErrors: Record<string, string> | undefined;

    // Unpack Spring Boot standard and custom exception structures
    if (data && typeof data === 'object') {
      if (data.fieldErrors && typeof data.fieldErrors === 'object') {
        fieldErrors = data.fieldErrors;
      }
      if (data.message && typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (data.error && typeof data.error === 'string') {
        errorMessage = data.error;
      }
    } else if (typeof data === 'string' && data.trim().length > 0) {
      errorMessage = data;
    }

    // Status-specific handling
    switch (status) {
      case 400:
      case 422:
        if (!errorMessage || errorMessage === 'An unexpected server error occurred. Please try again.') {
          errorMessage = 'Invalid request data. Please check the supplied information.';
        }
        break;

      case 401:
        removeToken();
        window.dispatchEvent(new CustomEvent('geovision:unauthorized'));
        if (!data?.message && !data?.error) {
          errorMessage = 'Authentication required or session expired. Please sign in.';
        }
        break;

      case 403:
        if (!data?.message && !data?.error) {
          errorMessage = 'Access denied: You do not have permission to access this resource.';
        }
        break;

      case 404:
        if (!data?.message && !data?.error) {
          errorMessage = 'The requested resource or endpoint was not found.';
        }
        break;

      case 413:
        errorMessage = 'File size exceeds maximum allowed upload limit (100MB).';
        break;

      case 429:
        errorMessage = 'Too many requests. Please slow down and try again shortly.';
        break;

      case 500:
      case 502:
      case 503:
        if (!data?.message) {
          errorMessage = 'Backend internal server error. Please try again later.';
        }
        break;

      default:
        break;
    }

    const apiError = new ApiError(
      errorMessage,
      status,
      error.code,
      fieldErrors,
      data
    );

    return Promise.reject(apiError);
  }
);

export default api;
