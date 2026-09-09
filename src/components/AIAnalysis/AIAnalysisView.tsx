import React, { useState, useRef } from 'react';
import { AreaOfInterest } from '../../types';
import { BUILDINGS_DATA, ROADS_DATA, LAND_COVER_CLASSES } from '../../data/geospatialData';
import { 
  Building2, 
  Route, 
  PieChart,
  Cpu,
  Sparkles,
  Zap,
  Layers,
  ShieldCheck,
  Eye
} from 'lucide-react';

interface AIAnalysisViewProps {
  activeAOI: AreaOfInterest;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({ activeAOI }) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0-100%
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // Handle Before/After slider dragging via Pointer Events (desktop and mobile)
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    handleSliderMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      handleSliderMove(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const buildings = BUILDINGS_DATA[activeAOI.id] || [];
  const roads = ROADS_DATA[activeAOI.id] || [];
  const totalRoadKm = (roads.reduce((acc, r) => acc + r.lengthM, 0) / 1000).toFixed(2);

  return (
    <div className="h-full overflow-y-auto text-slate-200 p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto select-none font-sans relative">
      {/* Top 4 Core Models Grid as Frosted Glass Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-xl p-3.5 border border-cyan-500/20 hover:border-cyan-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-400">SwinIR</div>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-sm font-bold text-cyan-300 mt-1">4× Super Resolution</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Eval: PSNR 34.2 dB • SSIM 0.91</div>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-amber-500/20 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-400">YOLOv11x</div>
            <Building2 className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-sm font-bold text-amber-300 mt-1">OBB Object Detection</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Eval: mAP50 88.4%</div>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-emerald-500/20 hover:border-emerald-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-400">U-Net ResNet101</div>
            <PieChart className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-sm font-bold text-emerald-300 mt-1">Land Cover Segmentation</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Eval: Mean IoU 79.6%</div>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-indigo-500/20 hover:border-indigo-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-400">Confidence Engine</div>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-sm font-bold text-slate-100 mt-1">Spatial Uncertainty</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Target Variance &lt; 4%</div>
        </div>
      </div>

      {/* Main Visual: Dominant Comparison Canvas & Compact Detections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Large Comparison Canvas */}
        <div className="lg:col-span-8 xl:col-span-9 glass-panel-elevated rounded-2xl border border-cyan-500/20 p-4 sm:p-5 space-y-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white tracking-wide">Interactive Super-Resolution Comparison</span>
            </div>
            <span className="text-slate-400 text-[11px] font-mono bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-500/20">
              Drag divider ⬌ horizontally
            </span>
          </div>

          {/* Interactive Split Slider Container */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                setSliderPosition((prev) => Math.max(5, prev - 2));
              } else if (e.key === 'ArrowRight') {
                setSliderPosition((prev) => Math.min(95, prev + 2));
              }
            }}
            tabIndex={0}
            role="slider"
            aria-label="Super-resolution comparison slider"
            aria-valuemin={5}
            aria-valuemax={95}
            aria-valuenow={Math.round(sliderPosition)}
            style={{ touchAction: 'none' }}
            className="relative w-full aspect-[16/10] bg-[#050811] rounded-xl overflow-hidden border border-cyan-500/25 cursor-ew-resize select-none shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]"
          >
            {/* Background: Enhanced SwinIR (Super Resolution 2.5m GSD) */}
            <div className="absolute inset-0 w-full h-full">
              <div className="w-full h-full relative bg-[#0d1b2a] overflow-hidden">
                {/* Crisp Agricultural fields and plots */}
                <div className="absolute top-6 left-8 w-56 h-40 bg-[#163826] border border-[#2f6347] rounded-lg shadow-sm" />
                <div className="absolute top-6 left-68 w-72 h-40 bg-[#1d4630] border border-[#3b7d58] rounded-lg shadow-sm" />
                <div className="absolute top-50 left-8 w-60 h-52 bg-[#143222] border border-[#26573c] rounded-lg shadow-sm" />

                {/* Crisp Roads */}
                <div className="absolute top-0 left-64 w-3.5 h-full bg-[#334155] border-x border-[#475569] shadow-sm" />
                <div className="absolute top-46 left-0 w-full h-3 bg-[#334155] border-y border-[#475569] shadow-sm" />
                <div className="absolute top-0 left-132 w-2.5 h-full bg-[#475569] -rotate-12" />

                {/* Crisp Delineated Buildings with Roof Details */}
                <div className="absolute top-14 left-76 w-18 h-14 bg-[#f1f5f9] shadow-lg border border-[#cbd5e1] rounded-sm">
                  <div className="w-full h-2.5 bg-cyan-600/30 border-b border-cyan-500" />
                </div>
                <div className="absolute top-22 left-98 w-22 h-16 bg-[#ffffff] shadow-xl border border-[#cbd5e1] rounded-sm">
                  <div className="w-full h-2 bg-amber-500/20 border-b border-amber-400" />
                </div>
                <div className="absolute top-32 left-124 w-14 h-12 bg-[#f8fafc] shadow-md border border-[#cbd5e1] rounded-sm" />

                {/* Water Canal */}
                <div className="absolute bottom-8 left-0 w-full h-9 bg-gradient-to-r from-cyan-700 via-teal-600 to-cyan-700 border-y border-cyan-400 opacity-90 shadow-[0_0_15px_rgba(6,182,212,0.3)]" />

                {/* Enhanced Tag - Frosted Glass */}
                <div className="absolute top-3.5 right-3.5 glass-panel rounded-lg px-3 py-1.5 text-xs text-cyan-200 font-semibold pointer-events-none border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Enhanced SwinIR (2.5m GSD)</span>
                </div>
              </div>
            </div>

            {/* Foreground: Native Medium Res (Clipped at slider position) */}
            <div
              className="absolute inset-0 h-full overflow-hidden pointer-events-none border-r-2 border-cyan-400 shadow-[2px_0_12px_rgba(34,211,238,0.8)]"
              style={{ width: `${sliderPosition}%` }}
            >
              <div 
                className="w-full h-full relative bg-[#0d1b2a]"
                style={{ 
                  width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%'
                }}
              >
                {/* Low/Medium Res Representation (blurred) */}
                <div className="w-full h-full relative filter blur-[4px]">
                  <div className="absolute top-6 left-8 w-56 h-40 bg-[#163826]" />
                  <div className="absolute top-6 left-68 w-72 h-40 bg-[#1d4630]" />
                  <div className="absolute top-50 left-8 w-60 h-52 bg-[#143222]" />

                  {/* Blurry roads */}
                  <div className="absolute top-0 left-64 w-5 h-full bg-[#3a4b60]" />
                  <div className="absolute top-46 left-0 w-full h-4 bg-[#3a4b60]" />

                  {/* Indistinct blocky buildings */}
                  <div className="absolute top-14 left-76 w-18 h-14 bg-[#cbd5e1]" />
                  <div className="absolute top-22 left-98 w-22 h-16 bg-[#cbd5e1]" />
                  <div className="absolute top-32 left-124 w-14 h-12 bg-[#cbd5e1]" />

                  {/* Water canal */}
                  <div className="absolute bottom-8 left-0 w-full h-9 bg-[#0a7a94]" />
                </div>

                {/* Original Tag - Frosted Glass */}
                <div className="absolute top-3.5 left-3.5 glass-panel rounded-lg px-3 py-1.5 text-xs text-slate-300 font-medium pointer-events-none border border-slate-700/80">
                  Native Sentinel-2 (10m GSD)
                </div>
              </div>
            </div>

            {/* Draggable Divider Handle with Radiant Glow */}
            <div
              className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-20 group pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
              aria-label="Super-Resolution comparison divider handle"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-slate-900 border-2 border-cyan-300 text-slate-950 flex items-center justify-center text-[10px] font-extrabold shadow-[0_0_16px_rgba(34,211,238,0.7)] group-hover:scale-110 transition-transform">
                <span className="text-white">⬌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Detections Column */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3.5">
          {/* Buildings Card */}
          <div className="glass-card rounded-2xl p-4 space-y-1.5 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                <Building2 className="w-4 h-4" />
                <span>Buildings (YOLOv11)</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/30">
                Active
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-white tracking-tight">
              {buildings.length}
            </div>
            <div className="text-[11px] text-slate-400">
              Oriented bounding boxes segmented
            </div>
          </div>

          {/* Roads Card */}
          <div className="glass-card rounded-2xl p-4 space-y-1.5 border border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                <Route className="w-4 h-4" />
                <span>Road Network</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Vectorized
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-white tracking-tight">
              {totalRoadKm} <span className="text-sm font-normal text-slate-400">km</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Arterial & local thoroughfares
            </div>
          </div>

          {/* Land Cover Breakdown Card */}
          <div className="glass-card rounded-2xl p-4 space-y-2.5 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <PieChart className="w-4 h-4" />
                <span>Land Cover (U-Net)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                5 Classes
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {LAND_COVER_CLASSES.map((lc) => (
                <div key={lc.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shadow-xs" style={{ backgroundColor: lc.hex }} />
                      <span className="text-slate-300 font-medium">{lc.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{lc.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${lc.percentage}%`, backgroundColor: lc.hex }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
