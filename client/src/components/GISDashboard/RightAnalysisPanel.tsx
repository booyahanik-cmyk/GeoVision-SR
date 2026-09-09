import React from 'react';
import { AreaOfInterest, Parcel, ScreenType } from '../../types';
import { BUILDINGS_DATA, ROADS_DATA, LAND_COVER_CLASSES } from '../../data/geospatialData';
import { 
  X, 
  ArrowUpRight,
  LandPlot,
  Building2,
  Route,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  Layers
} from 'lucide-react';

interface RightAnalysisPanelProps {
  activeAOI: AreaOfInterest;
  selectedParcel: Parcel | null;
  onSelectScreen: (screen: ScreenType) => void;
  onSelectParcel: (parcel: Parcel | null) => void;
}

export const RightAnalysisPanel: React.FC<RightAnalysisPanelProps> = ({
  activeAOI,
  selectedParcel,
  onSelectScreen,
  onSelectParcel,
}) => {
  const buildings = BUILDINGS_DATA[activeAOI.id] || [];
  const roads = ROADS_DATA[activeAOI.id] || [];
  const totalRoadLengthKm = (roads.reduce((acc, r) => acc + r.lengthM, 0) / 1000).toFixed(2);

  return (
    <aside className="w-68 sm:w-72 md:w-76 bg-[#080D1A]/85 backdrop-blur-xl border-l border-cyan-500/15 flex flex-col h-full overflow-y-auto text-slate-200 select-none font-sans text-xs shrink-0 z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.4)]">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-cyan-500/15 bg-[#0B1324]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white tracking-wide text-xs">
            {selectedParcel ? 'Parcel Intelligence' : 'Analysis Summary'}
          </span>
        </div>
        {selectedParcel && (
          <button
            onClick={() => onSelectParcel(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Deselect parcel"
            aria-label="Deselect current parcel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3.5 space-y-4 flex-1">
        {selectedParcel ? (
          /* CONTEXTUAL VIEW: Selected Parcel Information */
          <div className="space-y-3.5">
            <div className="glass-card-elevated rounded-xl p-3.5 space-y-3 border border-cyan-400/25">
              {/* Parcel Header Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase font-sans tracking-wider text-cyan-400 font-semibold">
                    Cadastral Unit
                  </div>
                  <div className="text-base font-bold font-mono text-white mt-0.5 tracking-tight">
                    {selectedParcel.cadastralCode}
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${
                  selectedParcel.changeDetected.hasChange
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                }`}>
                  {selectedParcel.changeDetected.hasChange ? (
                    <AlertTriangle className="w-2.5 h-2.5" />
                  ) : (
                    <ShieldCheck className="w-2.5 h-2.5" />
                  )}
                  <span>{selectedParcel.changeDetected.hasChange ? 'Audit Flag' : 'Compliant'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div className="glass-card p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-300 font-medium">Zoning</div>
                  <div className="text-xs text-cyan-300 font-semibold mt-0.5 truncate">{selectedParcel.zoning}</div>
                </div>
                <div className="glass-card p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-300 font-medium">Area</div>
                  <div className="text-xs font-mono text-slate-100 font-semibold mt-0.5">{selectedParcel.areaHectares} ha</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="glass-card p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-300 font-medium">Buildings</div>
                  <div className="text-xs font-mono text-amber-300 font-semibold mt-0.5">{selectedParcel.buildingCount} detected</div>
                </div>
                <div className="glass-card p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-300 font-medium">NDVI Mean</div>
                  <div className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">{selectedParcel.ndviMean}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-300 font-medium">Change Observation</div>
                <div className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                  {selectedParcel.changeDetected.hasChange
                    ? `${selectedParcel.changeDetected.type} (+${selectedParcel.changeDetected.deltaM2} m² expansion)`
                    : 'No structural changes detected relative to baseline.'}
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectScreen('parcel-intelligence')}
              className="w-full py-2.5 btn-glow-cyan text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-[0_0_16px_rgba(6,182,212,0.3)]"
            >
              <LandPlot className="w-3.5 h-3.5" />
              <span>Full Parcel Audit & GIS</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        ) : (
          /* CONTEXTUAL VIEW: Summary When Nothing Selected */
          <div className="space-y-3.5">
            <div className="glass-card rounded-xl p-3.5 space-y-3 border border-cyan-500/10">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-[11px] uppercase font-sans tracking-wider text-slate-300 font-semibold">Detection Summary (Demo)</span>
                <span className="text-[10px] font-sans font-medium text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Sentinel-2
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-slate-200">Buildings (YOLOv11)</span>
                </div>
                <span className="text-sm font-bold font-mono text-white">{buildings.length}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Route className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs text-slate-200">Road Network</span>
                </div>
                <span className="text-sm font-bold font-mono text-white">{totalRoadLengthKm} km</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-slate-200">Land Cover Classes</span>
                </div>
                <span className="text-sm font-bold font-mono text-white">{LAND_COVER_CLASSES.length}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs text-slate-200">Model Inference</span>
                </div>
                <span className="text-xs font-mono font-semibold text-cyan-300">SwinIR 4×</span>
              </div>
            </div>

            <div className="glass-card p-3 rounded-xl border border-dashed border-slate-700/80 text-xs text-slate-300/90 text-center leading-relaxed">
              Click any parcel boundary on the central map to inspect detailed cadastral attributes and compliance status.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
