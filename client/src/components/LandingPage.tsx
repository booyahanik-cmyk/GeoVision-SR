import React, { useState } from 'react';
import { ScreenType, AreaOfInterest } from '../types';
import { AREAS_OF_INTEREST } from '../data/geospatialData';
import { CesiumGlobe } from './CesiumGlobe';
import { ArrowRight, Sparkles, Globe2 } from 'lucide-react';

interface LandingPageProps {
  onStartAnalysis: (aoi?: AreaOfInterest) => void;
  onSelectScreen: (screen: ScreenType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onSelectScreen,
}) => {
  const [selectedAOI, setSelectedAOI] = useState<AreaOfInterest>(AREAS_OF_INTEREST[0]);

  return (
    <div className="w-full h-full text-slate-100 flex flex-col lg:flex-row items-stretch overflow-y-auto lg:overflow-hidden select-none font-sans relative">
      {/* LEFT COLUMN: Clean, focused hero briefing with high-end glass aesthetics */}
      <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-center px-6 sm:px-10 lg:pl-14 lg:pr-10 py-10 lg:py-0 shrink-0 z-10 relative">
        <div className="max-w-lg space-y-6 sm:space-y-7">
          
          {/* High-tech telemetry badge */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs font-sans font-medium backdrop-blur-md shadow-[0_0_18px_rgba(6,182,212,0.18)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sentinel-2 • SwinIR Deep Learning</span>
            </div>
          </div>

          {/* Main Heading & Purpose */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.12]">
              Next-Gen Satellite <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(34,211,238,0.35)]">
                Super-Resolution
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300/90 font-normal leading-relaxed">
              Transforming 10m Sentinel-2 optical imagery into 2.5m precision geospatial intelligence using SwinIR deep learning, automated cadastral parcel auditing, and YOLOv11x feature extraction.
            </p>
          </div>

          {/* Area of Interest (AOI) Selector with Glass Tile Aesthetics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Select Target Area of Interest (AOI)</span>
              </span>
              <span className="text-xs font-sans font-medium text-cyan-400">{AREAS_OF_INTEREST.length} Available</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AREAS_OF_INTEREST.map((aoi) => {
                const isSelected = selectedAOI.id === aoi.id;
                return (
                  <button
                    key={aoi.id}
                    onClick={() => setSelectedAOI(aoi)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left sm:text-center transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900/90 text-cyan-200 border-cyan-400/60 shadow-[0_0_16px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-cyan-400/30'
                        : 'glass-card text-slate-300 border-slate-800/80 hover:text-white hover:border-slate-700/80 hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="truncate font-medium">{aoi.name.split('&')[0].trim()}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5 font-sans font-medium">{aoi.country}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary & Secondary Actions with Glowing Micro-interactions */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              onClick={() => onStartAnalysis(selectedAOI)}
              className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 btn-glow-cyan text-slate-950 font-bold text-sm rounded-xl cursor-pointer"
            >
              <span>Open GIS Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </button>

            <button
              onClick={() => onSelectScreen('ai-analysis')}
              className="inline-flex items-center justify-center gap-2 px-4.5 py-3.5 btn-glass rounded-xl font-medium text-sm cursor-pointer hover:border-cyan-500/30"
            >
              <span>View AI Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean Interactive 3D Globe with Ambient Edge Glow */}
      <div className="relative w-full lg:w-[52%] xl:w-[56%] h-[420px] sm:h-[500px] lg:h-full min-h-0 flex-1 overflow-hidden border-t lg:border-t-0 lg:border-l border-cyan-500/15">
        {/* Soft edge ambient light bleed */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] z-10" />
        
        <CesiumGlobe
          selectedAOI={selectedAOI}
          onSelectAOI={(aoi) => setSelectedAOI(aoi)}
          onLaunchAnalysis={(aoi) => onStartAnalysis(aoi || selectedAOI)}
        />
      </div>
    </div>
  );
};
