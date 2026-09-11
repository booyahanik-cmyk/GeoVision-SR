import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  RotateCw, 
  CheckCircle2, 
  X, 
  FileCode, 
  HardDrive,
  Sparkles,
  Wand2,
  Sliders
} from 'lucide-react';
import { imageryService } from '../../services/imageryService';
import { ImageryResponseDto } from '../../types';
import { ApiError } from '../../services/api';

interface ImageryUploadCardProps {
  onUploadSuccess?: (imagery: ImageryResponseDto) => void;
  className?: string;
}

export const ImageryUploadCard: React.FC<ImageryUploadCardProps> = ({
  onUploadSuccess,
  className = '',
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ImageryResponseDto | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementNotice, setEnhancementNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
  const ALLOWED_EXTENSIONS = ['tif', 'tiff', 'jp2', 'zip'];

  const handleEnhanceImagery = async () => {
    if (!successData || isEnhancing) return;
    setIsEnhancing(true);
    setErrorMessage(null);
    setEnhancementNotice(null);
    try {
      const updated = await imageryService.enhanceImagery(successData.id);
      setSuccessData(updated);
      setEnhancementNotice('4-Stage OpenCV enhancement pipeline complete (Normalization -> CLAHE -> Bilateral Filter -> Unsharp Mask).');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Enhancement pipeline failed.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to execute image enhancement pipeline.');
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    setSuccessData(null);

    // Validate size limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`Selected file (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum upload limit of 100MB.`);
      setSelectedFile(null);
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Unsupported format '.${ext || 'unknown'}'. Supported formats are: .tif, .tiff, .jp2, .zip`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      // Connect real upload progress through Axios client
      const result = await imageryService.uploadImagery(selectedFile, (percent) => {
        setUploadProgress(percent);
      });

      setUploadProgress(100);
      setSuccessData(result);
      setSelectedFile(null);

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Failed to upload satellite imagery.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred during imagery upload.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`glass-panel-elevated rounded-2xl p-6 border border-cyan-500/25 relative overflow-hidden text-slate-100 ${className}`}>
      {/* Specular Edge Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Satellite Imagery Ingest</h3>
            <p className="text-[11px] text-slate-400">GeoTIFF, Sentinel-2 L2A, JP2, or raw ortho tile</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-[10px] font-mono text-cyan-300">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Max 100MB</span>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer relative group ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_24px_rgba(6,182,212,0.3)]'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-950/15'
            : 'border-cyan-500/20 bg-[#070C1A]/70 hover:border-cyan-400/50 hover:bg-cyan-950/20'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="imagery-file-input"
          accept=".tif,.tiff,.jp2,.zip"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.2)] transition-transform duration-200 group-hover:scale-105">
            {selectedFile ? (
              <FileCheck className="w-7 h-7 text-emerald-400" />
            ) : (
              <UploadCloud className="w-7 h-7 text-cyan-400" />
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-200">
              {selectedFile ? (
                <span className="text-emerald-300 font-mono">{selectedFile.name}</span>
              ) : (
                <>
                  <span className="text-cyan-400 hover:underline">Choose a file</span> or drag & drop satellite tile
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supported formats: .tif, .tiff, .jp2, .zip
            </p>
          </div>
        </div>
      </div>

      {/* Selected File Details Pill */}
      {selectedFile && !isUploading && (
        <div className="mt-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 truncate">
            <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="truncate">
              <div className="font-mono text-slate-200 truncate">{selectedFile.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Size: {formatFileSize(selectedFile.size)} • Type: {selectedFile.type || 'satellite/geotiff'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetSelection();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Remove selected file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="mt-4 space-y-2 animate-in fade-in duration-200">
          <div className="flex justify-between text-[11px] font-mono text-cyan-300">
            <span className="flex items-center gap-1.5">
              <RotateCw className="w-3 h-3 animate-spin text-cyan-400" />
              Transferring imagery payload to server...
            </span>
            <span>{uploadProgress || 65}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              style={{ width: `${uploadProgress || 65}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Ingestion Error</span>
            <span className="text-rose-200/90 text-[11px]">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Enhancement Notification Banner */}
      {enhancementNotice && (
        <div className="mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{enhancementNotice}</span>
        </div>
      )}

      {/* Success Confirmation & Metadata Card */}
      {successData && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-slate-200 text-xs space-y-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Imagery Successfully Ingested</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
              successData.status === 'PROCESSED'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : successData.status === 'PROCESSING' || isEnhancing
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
            }`}>
              {isEnhancing ? 'PROCESSING' : successData.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 bg-black/40 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[9px]">RECORD ID</span>
              <span className="text-white font-bold">#{successData.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">PAYLOAD SIZE</span>
              <span>{formatFileSize(successData.fileSize)}</span>
            </div>
            <div className="col-span-2 truncate">
              <span className="text-slate-500 block text-[9px]">SOURCE FILE</span>
              <span className="text-cyan-300 truncate block">{successData.filename}</span>
            </div>
            {successData.width && successData.height && (
              <div>
                <span className="text-slate-500 block text-[9px]">RASTER DIMENSIONS</span>
                <span className="text-emerald-300">{successData.width} × {successData.height} px</span>
              </div>
            )}
            {successData.bands !== undefined && (
              <div>
                <span className="text-slate-500 block text-[9px]">SPECTRAL BANDS</span>
                <span className="text-cyan-300">{successData.bands} {successData.bands === 1 ? 'Band' : 'Bands'}</span>
              </div>
            )}
            {successData.epsg && (
              <div>
                <span className="text-slate-500 block text-[9px]">PROJECTION</span>
                <span className="text-amber-300">EPSG:{successData.epsg}</span>
              </div>
            )}
            {successData.bbox && (
              <div className="col-span-2 truncate">
                <span className="text-slate-500 block text-[9px]">BOUNDING BOX</span>
                <span className="text-slate-400 font-mono text-[9px] truncate block">{successData.bbox}</span>
              </div>
            )}

            {/* Enhanced File Path & Telemetry */}
            {successData.enhancedFilePath && (
              <div className="col-span-2 pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-emerald-400 block text-[9px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  ENHANCED OUTPUT RASTER
                </span>
                <span className="text-emerald-200 font-mono text-[9px] truncate block bg-emerald-950/30 p-1.5 rounded border border-emerald-500/20">
                  {successData.enhancedFilePath}
                </span>
              </div>
            )}

            <div className="col-span-2 text-[9px] text-slate-500 pt-1.5 border-t border-slate-800/80">
              Uploaded by {successData.uploadedBy} at {new Date(successData.uploadTime).toLocaleString()}
            </div>
          </div>

          {/* Phase 4 Image Enhancement Action Bar */}
          <div className="pt-1 flex items-center justify-between gap-3">
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Pipeline: Min-Max Normalization → CLAHE → Bilateral Denoise → Sharpening</span>
            </div>
            <button
              type="button"
              onClick={handleEnhanceImagery}
              disabled={isEnhancing}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isEnhancing
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 cursor-wait'
                  : successData.status === 'PROCESSED'
                  ? 'bg-slate-800/80 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/40 hover:border-emerald-500/50'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              }`}
            >
              {isEnhancing ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enhancing Raster...</span>
                </>
              ) : successData.status === 'PROCESSED' ? (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Re-run Enhancement</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Run Image Enhancement</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
        {selectedFile && (
          <button
            type="button"
            onClick={resetSelection}
            disabled={isUploading}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            !selectedFile || isUploading
              ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              : 'btn-glow-cyan text-slate-950 active:scale-98'
          }`}
        >
          {isUploading ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading to Repository...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Commit Ingest</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
