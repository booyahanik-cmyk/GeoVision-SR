import React, { useState, useMemo, useCallback } from 'react';
import { ScreenType, AreaOfInterest } from '../types';
import { AREAS_OF_INTEREST, PARCELS_DATA, BUILDINGS_DATA } from '../data/geospatialData';
import { CesiumGlobe } from './CesiumGlobe';
import { 
  ArrowRight, 
  Sparkles, 
  Globe2, 
  Satellite, 
  Layers, 
  Building2, 
  Maximize2,
  CheckCircle2,
  LandPlot
} from 'lucide-react';

interface LandingPageProps {
  onStartAnalysis: (aoi?: AreaOfInterest) => void;
  onSelectScreen: (screen: ScreenType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onSelectScreen,
}) => {
  const [selectedAOI, setSelectedAOI] = useState<AreaOfInterest>(AREAS_OF_INTEREST[0]);

  const handleSelectAOI = useCallback((aoi: AreaOfInterest) => {
    setSelectedAOI(aoi);
  }, []);

  const handleLaunchAnalysis = useCallback((aoi?: AreaOfInterest) => {
    onStartAnalysis(aoi || selectedAOI);
  }, [onStartAnalysis, selectedAOI]);

  // Dynamically calculate accurate coverage area in km² from the real AOI geographic bounds
  const aoiCoverageKm2 = useMemo(() => {
    if (!selectedAOI.bounds || selectedAOI.bounds.length < 2) return '15.6';
    const latSpanDeg = Math.abs(selectedAOI.bounds[1][0] - selectedAOI.bounds[0][0]);
    const lngSpanDeg = Math.abs(selectedAOI.bounds[1][1] - selectedAOI.bounds[0][1]);
    const latKm = latSpanDeg * 111.32;
    const lngKm = lngSpanDeg * (111.32 * Math.cos((selectedAOI.center[0] * Math.PI) / 180));
    return (latKm * lngKm).toFixed(1);
  }, [selectedAOI]);

  // Actual parcels monitored count from genuine dataset
  const parcelsCount = useMemo(() => {
    return (PARCELS_DATA[selectedAOI.id] || []).length;
  }, [selectedAOI.id]);

  // Actual detected buildings / structures count from genuine dataset
  const structuresCount = useMemo(() => {
    return (BUILDINGS_DATA[selectedAOI.id] || []).length;
  }, [selectedAOI.id]);

  return (
    <div className="w-full h-full text-slate-100 flex flex-col lg:flex-row items-stretch overflow-y-auto lg:overflow-hidden select-none font-sans relative bg-[#030B16]">
      {/* Background high-tech grid & subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 geo-grid-bg opacity-35" />
        <div className="absolute top-1/4 left-1/10 w-[450px] h-[450px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      </div>

      {/* LEFT COLUMN: Mission Briefing, AOI Selector, Primary Actions, Real Metrics */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-center px-4 sm:px-8 lg:pl-12 lg:pr-8 py-8 lg:py-6 shrink-0 z-10 relative min-w-0">
        <div className="max-w-xl mx-auto lg:mx-0 w-full space-y-5 sm:space-y-6">
          
          {/* Eyebrow / Tag */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/35 text-cyan-300 text-[11px] sm:text-xs font-mono tracking-wider uppercase backdrop-blur-md shadow-[0_0_14px_rgba(0,200,255,0.16)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>SATELLITE IMAGERY • AI • GEOSPATIAL INTELLIGENCE</span>
            </div>
          </div>

          {/* Main Heading & Mission Purpose */}
          <div className="space-y-2.5 sm:space-y-3">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.14]">
              Next-Gen Satellite <br />
              <span className="bg-gradient-to-r from-[#00C8FF] via-[#19D3E6] to-sky-300 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(0,200,255,0.4)]">
                Super-Resolution
              </span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-[14.5px] text-[#D7E4F0]/85 font-normal leading-relaxed">
              Transforming 10m Sentinel-2 optical imagery into 2.5m precision geospatial intelligence using SwinIR deep learning, automated cadastral parcel auditing, and YOLOv11x feature extraction.
            </p>
          </div>

          {/* TARGET AREA OF INTEREST (AOI) SELECTOR */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 text-[#8FA6BA] font-mono text-[11px] uppercase tracking-wider">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>TARGET AREA OF INTEREST</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-medium">{AREAS_OF_INTEREST.length} AVAILABLE</span>
            </div>

            {/* Compact Premium AOI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AREAS_OF_INTEREST.map((aoi) => {
                const isSelected = selectedAOI.id === aoi.id;
                // Compact name formatting: [ Rhône Delta ], [ Travis County ], [ Maasvlakte ], [ L'Horta Sud ]
                const shortName = aoi.name.split('&')[0].trim();

                return (
                  <button
                    key={aoi.id}
                    type="button"
                    onClick={() => handleSelectAOI(aoi)}
                    className={`relative p-2.5 sm:p-3 rounded-xl text-left transition-all duration-200 cursor-pointer border min-w-0 ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-950/80 to-[#08182B] text-cyan-200 border-[#00C8FF] shadow-[0_0_18px_rgba(0,200,255,0.28),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-cyan-400/40'
                        : 'glass-card text-slate-300 border-white/10 hover:border-cyan-400/35 hover:bg-[#081525]/70 hover:text-white'
                    }`}
                  >
                    {/* Active Check Indicator */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 text-cyan-400">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                    <div className="text-xs font-bold text-white truncate pr-2">
                      {shortName}
                    </div>
                    <div className="text-[11px] text-[#8FA6BA] truncate mt-0.5 font-sans">
                      {aoi.country}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRIMARY & SECONDARY ACTIONS */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleLaunchAnalysis(selectedAOI)}
              className="group inline-flex items-center justify-center gap-2.5 px-6 py-3 btn-glow-cyan text-[#030B16] font-bold text-xs sm:text-sm rounded-xl cursor-pointer"
            >
              <span>Open GIS Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </button>

            <button
              type="button"
              onClick={() => onSelectScreen('ai-analysis')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 btn-glass rounded-xl font-medium text-xs sm:text-sm cursor-pointer"
            >
              <span>View AI Pipeline</span>
            </button>
          </div>

          {/* QUICK PLATFORM STATUS / METRICS (Exact Existing Data from Project) */}
          <div className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Metric 1: AOI Coverage */}
              <div className="glass-panel p-2.5 sm:p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#8FA6BA] flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-cyan-400" />
                  <span>AOI COVERAGE</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {aoiCoverageKm2} <span className="text-xs font-medium text-cyan-400">km²</span>
                </div>
              </div>

              {/* Metric 2: Parcels Monitored */}
              <div className="glass-panel p-2.5 sm:p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#8FA6BA] flex items-center gap-1">
                  <LandPlot className="w-3 h-3 text-cyan-400" />
                  <span>PARCELS</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {parcelsCount} <span className="text-xs font-medium text-emerald-400 uppercase">MONITORED</span>
                </div>
              </div>

              {/* Metric 3: Structures Detected */}
              <div className="glass-panel p-2.5 sm:p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#8FA6BA] flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-cyan-400" />
                  <span>STRUCTURES</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {structuresCount} <span className="text-xs font-medium text-cyan-400 uppercase">DETECTED</span>
                </div>
              </div>

              {/* Metric 4: Super-Res Scale */}
              <div className="glass-panel p-2.5 sm:p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#8FA6BA] flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  <span>SUPER-RES</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  4× <span className="text-xs font-medium text-cyan-300">• {selectedAOI.enhancedGSD}m GSD</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Interactive 3D Earth enclosed in Geospatial Mission HUD */}
      <div className="relative w-full lg:w-[52%] xl:w-[55%] h-[380px] xs:h-[420px] sm:h-[480px] lg:h-full min-h-0 flex-1 overflow-hidden border-t lg:border-t-0 lg:border-l border-cyan-500/20 bg-[#030B16]">
        
        {/* HUD Corner Reticles */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Soft edge ambient light bleed & vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(3,11,22,0.9)] z-10" />

        {/* Top-Left Live Geospatial Telemetry HUD Overlay */}
        <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none max-w-[85%]">
          <div className="glass-panel px-3 py-2 rounded-xl border border-cyan-500/25 flex flex-col gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,200,255,0.9)] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                LIVE EARTH TELEMETRY
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-white font-medium">{selectedAOI.name.split('&')[0].trim()}</span>
              <span className="text-[#8FA6BA]">•</span>
              <span className="text-cyan-400">
                {selectedAOI.center[0].toFixed(3)}°N, {selectedAOI.center[1].toFixed(3)}°E
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Technical HUD Telemetry Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none hidden sm:flex items-center justify-between text-[10px] font-mono text-[#8FA6BA]">
          <div className="glass-panel px-2.5 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-2">
            <Satellite className="w-3 h-3 text-cyan-400" />
            <span className="truncate max-w-[220px] md:max-w-[320px] text-slate-300">
              {selectedAOI.sentinelTileId}
            </span>
          </div>
          <div className="glass-panel px-2.5 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-2">
            <span className="text-cyan-400">GSD:</span>
            <span className="text-slate-200">{selectedAOI.nativeGSD}m → {selectedAOI.enhancedGSD}m</span>
          </div>
        </div>

        {/* The Live Interactive Cesium Globe */}
        <CesiumGlobe
          selectedAOI={selectedAOI}
          onSelectAOI={handleSelectAOI}
          onLaunchAnalysis={handleLaunchAnalysis}
        />
      </div>
    </div>
  );
};

