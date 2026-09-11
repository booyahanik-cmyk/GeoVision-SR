export type ScreenType = 
  | 'landing' 
  | 'gis-dashboard' 
  | 'ai-analysis' 
  | 'parcel-intelligence' 
  | 'decision-support'
  | 'imagery-catalog'
  | 'imagery-upload'
  | 'login'
  | 'register';

export interface AreaOfInterest {
  id: string;
  name: string;
  region: string;
  country: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  sentinelTileId: string;
  acquisitionDate: string;
  cloudCover: number; // percentage
  sunElevation: number; // degrees
  nativeGSD: number; // meters (10m for Sentinel-2 VIS)
  enhancedGSD: number; // meters (2.5m via SwinIR)
  description: string;
}

export type SpectralBand = 'true-color' | 'false-color-nir' | 'agriculture-swir' | 'ndvi';

export interface PreprocessingOptions {
  cloudRemoval: boolean;
  noiseReduction: boolean;
  imageClipping: boolean;
  bandSelection: boolean;
  resampling: boolean;
  imageNormalization: boolean;
}

export interface MapLayerState {
  satelliteBase: boolean;
  baseType: 'satellite' | 'dark' | 'topo';
  aoiBoundary: boolean;
  parcels: boolean;
  buildings: boolean;
  roads: boolean;
  landCover: boolean;
  confidenceMap: boolean;
  layerOpacity: {
    satellite: number;
    landCover: number;
    confidence: number;
    parcels: number;
  };
}

export interface DetectedBuilding {
  id: string;
  type: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  bounds: [[number, number], [number, number]];
  center: [number, number];
  areaM2: number;
  heightEstimateM: number;
  confidence: number;
  hasSolarRooftop: boolean;
  parcelId: string;
}

export interface DetectedRoad {
  id: string;
  type: 'arterial' | 'local' | 'unpaved' | 'service';
  coordinates: [number, number][];
  lengthM: number;
  widthM: number;
  confidence: number;
}

export interface LandCoverClass {
  id: string;
  name: string;
  color: string;
  hex: string;
  percentage: number;
  areaKm2: number;
}

export interface Parcel {
  id: string;
  cadastralCode: string;
  zoning: 'Agricultural' | 'Residential Low' | 'Commercial' | 'Industrial' | 'Protected Reserve';
  ownerType: 'Private Individual' | 'Corporate' | 'Municipal' | 'State Forest';
  areaHectares: number;
  perimeterM: number;
  coordinates: [number, number][];
  center: [number, number];
  buildingCount: number;
  builtCoveragePercent: number;
  ndviMean: number;
  lastAssessedDate: string;
  complianceStatus: 'Compliant' | 'Discrepancy Detected' | 'Under Audit';
  changeDetected: {
    hasChange: boolean;
    type?: 'New Construction' | 'Canopy Clearing' | 'Impervious Expansion';
    deltaM2?: number;
    yearComparison?: string;
  };
  confidenceScore: number;
}

export interface AIAnalysisSummary {
  swinir: {
    scaleFactor: string; // "4x"
    psnr: number; // dB e.g. 32.8
    ssim: number; // 0-1 e.g. 0.892
    inferenceLatencyMs: number;
    inputResolution: string; // 10m Sentinel-2
    outputResolution: string; // 2.5m Super-Resolved
  };
  yolov11: {
    modelVariant: string; // YOLOv11x-OBB
    totalBuildings: number;
    meanConfidence: number;
    mAP50: number;
    inferenceLatencyMs: number;
  };
  unet: {
    backbone: string; // ResNet-101 DeepLabV3+ / U-Net
    meanIoU: number;
    classesIdentified: number;
    dominantClass: string;
  };
  overallConfidence: number;
  uncalibratedVariance: number;
}

export type Role = 'USER' | 'ANALYST' | 'MODERATOR' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  type: string;
  expiresAt: string;
}

export interface UserRegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface UserRegisterResponseDto {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponseDto {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface ExceptionResponseDto {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface ValidationExceptionResponseDto {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: Record<string, string>;
}

export type ImageryStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface ImageryResponseDto {
  id: number;
  filename: string;
  originalFilePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadTime: string;
  status: ImageryStatus;
  width?: number;
  height?: number;
  bands?: number;
  crs?: string;
  epsg?: string;
  bbox?: string;
  enhancedFilePath?: string;
  enhancementMetadata?: string;
}

