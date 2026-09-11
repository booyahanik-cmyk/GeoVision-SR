import api from './axios';
import { ImageryResponseDto } from '../types';

/**
 * Imagery feature API service for satellite imagery operations
 */
export const imageryApi = {
  /**
   * Upload satellite imagery file (GeoTIFF, TIFF, JP2, PNG, JPEG, ZIP)
   * Automatically uses FormData and lets browser set multipart boundary
   * @param file File object from input or drag-and-drop
   * @param onUploadProgress Optional callback to track upload percentage
   * @param signal Optional AbortSignal for request cancellation
   * @returns ImageryResponseDto
   */
  async uploadImagery(
    file: File,
    onUploadProgress?: (progressEventProgress: number) => void,
    signal?: AbortSignal
  ): Promise<ImageryResponseDto> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ImageryResponseDto>('/api/v1/imagery/upload', formData, {
      signal,
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Retrieve all uploaded satellite imagery records sorted by upload time
   * @param signal Optional AbortSignal for request cancellation
   * @returns Array of ImageryResponseDto
   */
  async getAllImagery(signal?: AbortSignal): Promise<ImageryResponseDto[]> {
    const response = await api.get<ImageryResponseDto[]>('/api/v1/imagery', { signal });
    return response.data;
  },

  /**
   * Fetch single imagery metadata by ID
   * @param id Imagery primary key ID
   * @param signal Optional AbortSignal for request cancellation
   * @returns ImageryResponseDto
   */
  async getImageryById(id: number, signal?: AbortSignal): Promise<ImageryResponseDto> {
    const response = await api.get<ImageryResponseDto>(`/api/v1/imagery/${id}`, { signal });
    return response.data;
  },

  /**
   * Execute Image Enhancement Pipeline on uploaded raster
   * @param id Imagery primary key ID
   * @param signal Optional AbortSignal for request cancellation
   * @returns ImageryResponseDto with enhancedFilePath and enhancementMetadata
   */
  async enhanceImagery(id: number, signal?: AbortSignal): Promise<ImageryResponseDto> {
    const response = await api.post<ImageryResponseDto>(`/api/v1/imagery/${id}/enhance`, null, { signal });
    return response.data;
  },
};
