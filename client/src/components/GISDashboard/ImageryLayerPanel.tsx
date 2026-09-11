import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  RotateCw, 
  UploadCloud, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Wand2, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sliders,
  ChevronRight,
  HardDrive,
  Compass,
  FileCode,
  ArrowLeftRight
} from 'lucide-react';
import { ImageryResponseDto, ImageryStatus } from '../../types';
import { imageryService } from '../../services/imageryService';
import { ApiError } from '../../services/api';

export interface ImageryLayerPanelProps {
  imageryList: ImageryResponseDto[];
  isLoading: boolean;
  selectedImagery: ImageryResponseDto | null;
  onSelectImagery: (imagery: ImageryResponseDto) => void;
  onOpenOnMap: (imagery: ImageryResponseDto) => void;
  onOpenComparison?: (imagery: ImageryResponseDto) => void;
  onRefreshList: () => Promise<void>;
  showBbox: boolean;
  onToggleBbox: () => void;
  onOpenUploadModal: () => void;
  className?: string;
}

export const ImageryLayerPanel: React.FC<ImageryLayerPanelProps> = ({
  imageryList,
  isLoading,
  selectedImagery,
  onSelectImagery,
  onOpenOnMap,
  onOpenComparison,
  onRefreshList,
  showBbox,
  onToggleBbox,
  onOpenUploadModal,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isEnhancingId, setIsEnhancingId] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredImagery = useMemo(() => {
    return imageryList.filter((img) => {
      const matchesSearch =
        img.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(img.id).includes(searchQuery) ||
        (img.epsg && img.epsg.includes(searchQuery));

      const matchesStatus = statusFilter === 'ALL' || img.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [imageryList, searchQuery, statusFilter]);

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleEnhance = async (e: React.MouseEvent, img: ImageryResponseDto) => {
    e.stopPropagation();
    if (isEnhancingId) return;

    setIsEnhancingId(img.id);
    setActionNotice(null);
    try {
      const updated = await imageryService.enhanceImagery(img.id);
      setActionNotice(`Enhanced #${updated.id} successfully!`);
      await onRefreshList();
      if (selectedImagery?.id === img.id) {
        onSelectImagery(updated);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setActionNotice(`Enhancement failed: ${err.message}`);
      } else {
        setActionNotice('Enhancement failed.');
      }
    } finally {
      setIsEnhancingId(null);
    }
  };

  const getStatusBadge = (status: ImageryStatus) => {
    switch (status) {
      case 'UPLOADED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
            UPLOADED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300 animate-pulse flex items-center gap-1">
            <RotateCw className="w-2.5 h-2.5 animate-spin" />
            PROCESSING
          </span>
        );
      case 'PROCESSED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            PROCESSED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className={`w-80 sm:w-88 flex flex-col h-full bg-[#070C1A]/95 backdrop-blur-xl border-r border-cyan-500/15 select-none ${className}`}>
      {/* Panel Header */}
      <div className="p-4 border-b border-cyan-500/15 flex items-center justify-between shrink-0 bg-gradient-to-r from-cyan-950/30 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase font-sans">
              Imagery Repository
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              {imageryList.length} Rasters Ingested
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRefreshList()}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
            title="Refresh Ingested Imagery"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={onOpenUploadModal}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.15)] cursor-pointer"
            title="Upload new satellite raster"
          >
            <UploadCloud className="w-3 h-3" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Global Layer Controls Bar */}
      <div className="px-4 py-2 bg-black/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bounding Box Overlay</span>
        </div>
        <button
          onClick={onToggleBbox}
          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
            showBbox
              ? 'bg-cyan-950/70 border border-cyan-400/40 text-cyan-300'
              : 'bg-slate-900 border border-slate-700 text-slate-500'
          }`}
        >
          {showBbox ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3" />}
          <span>{showBbox ? 'VISIBLE' : 'HIDDEN'}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 border-b border-slate-800/80 space-y-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search raster, ID, EPSG..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050914] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
          {(['ALL', 'UPLOADED', 'PROCESSING', 'PROCESSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2 py-0.5 rounded-md font-mono transition-all shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Action Notification Message */}
      {actionNotice && (
        <div className="px-3 py-1.5 bg-cyan-950/50 border-b border-cyan-500/30 text-[10px] text-cyan-300 flex items-center justify-between animate-in fade-in">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Imagery Cards Scrollable List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2.5 custom-scrollbar">
        {isLoading && imageryList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2 text-xs">
            <RotateCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Loading Ingested Rasters...</span>
          </div>
        ) : filteredImagery.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500 space-y-3">
            <FileCode className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No satellite rasters found.</p>
            <button
              onClick={onOpenUploadModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold btn-glow-cyan text-slate-950 mx-auto block"
            >
              Ingest First Raster
            </button>
          </div>
        ) : (
          filteredImagery.map((img) => {
            const isSelected = selectedImagery?.id === img.id;
            return (
              <div
                key={img.id}
                onClick={() => onSelectImagery(img)}
                className={`group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900/90 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-[#080E1E]/80 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/60'
                }`}
              >
                {/* Specular Selected Accent */}
                {isSelected && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500" />
                )}

                {/* Card Top Row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[10px] font-mono font-bold text-slate-400">#{img.id}</span>
                    <span className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {img.filename}
                    </span>
                  </div>
                  <div>{getStatusBadge(img.status)}</div>
                </div>

                {/* Metadata Badges */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400 bg-black/30 p-2 rounded-lg border border-white/5 mb-2">
                  <div>
                    <span className="text-slate-500 block text-[9px]">DIMENSIONS</span>
                    <span className="text-slate-200">
                      {img.width && img.height ? `${img.width}×${img.height} px` : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">PROJECTION</span>
                    <span className="text-amber-300">
                      {img.epsg ? `EPSG:${img.epsg}` : 'WGS84'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">BANDS</span>
                    <span className="text-cyan-300">{img.bands || 1} Bands</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">SIZE</span>
                    <span className="text-slate-200">{formatFileSize(img.fileSize)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenOnMap(img);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all flex items-center gap-1 cursor-pointer"
                    title="Zoom and fly to this raster on the Leaflet map"
                  >
                    <Eye className="w-3 h-3 text-cyan-400" />
                    <span>Open on Map</span>
                  </button>

                  {img.status === 'UPLOADED' && (
                    <button
                      type="button"
                      disabled={isEnhancingId === img.id}
                      onClick={(e) => handleEnhance(e, img)}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/30 hover:bg-blue-900/60 transition-all flex items-center gap-1 cursor-pointer"
                      title="Run Phase 4 OpenCV Enhancement"
                    >
                      {isEnhancingId === img.id ? (
                        <RotateCw className="w-3 h-3 animate-spin text-amber-300" />
                      ) : (
                        <Wand2 className="w-3 h-3 text-cyan-400" />
                      )}
                      <span>Enhance</span>
                    </button>
                  )}

                  {img.status === 'PROCESSED' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenComparison) {
                          onOpenComparison(img);
                        }
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                      title="Open Before vs After Comparison Slider"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-emerald-400" />
                      <span>Compare</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Imagery Quick Telemetry Footer */}
      {selectedImagery && (
        <div className="p-3 bg-[#050811] border-t border-cyan-500/20 text-xs shrink-0">
          <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">
            Active Selection Telemetry
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-white font-bold truncate max-w-[170px]">
              {selectedImagery.filename}
            </span>
            <button
              onClick={() => onOpenOnMap(selectedImagery)}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[10px]"
            >
              <span>Fly to Extent</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
