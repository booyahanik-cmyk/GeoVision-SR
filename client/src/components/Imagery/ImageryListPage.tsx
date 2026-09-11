import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  RotateCw, 
  UploadCloud, 
  Calendar, 
  User, 
  FileText, 
  HardDrive, 
  Layers, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  Sparkles,
  ArrowUpDown,
  Tag,
  Eye
} from 'lucide-react';
import { imageryService } from '../../services/imageryService';
import { ImageryResponseDto, ImageryStatus, ScreenType } from '../../types';
import { ApiError } from '../../services/api';

interface ImageryListPageProps {
  onNavigateToUpload: () => void;
  onNavigateToGIS?: (imageryId?: number) => void;
}

export const ImageryListPage: React.FC<ImageryListPageProps> = ({
  onNavigateToUpload,
  onNavigateToGIS,
}) => {
  const [imageryList, setImageryList] = useState<ImageryResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedImagery, setSelectedImagery] = useState<ImageryResponseDto | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  const fetchImageryList = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await imageryService.getAllImagery();
      setImageryList(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Failed to fetch imagery repository.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to backend imagery service.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImageryList();
  }, []);

  const handleInspect = async (id: number) => {
    setIsDetailLoading(true);
    try {
      const detail = await imageryService.getImageryById(id);
      setSelectedImagery(detail);
    } catch {
      // Fallback to locally cached item if network fails
      const fallback = imageryList.find((item) => item.id === id) || null;
      setSelectedImagery(fallback);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredImagery = useMemo(() => {
    return imageryList.filter((item) => {
      const matchesSearch = 
        item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.fileType && item.fileType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(item.id).includes(searchQuery);

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [imageryList, searchQuery, statusFilter]);

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getStatusBadge = (status: ImageryStatus) => {
    switch (status) {
      case 'UPLOADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            UPLOADED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            <RotateCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
            PROCESSING
          </span>
        );
      case 'PROCESSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            PROCESSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]">
            <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
            FAILED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 min-w-0 overflow-y-auto bg-[#060913] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 relative">
      {/* Background High-Tech Grid */}
      <div className="absolute inset-0 geo-grid-bg opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/15 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>SATELLITE DATA REPOSITORY • INVENTORY CATALOG</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              Imagery Domain Catalog
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                {imageryList.length} Ingested
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Browse, filter, and inspect registered Sentinel-2, Landsat, and UAV datasets stored in the GeoVision-SR domain repository.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchImageryList}
              disabled={isLoading}
              className="p-2 rounded-xl btn-glass border border-cyan-500/25 text-slate-300 hover:text-white hover:border-cyan-400/50 transition-all cursor-pointer"
              title="Refresh repository"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="px-4 py-2 rounded-xl text-xs font-bold btn-glow-cyan text-slate-950 flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_16px_rgba(6,182,212,0.3)] active:scale-98"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest Imagery</span>
            </button>
          </div>
        </div>

        {/* Search, Filter, and Metric Controls */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename, uploader, format..."
              className="w-full glass-input text-xs text-white rounded-xl pl-9 pr-8 py-2 bg-[#090E1D]/80 border border-cyan-500/20 focus:border-cyan-400/60 focus:outline-none placeholder:text-slate-500 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['ALL', 'UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error State Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={fetchImageryList}
              className="px-3 py-1 rounded-lg bg-rose-900/60 border border-rose-500/40 text-rose-200 hover:bg-rose-800 text-xs font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table / List Presentation */}
        {isLoading ? (
          <div className="glass-panel-elevated rounded-2xl p-16 text-center space-y-3 border border-cyan-500/20">
            <RotateCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Synchronizing with GeoVision satellite imagery database...</p>
          </div>
        ) : filteredImagery.length === 0 ? (
          <div className="glass-panel rounded-2xl p-16 text-center space-y-4 border border-cyan-500/20">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No Imagery Records Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No imagery records matched your search filters.'
                  : 'The satellite imagery domain repository is currently empty. Ingest your first GeoTIFF tile to begin.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="px-4 py-2 rounded-xl text-xs font-bold btn-glow-cyan text-slate-950 inline-flex items-center gap-2 cursor-pointer shadow-[0_0_16px_rgba(6,182,212,0.3)] active:scale-98"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest New Imagery Tile</span>
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-cyan-500/15 bg-slate-950/60 font-mono text-[11px] text-slate-400 select-none">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">FILENAME</th>
                    <th className="py-3 px-4 font-semibold">FILE TYPE</th>
                    <th className="py-3 px-4 font-semibold">SIZE</th>
                    <th className="py-3 px-4 font-semibold">UPLOADED BY</th>
                    <th className="py-3 px-4 font-semibold">UPLOAD DATE</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredImagery.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleInspect(item.id)}
                      className="hover:bg-cyan-950/20 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold">
                        #{item.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-[220px] truncate">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0" />
                          <span className="truncate">{item.filename}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {item.fileType || 'raw/tile'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {formatFileSize(item.fileSize)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] truncate max-w-[160px]">
                        <span className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{item.uploadedBy}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          {new Date(item.uploadTime).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspect(item.id);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-cyan-300 hover:text-white hover:bg-cyan-950/60 border border-cyan-500/20 hover:border-cyan-400/50 transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Detail Modal / Drawer */}
      {selectedImagery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel-elevated rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] text-slate-200 font-sans text-xs border border-cyan-500/30">
            {/* Header */}
            <div className="px-5 py-4 border-b border-cyan-500/15 flex items-center justify-between bg-gradient-to-r from-[#0B1324]/90 to-slate-900/90">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Imagery Metadata Inspection • #{selectedImagery.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedImagery(null)}
                aria-label="Close inspection dialog"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 font-mono">FILE IDENTIFIER</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5 truncate max-w-md">
                    {selectedImagery.filename}
                  </div>
                </div>
                <div>{getStatusBadge(selectedImagery.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">PAYLOAD SIZE</span>
                  <span className="text-cyan-300 font-bold text-sm">{formatFileSize(selectedImagery.fileSize)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">MIME / ENCODING</span>
                  <span className="text-slate-200 truncate block mt-0.5">{selectedImagery.fileType || 'image/tiff'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">OPERATOR</span>
                  <span className="text-slate-200 truncate block mt-0.5">{selectedImagery.uploadedBy}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">INGEST TIMESTAMP</span>
                  <span className="text-slate-200 text-[11px] block mt-0.5">
                    {new Date(selectedImagery.uploadTime).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Physical Storage Reference */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block">
                  PHYSICAL STORAGE PATH (SECURE DISK)
                </span>
                <p className="font-mono text-[11px] text-slate-300 break-all select-all bg-black/40 p-2 rounded border border-slate-800">
                  {selectedImagery.originalFilePath}
                </p>
              </div>

              {/* Phase 2 Pipeline Readout */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-cyan-300 font-mono">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Phase 2 Downstream: Ready for SwinIR 4x Super Resolution</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3.5 border-t border-cyan-500/15 flex items-center justify-between bg-slate-950/60">
              <button
                type="button"
                onClick={() => setSelectedImagery(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              {onNavigateToGIS && (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedImagery.id;
                    setSelectedImagery(null);
                    onNavigateToGIS(id);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold btn-glow-cyan text-slate-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open in GIS Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
