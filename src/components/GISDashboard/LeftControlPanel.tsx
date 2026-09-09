import React from 'react';
import { AreaOfInterest, PreprocessingOptions, MapLayerState, SpectralBand } from '../../types';
import { AREAS_OF_INTEREST } from '../../data/geospatialData';
import { 
  UploadCloud, 
  Play, 
  RotateCw, 
  Eye, 
  EyeOff,
  SlidersHorizontal,
  Layers as LayersIcon,
  Sparkles
} from 'lucide-react';

interface LeftControlPanelProps {
  activeAOI: AreaOfInterest;
  aoiList?: AreaOfInterest[];
  onSelectAOI: (aoi: AreaOfInterest) => void;
  selectedBand: SpectralBand;
  onSelectBand: (band: SpectralBand) => void;
  preprocessing: PreprocessingOptions;
  onTogglePreprocessing: (key: keyof PreprocessingOptions) => void;
  layers: MapLayerState;
  onToggleLayer: (key: keyof Omit<MapLayerState, 'layerOpacity' | 'baseType'>) => void;
  onChangeOpacity: (key: keyof MapLayerState['layerOpacity'], value: number) => void;
  onChangeBaseType: (type: 'satellite' | 'dark' | 'topo') => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  analysisProgress: number;
  onOpenUpload: () => void;
}

export const LeftControlPanel: React.FC<LeftControlPanelProps> = ({
  activeAOI,
  aoiList = AREAS_OF_INTEREST,
  onSelectAOI,
  selectedBand,
  onSelectBand,
  preprocessing,
  onTogglePreprocessing,
  layers,
  onToggleLayer,
  onRunAnalysis,
  isAnalyzing,
  analysisProgress,
  onOpenUpload,
}) => {
  const spectralBands: { id: SpectralBand; label: string; tag: string }[] = [
    { id: 'true-color', label: 'True Color', tag: 'RGB' },
    { id: 'false-color-nir', label: 'Color Infrared', tag: 'NIR' },
    { id: 'agriculture-swir', label: 'Agriculture', tag: 'SWIR' },
    { id: 'ndvi', label: 'NDVI Index', tag: 'Vegetation' },
  ];

  const preprocessingSteps: { key: keyof PreprocessingOptions; label: string }[] = [
    { key: 'cloudRemoval', label: 'Cloud Removal' },
    { key: 'noiseReduction', label: 'Noise Reduction' },
    { key: 'imageClipping', label: 'Image Clipping' },
    { key: 'bandSelection', label: 'Band Selection' },
    { key: 'resampling', label: 'Resampling' },
    { key: 'imageNormalization', label: 'Normalization' },
  ];

  const layerItems: { key: keyof Omit<MapLayerState, 'layerOpacity' | 'baseType'>; label: string; count?: string }[] = [
    { key: 'aoiBoundary', label: 'AOI Boundary' },
    { key: 'parcels', label: 'Cadastral Parcels' },
    { key: 'buildings', label: 'YOLOv11 Buildings' },
    { key: 'roads', label: 'Road Network' },
    { key: 'landCover', label: 'U-Net Land Cover' },
    { key: 'confidenceMap', label: 'Confidence Heatmap' },
  ];

  const currentAOIList = aoiList && aoiList.length > 0 ? aoiList : AREAS_OF_INTEREST;

  return (
    <aside className="w-70 sm:w-72 md:w-76 bg-[#080D1A]/85 backdrop-blur-xl border-r border-cyan-500/15 flex flex-col h-full overflow-y-auto text-slate-200 select-none font-sans text-xs shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
      {/* Panel Top Header */}
      <div className="p-3.5 border-b border-cyan-500/15 bg-[#0B1324]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white tracking-wide text-xs">Console Controls</span>
        </div>
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-400/30 text-cyan-300 text-[11px] font-medium transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)] hover:shadow-[0_0_16px_rgba(6,182,212,0.3)] active:scale-95"
          aria-label="Upload satellite imagery file"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
      </div>

      <div className="p-3.5 space-y-4 flex-1">
        {/* AOI Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Target AOI
          </label>
          <div className="relative">
            <select
              value={activeAOI.id}
              onChange={(e) => {
                const target = currentAOIList.find((a) => a.id === e.target.value);
                if (target) onSelectAOI(target);
              }}
              aria-label="Target AOI selection"
              className="w-full glass-input text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400/50 cursor-pointer font-medium appearance-none"
            >
              {currentAOIList.map((aoi) => (
                <option key={aoi.id} value={aoi.id} className="bg-[#0A101D] text-white">
                  {aoi.name} ({aoi.country})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Spectral Band Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Imagery / Spectral Band
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {spectralBands.map((band) => {
              const isSelected = selectedBand === band.id;
              return (
                <button
                  key={band.id}
                  onClick={() => onSelectBand(band.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-xs cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/90 to-slate-900/90 border-cyan-400/50 text-cyan-200 font-semibold shadow-[0_0_14px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]'
                      : 'glass-card border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-850/50'
                  }`}
                >
                  <span>{band.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {band.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preprocessing Pipeline Switches */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Preprocessing Pipeline
          </label>
          <div className="glass-card rounded-xl p-2.5 space-y-1 border border-cyan-500/10">
            {preprocessingSteps.map((step) => {
              const isEnabled = preprocessing[step.key];
              return (
                <button
                  key={step.key}
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label={`${step.label}: ${isEnabled ? 'enabled' : 'disabled'}`}
                  onClick={() => onTogglePreprocessing(step.key)}
                  className="toggle-switch w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-cyan-950/20 cursor-pointer text-xs transition-colors"
                >
                  <span className={isEnabled ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                    {step.label}
                  </span>
                  
                  {/* Sleek Custom Glass Toggle Switch */}
                  <div className={`w-7 h-4 rounded-full transition-all duration-200 relative p-0.5 border pointer-events-none ${
                    isEnabled
                      ? 'bg-cyan-500/90 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 border-slate-700'
                  }`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      isEnabled ? 'translate-x-3' : 'translate-x-0'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Layers Visibility */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <LayersIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vector Layers</span>
            </span>
          </div>
          <div className="glass-card rounded-xl p-2.5 space-y-1 border border-cyan-500/10">
            {layerItems.map((item) => {
              const isVisible = layers[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => onToggleLayer(item.key)}
                  className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-all cursor-pointer text-xs text-left ${
                    isVisible ? 'hover:bg-cyan-950/20' : 'hover:bg-slate-850/40 opacity-70'
                  }`}
                >
                  <span className={isVisible ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    {item.label}
                  </span>
                  <div className={`p-1 rounded-md transition-colors ${isVisible ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-600'}`}>
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Run Analysis Action with Radiant Glow */}
      <div className="p-3.5 border-t border-cyan-500/15 bg-[#0B1324]/90 backdrop-blur-md space-y-2">
        {isAnalyzing && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-cyan-300 font-mono">
              <span>SwinIR Inference</span>
              <span>{analysisProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-200 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isAnalyzing
              ? 'bg-slate-850 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'btn-glow-cyan text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.35)] active:scale-98'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Processing Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run AI Super-Resolution</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
