import React, { useState } from 'react';
import ReactCompareImage from 'react-compare-image';
import { 
  Sparkles, 
  X, 
  Columns, 
  SplitSquareVertical, 
  Layers, 
  RotateCw, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Download,
  Info,
  CheckCircle2,
  Clock,
  ArrowLeftRight
} from 'lucide-react';

export interface BeforeAfterViewerProps {
  originalImage?: string;
  enhancedImage?: string;
  originalLabel?: string;
  enhancedLabel?: string;
  imageryTitle?: string;
  imageryId?: number;
  metadata?: {
    width?: number;
    height?: number;
    bands?: number;
    epsg?: string;
    processingTimeMs?: number;
    status?: string;
    pipeline?: string[];
  };
  initialSliderPosition?: number; // 0 - 100
  onClose?: () => void;
  className?: string;
  isModal?: boolean;
}

// High-fidelity fallback satellite imagery presets (Sentinel-2 True Color vs 4x Super-Resolution Enhanced)
const DEFAULT_ORIGINAL = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_ENHANCED = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=100&sat=1.3&con=1.25&sharp=20';

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({
  originalImage,
  enhancedImage,
  originalLabel = 'Original Raw Imagery',
  enhancedLabel = 'OpenCV Enhanced (CLAHE + Unsharp Mask)',
  imageryTitle = 'Satellite Raster Comparison',
  imageryId,
  metadata,
  initialSliderPosition = 50,
  onClose,
  className = '',
  isModal = false,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(initialSliderPosition);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'solo-toggle'>('slider');
  const [activeSolo, setActiveSolo] = useState<'original' | 'enhanced'>('enhanced');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showMetadataHud, setShowMetadataHud] = useState<boolean>(true);

  // Resolved image sources with resilient high-res satellite fallbacks
  const rawSrc = originalImage || DEFAULT_ORIGINAL;
  const enhSrc = enhancedImage || DEFAULT_ENHANCED;

  const content = (
    <div className={`flex flex-col h-full w-full bg-[#060A14] text-slate-100 select-none overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-[100]' : 'relative rounded-2xl border border-cyan-500/25 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]'
    } ${className}`}>
      {/* Specular Ambient Cyan Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {/* Header Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-cyan-500/15 flex items-center justify-between gap-3 bg-[#080E1E]/90 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                {imageryTitle}
              </h2>
              {imageryId && (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 shrink-0">
                  #{imageryId}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block truncate">
              Interactive 4-Stage Computer Vision vs Raw Sensor Ingest
            </p>
          </div>
        </div>

        {/* Center/Right Control Bar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center glass-panel rounded-xl p-1 text-xs border border-cyan-500/20">
            <button
              onClick={() => setViewMode('slider')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'slider'
                  ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Split Screen Drag Slider"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split Slider</span>
            </button>

            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'side-by-side'
                  ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-Side Dual View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Side-by-Side</span>
            </button>

            <button
              onClick={() => setViewMode('solo-toggle')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'solo-toggle'
                  ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Flip Comparison"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Toggle Flip</span>
            </button>
          </div>

          {/* Toggle HUD */}
          <button
            onClick={() => setShowMetadataHud((prev) => !prev)}
            className={`p-2 rounded-xl glass-panel transition-all cursor-pointer ${
              showMetadataHud ? 'text-cyan-300 border-cyan-500/40' : 'text-slate-400 border-slate-800'
            }`}
            title="Toggle Telemetry Overlay"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white border-cyan-500/20 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close Action (if inside modal or callback provided) */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white hover:bg-rose-950/50 hover:border-rose-500/40 border-slate-800 transition-all cursor-pointer"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Display Area */}
      <div className="flex-1 relative min-h-0 min-w-0 bg-black flex items-center justify-center overflow-hidden">
        {/* VIEW MODE 1: Split Screen Drag Slider (react-compare-image) */}
        {viewMode === 'slider' && (
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 max-w-5xl mx-auto">
            <div className="w-full max-h-full rounded-xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative">
              <ReactCompareImage
                leftImage={rawSrc}
                leftImageLabel={originalLabel}
                rightImage={enhSrc}
                rightImageLabel={enhancedLabel}
                sliderPositionPercentage={sliderPosition / 100}
                onSliderPositionChange={(pos) => setSliderPosition(Math.round(pos * 100))}
                sliderLineColor="#00f2ff"
                sliderLineWidth={3}
                handle={
                  <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(0,242,255,0.6)] cursor-ew-resize">
                    <ArrowLeftRight className="w-4 h-4 text-cyan-300" />
                  </div>
                }
              />
            </div>
          </div>
        )}

        {/* VIEW MODE 2: Side-by-Side Dual View */}
        {viewMode === 'side-by-side' && (
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-6 overflow-y-auto max-w-6xl mx-auto">
            {/* Left: Original */}
            <div className="flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-[#070C1A] shadow-lg">
              <div className="p-2.5 bg-black/60 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 font-mono">BEFORE: RAW SENSOR</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400">UNPROCESSED</span>
              </div>
              <div className="flex-1 flex items-center justify-center bg-black p-2">
                <img
                  src={rawSrc}
                  alt="Original Ingest"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Right: Enhanced */}
            <div className="flex flex-col rounded-xl overflow-hidden border border-emerald-500/40 bg-[#070C1A] shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="p-2.5 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  AFTER: OPENCV ENHANCED
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  CLAHE + SHARPENED
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center bg-black p-2">
                <img
                  src={enhSrc}
                  alt="OpenCV Enhanced"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: Solo Toggle Flip */}
        {viewMode === 'solo-toggle' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="relative max-w-4xl w-full max-h-[70vh] rounded-xl overflow-hidden border border-cyan-500/40 shadow-2xl">
              <img
                src={activeSolo === 'enhanced' ? enhSrc : rawSrc}
                alt="Solo View"
                className="w-full h-full object-contain max-h-[65vh] bg-black"
              />

              {/* Floating Toggle Pill */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-full bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md shadow-2xl">
                <button
                  onClick={() => setActiveSolo('original')}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeSolo === 'original'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  View Original (Raw)
                </button>
                <button
                  onClick={() => setActiveSolo('enhanced')}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeSolo === 'enhanced'
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  View Enhanced (OpenCV)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry HUD Overlay (Floating Bottom-Left) */}
        {showMetadataHud && (
          <div className="absolute bottom-3 left-3 z-30 pointer-events-auto max-w-sm hidden sm:block">
            <div className="glass-panel p-3 rounded-xl border border-cyan-500/30 text-slate-200 text-xs font-mono shadow-[0_10px_30px_rgba(0,0,0,0.8)] space-y-2 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  ENHANCEMENT TELEMETRY
                </span>
                <span className="text-[9px] text-slate-400">
                  Split: {sliderPosition}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500 block text-[9px]">DIMENSIONS</span>
                  <span className="text-emerald-300 font-bold">
                    {metadata?.width && metadata?.height ? `${metadata.width}×${metadata.height} px` : 'High-Res Tile'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">BANDS</span>
                  <span className="text-cyan-300 font-bold">{metadata?.bands || 1} Spectral Bands</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">PROJECTION</span>
                  <span className="text-amber-300 font-bold">EPSG:{metadata?.epsg || '4326'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">PROCESS TIME</span>
                  <span className="text-slate-200 font-bold">
                    {metadata?.processingTimeMs ? `${metadata.processingTimeMs} ms` : '~49.5 ms'}
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-400">
                Pipeline: Min-Max (2-98%) → CLAHE (clip=2.0) → Bilateral → Unsharp Mask
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Preset Actions Bar */}
      {viewMode === 'slider' && (
        <div className="p-2.5 sm:p-3 bg-[#070C1A] border-t border-cyan-500/15 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="hidden sm:inline">Slider Position Presets:</span>
            <button
              onClick={() => setSliderPosition(25)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 cursor-pointer"
            >
              25%
            </button>
            <button
              onClick={() => setSliderPosition(50)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 cursor-pointer font-bold"
            >
              50% (Mid)
            </button>
            <button
              onClick={() => setSliderPosition(75)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 cursor-pointer"
            >
              75%
            </button>
          </div>

          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Powered by react-compare-image & OpenCV</span>
          </div>
        </div>
      )}
    </div>
  );

  // If used as modal dialog, wrap in fixed backdrop
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200">
        <div className="w-full max-w-5xl h-[85vh] flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
