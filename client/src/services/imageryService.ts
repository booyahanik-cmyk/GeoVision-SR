/**
 * GeoVision-SR Imagery Service
 * Delegates to centralized Axios imageryApi
 */

import { imageryApi } from '../api/imageryApi';
import { ImageryResponseDto } from '../types';

export const imageryService = {
  /**
   * Upload satellite imagery file (GeoTIFF, TIFF, JP2, PNG, JPEG, ZIP)
   * @param file File object from input or dropzone
   * @param onProgress Optional progress callback (0-100)
   * @returns ImageryResponseDto
   */
  uploadImagery(file: File, onProgress?: (percent: number) => void): Promise<ImageryResponseDto> {
    return imageryApi.uploadImagery(file, onProgress);
  },

  /**
   * Retrieve all uploaded satellite imagery records sorted by upload time
   * @returns Array of ImageryResponseDto
   */
  getAllImagery(signal?: AbortSignal): Promise<ImageryResponseDto[]> {
    return imageryApi.getAllImagery(signal);
  },

  /**
   * Fetch single imagery metadata by ID
   * @param id Imagery primary key ID
   * @returns ImageryResponseDto
   */
  getImageryById(id: number, signal?: AbortSignal): Promise<ImageryResponseDto> {
    return imageryApi.getImageryById(id, signal);
  },

  /**
   * Execute Image Enhancement Pipeline
   */
  enhanceImagery(id: number, signal?: AbortSignal): Promise<ImageryResponseDto> {
    return imageryApi.enhanceImagery(id, signal);
  },
};
