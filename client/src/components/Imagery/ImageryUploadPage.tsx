import React, { useState } from 'react';
import { 
  UploadCloud, 
  Satellite, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  Database,
  Compass,
  Sparkles,
  Info
} from 'lucide-react';
import { ImageryUploadCard } from './ImageryUploadCard';
import { ImageryResponseDto } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ImageryUploadPageProps {
  onNavigateToCatalog?: () => void;
  onNavigateToGIS?: () => void;
}

export const ImageryUploadPage: React.FC<ImageryUploadPageProps> = ({
  onNavigateToCatalog,
  onNavigateToGIS,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [recentUploads, setRecentUploads] = useState<ImageryResponseDto[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string>('sentinel-2');

  const sensorPresets = [
    {
      id: 'sentinel-2',
      name: 'Sentinel-2 MSI',
      resolution: '10m VIS/NIR',
      crs: 'EPSG:4326 / UTM',
      desc: 'Copernicus MultiSpectral Instrument. Primary input for SwinIR 4x enhancement.',
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
    },
    {
      id: 'landsat',
      name: 'Landsat 8-9 OLI/TIRS',
      resolution: '30m Multi / 15m Pan',
      crs: 'WGS 84 / UTM Grid',
      desc: 'USGS/NASA earth observation tiles for land cover & long-term parcel change audit.',
      color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300',
    },
    {
      id: 'planetscope',
      name: 'PlanetScope SuperDove',
      resolution: '3.0m High-Res',
      crs: 'Projected GeoTIFF',
      desc: 'Commercial constellation high-cadence monitoring for cadastre verification.',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
    },
    {
      id: 'drone-ortho',
      name: 'UAV Drone Orthomosaic',
      resolution: '< 5cm Ultra-GSD',
      crs: 'Localized EPSG',
      desc: 'Centimeter-level UAV photogrammetry survey for micro-cadastre discrepancy audits.',
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
    },
  ];

  const handleUploadSuccess = (imagery: ImageryResponseDto) => {
    setRecentUploads((prev) => [imagery, ...prev]);
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 min-w-0 overflow-y-auto bg-[#060913] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 relative">
      {/* High-tech grid texture */}
      <div className="absolute inset-0 geo-grid-bg opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Page Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/15 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-1">
              <Satellite className="w-3.5 h-3.5" />
              <span>DOMAIN FOUNDATION • PHASE 1 INGEST PIPELINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              Satellite Imagery Ingest & Cataloging
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                Active Storage
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Upload raw satellite and aerial remote sensing datasets into the GeoVision-SR imagery repository. Ingested tiles are validated and cataloged for downstream super-resolution and computer vision pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onNavigateToCatalog && (
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-glass text-slate-200 hover:text-white border border-cyan-500/30 hover:border-cyan-400 flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Imagery Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Operator Session Alert if authenticated */}
        {isAuthenticated && user && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Authenticated Operator: <strong className="text-white">{user.name}</strong> ({user.email})
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-[10px] text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/20">
                ROLE: {user.role}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Uploads will be registered under your identity
            </span>
          </div>
        )}

        {/* Ingest Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Sensor Selection & Ingest Guidelines */}
          <div className="lg:col-span-5 space-y-5">
            {/* Satellite Presets Card */}
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Source Constellation Presets
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500">FORMAT: GEOTIFF</span>
              </div>

              <div className="space-y-2.5">
                {sensorPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedSensor(preset.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedSensor === preset.id
                        ? 'border-cyan-400/80 bg-cyan-950/40 shadow-[0_0_16px_rgba(6,182,212,0.2)]'
                        : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {preset.resolution}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.desc}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-cyan-400/80">
                      <span>CRS: {preset.crs}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ingest Technical Specifications */}
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Ingest Architecture Compliance</span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-400 list-disc list-inside">
                <li>Files are saved to disk with collision-proof UUID references in <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">uploads/imagery</code>.</li>
                <li>Metadata is persisted to PostgreSQL database with initial status <span className="text-cyan-300 font-mono font-bold">UPLOADED</span>.</li>
                <li>Phase 2 SwinIR super-resolution transformer will consume this repository to generate 4x enhanced tiles.</li>
                <li>Single file payload limit is configured up to <strong>100MB</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Upload Card & Recent Uploads Feed */}
          <div className="lg:col-span-7 space-y-5">
            {/* Direct Upload Component */}
            <ImageryUploadCard onUploadSuccess={handleUploadSuccess} />

            {/* Session Ingestion Activity */}
            {recentUploads.length > 0 && (
              <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Recent Ingests in Current Session
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {recentUploads.length} item{recentUploads.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {recentUploads.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-3">
                        <div className="font-mono text-white font-medium truncate">{item.filename}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: #{item.id} • {(item.fileSize / (1024 * 1024)).toFixed(2)} MB • {item.fileType}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                          {item.status}
                        </span>
                        {onNavigateToCatalog && (
                          <button
                            type="button"
                            onClick={onNavigateToCatalog}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
                            title="Inspect in Catalog"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
