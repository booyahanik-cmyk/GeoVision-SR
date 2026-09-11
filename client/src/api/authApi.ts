import api from './axios';
import {
  LoginRequestDto,
  LoginResponseDto,
  UserRegisterRequestDto,
  UserRegisterResponseDto,
  UserProfileResponseDto,
} from '../types';

/**
 * Authentication and User Management API service
 */
export const authApi = {
  /**
   * Authenticate user with email and password
   * @param credentials LoginRequestDto
   * @returns LoginResponseDto containing JWT token
   */
  async login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
    const response = await api.post<LoginResponseDto>('/api/v1/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new user in the system
   * @param data UserRegisterRequestDto
   * @returns UserRegisterResponseDto
   */
  async register(data: UserRegisterRequestDto): Promise<UserRegisterResponseDto> {
    const response = await api.post<UserRegisterResponseDto>('/api/v1/auth/register', data);
    return response.data;
  },

  /**
   * Fetch currently authenticated user profile
   * Validates token validity with the backend
   * @returns UserProfileResponseDto
   */
  async getCurrentUser(): Promise<UserProfileResponseDto> {
    const response = await api.get<UserProfileResponseDto>('/api/v1/users/me');
    return response.data;
  },

  /**
   * Access role-specific user dashboard
   */
  async getUserDashboard(): Promise<{ status: string; message: string }> {
    const response = await api.get<{ status: string; message: string }>('/api/v1/users/dashboard');
    return response.data;
  },

  /**
   * Access role-specific admin dashboard
   */
  async getAdminDashboard(): Promise<{ status: string; message: string; role: string }> {
    const response = await api.get<{ status: string; message: string; role: string }>('/api/v1/admin/dashboard');
    return response.data;
  },

  /**
   * Access all users list (ADMIN role required)
   */
  async getAllUsers(): Promise<UserProfileResponseDto[]> {
    const response = await api.get<UserProfileResponseDto[]>('/api/v1/admin/users');
    return response.data;
  },

  /**
   * Access role-specific analyst dashboard
   */
  async getAnalystDashboard(): Promise<{ status: string; message: string; role: string }> {
    const response = await api.get<{ status: string; message: string; role: string }>('/api/v1/analyst/dashboard');
    return response.data;
  },

  /**
   * Access spatial reports (ANALYST or ADMIN role required)
   */
  async getSpatialReports(): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>('/api/v1/analyst/spatial-reports');
    return response.data;
  },

  /**
   * Access moderation queue (MODERATOR role required)
   */
  async getModeratorQueue(): Promise<{ status: string; message: string; role: string; pendingReviewsCount: number }> {
    const response = await api.get<{ status: string; message: string; role: string; pendingReviewsCount: number }>('/api/v1/moderator/queue');
    return response.data;
  },

  /**
   * Verify incident report (MODERATOR or ADMIN role required)
   */
  async verifyIncident(incidentId: number, decision = 'VERIFIED'): Promise<Record<string, unknown>> {
    const response = await api.post<Record<string, unknown>>(`/api/v1/moderator/incidents/${incidentId}/verify`, null, {
      params: { decision },
    });
    return response.data;
  },
};
