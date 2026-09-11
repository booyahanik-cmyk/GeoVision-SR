/**
 * GeoVision-SR Authentication Service
 * Delegates to centralized Axios authApi
 */

import { authApi } from '../api/authApi';
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
    return authApi.login(credentials);
  },

  /**
   * Register a new user in the system
   * @param data UserRegisterRequestDto
   * @returns UserRegisterResponseDto
   */
  register(data: UserRegisterRequestDto): Promise<UserRegisterResponseDto> {
    return authApi.register(data);
  },

  /**
   * Fetch currently authenticated user profile
   * Validates token validity with the backend
   * @returns UserProfileResponseDto
   */
  getCurrentUser(): Promise<UserProfileResponseDto> {
    return authApi.getCurrentUser();
  },

  /**
   * Check access to role-specific dashboard
   */
  getUserDashboard(): Promise<{ status: string; message: string }> {
    return authApi.getUserDashboard();
  },

  getAdminDashboard(): Promise<{ status: string; message: string; role: string }> {
    return authApi.getAdminDashboard();
  },

  getAllUsers(): Promise<UserProfileResponseDto[]> {
    return authApi.getAllUsers();
  },

  getAnalystDashboard(): Promise<{ status: string; message: string; role: string }> {
    return authApi.getAnalystDashboard();
  },

  getSpatialReports(): Promise<Record<string, unknown>> {
    return authApi.getSpatialReports();
  },

  getModeratorQueue(): Promise<{ status: string; message: string; role: string; pendingReviewsCount: number }> {
    return authApi.getModeratorQueue();
  },

  verifyIncident(incidentId: number, decision = 'VERIFIED'): Promise<Record<string, unknown>> {
    return authApi.verifyIncident(incidentId, decision);
  },
};
