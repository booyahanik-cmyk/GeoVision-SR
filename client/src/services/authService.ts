/**
 * GeoVision-SR Authentication Service
 * Interacts with Spring Boot backend endpoints:
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/register
 * - GET  /api/v1/users/me
 */

import { apiFetch } from './api';
import {
  LoginRequestDto,
  LoginResponseDto,
  UserRegisterRequestDto,
  UserRegisterResponseDto,
  UserProfileResponseDto,
} from '../types';

export const authService = {
  /**
   * Authenticate user with email and password
   * @param credentials LoginRequestDto
   * @returns LoginResponseDto containing JWT token
   */
  login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
    return apiFetch<LoginResponseDto>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Register a new user in the system
   * @param data UserRegisterRequestDto
   * @returns UserRegisterResponseDto
   */
  register(data: UserRegisterRequestDto): Promise<UserRegisterResponseDto> {
    return apiFetch<UserRegisterResponseDto>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Fetch currently authenticated user profile
   * Validates token validity with the backend
   * @returns UserProfileResponseDto
   */
  getCurrentUser(): Promise<UserProfileResponseDto> {
    return apiFetch<UserProfileResponseDto>('/api/v1/users/me', {
      method: 'GET',
    });
  },

  /**
   * Check access to role-specific dashboard
   */
  getUserDashboard(): Promise<{ status: string; message: string }> {
    return apiFetch<{ status: string; message: string }>('/api/v1/users/dashboard');
  },

  getAdminDashboard(): Promise<{ status: string; message: string; role: string }> {
    return apiFetch<{ status: string; message: string; role: string }>('/api/v1/admin/dashboard');
  },

  getAnalystDashboard(): Promise<{ status: string; message: string; role: string }> {
    return apiFetch<{ status: string; message: string; role: string }>('/api/v1/analyst/dashboard');
  },

  getModeratorQueue(): Promise<{ status: string; message: string; role: string; pendingReviewsCount: number }> {
    return apiFetch<{ status: string; message: string; role: string; pendingReviewsCount: number }>('/api/v1/moderator/queue');
  },
};
