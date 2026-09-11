/**
 * GeoVision-SR API Client
 * Lightweight, zero-dependency HTTP client using native fetch.
 * Handles JWT bearer injection, 401 interception, and structured Spring Boot error unwrapping.
 */

import { ExceptionResponseDto, ValidationExceptionResponseDto } from '../types';

export const TOKEN_STORAGE_KEY = 'geovision_auth_token';

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  raw?: ExceptionResponseDto | ValidationExceptionResponseDto | unknown;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
    raw?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.raw = raw;
  }
}

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

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure endpoint is normalized (uses Vite proxy /api)
  const url = endpoint.startsWith('http') ? endpoint : endpoint;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    throw new ApiError(
      'Network communication error. Please ensure the backend server is reachable.',
      0,
      undefined,
      err
    );
  }

  // Handle successful empty response (e.g., 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: any = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // 401 Unauthorized handling: Clear token and emit event
    if (response.status === 401) {
      removeToken();
      window.dispatchEvent(new CustomEvent('geovision:unauthorized'));
    }

    let errorMessage = 'An unexpected error occurred';
    let fieldErrors: Record<string, string> | undefined;

    if (data && typeof data === 'object') {
      if (data.fieldErrors && typeof data.fieldErrors === 'object') {
        fieldErrors = data.fieldErrors;
      }
      if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      }
    } else if (typeof data === 'string' && data.length > 0) {
      errorMessage = data;
    }

    throw new ApiError(errorMessage, response.status, fieldErrors, data);
  }

  return data as T;
}
