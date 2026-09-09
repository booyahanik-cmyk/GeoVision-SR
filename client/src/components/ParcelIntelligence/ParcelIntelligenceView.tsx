import React, { useState, useEffect, useRef } from 'react';
import { AreaOfInterest, Parcel } from '../../types';
import { PARCELS_DATA } from '../../data/geospatialData';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  LandPlot,
  Filter,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';

interface ParcelIntelligenceViewProps {
  activeAOI: AreaOfInterest;
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel | null) => void;
}

export const ParcelIntelligenceView: React.FC<ParcelIntelligenceViewProps> = ({
  activeAOI,
  selectedParcel,
  onSelectParcel,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [zoningFilter, setZoningFilter] = useState<string>('all');
  const [changeFilter, setChangeFilter] = useState<string>('all');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const parcels = PARCELS_DATA[activeAOI.id] || [];
  const activeParcel = selectedParcel || parcels[0];

  // Initialize Leaflet map on mount with Esri World Dark Gray Canvas (no API key watermark!)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: activeAOI.center,
      zoom: activeAOI.zoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    polygonLayerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    const t = setTimeout(() => map.invalidateSize(), 50);

    return () => {
      clearTimeout(t);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      polygonLayerGroupRef.current = null;
    };
  }, []);

  // Update view when activeAOI changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView(activeAOI.center, activeAOI.zoom);
    setTimeout(() => map.invalidateSize(), 50);
  }, [activeAOI]);

  const handleParcelSelect = (p: Parcel) => {
    onSelectParcel(p);
    if (mapInstanceRef.current && p.center) {
      mapInstanceRef.current.flyTo(p.center, 15, {
        duration: 0.8,
        easeLinearity: 0.25,
      });
    }
  };

  // Update polygon layers when parcels or activeParcel changes
  useEffect(() => {
    const layerGroup = polygonLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    parcels.forEach((p) => {
      const isSelected = activeParcel?.id === p.id;
      const hasChange = p.changeDetected.hasChange;

      const color = isSelected
        ? '#22d3ee'
        : hasChange
        ? '#f59e0b'
        : '#10b981';

      const polygon = L.polygon(p.coordinates, {
        color: color,
        weight: isSelected ? 3.5 : 1.5,
        fillColor: color,
        fillOpacity: isSelected ? 0.45 : 0.18,
      });

      polygon.on('click', () => {
        handleParcelSelect(p);
      });

      polygon.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
          <strong style="color: #22d3ee;">${p.cadastralCode}</strong><br/>
          <span>${p.zoning} • ${p.areaHectares} ha</span>
        </div>`,
        { sticky: true }
      );

      layerGroup.addLayer(polygon);
    });
  }, [parcels, activeParcel, onSelectParcel]);

  const filteredParcels = parcels.filter((p) => {
    const matchesSearch =
      p.cadastralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.zoning.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZoning = zoningFilter === 'all' || p.zoning === zoningFilter;
    const matchesChange =
      changeFilter === 'all' ||
      (changeFilter === 'change' && p.changeDetected.hasChange) ||
      (changeFilter === 'no-change' && !p.changeDetected.hasChange);
    return matchesSearch && matchesZoning && matchesChange;
  });

  return (
    <div className="h-full overflow-y-auto text-slate-200 p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto select-none font-sans relative">
      {/* Top Header & Filter Controls Bar */}
      <div className="glass-panel-elevated p-4 rounded-2xl border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2 tracking-wide">
            <LandPlot className="w-4 h-4 text-cyan-400" />
            <span>Cadastral Intelligence & Auditing</span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30 whitespace-nowrap shrink-0">
              SwinIR 4× Super-Resolved
            </span>
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Boundary verification, land use zoning compliance, and structural expansion detection.
          </p>
        </div>

        {/* Filter Controls with Glass Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search code or zoning..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search parcel code or zoning"
              className="glass-input rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 w-48 font-sans"
            />
          </div>

          <div className="relative">
            <select
              value={zoningFilter}
              onChange={(e) => setZoningFilter(e.target.value)}
              aria-label="Filter parcels by zoning"
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-200 cursor-pointer appearance-none pr-7 font-sans"
            >
              <option value="all" className="bg-[#0A101D] text-white">All Zoning</option>
              <option value="Agricultural" className="bg-[#0A101D] text-white">Agricultural</option>
              <option value="Commercial" className="bg-[#0A101D] text-white">Commercial</option>
              <option value="Residential Low" className="bg-[#0A101D] text-white">Residential Low</option>
              <option value="Protected Reserve" className="bg-[#0A101D] text-white">Protected Reserve</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
          </div>

          <div className="relative">
            <select
              value={changeFilter}
              onChange={(e) => setChangeFilter(e.target.value)}
              aria-label="Filter parcels by compliance status"
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-200 cursor-pointer appearance-none pr-7 font-sans"
            >
              <option value="all" className="bg-[#0A101D] text-white">All Status</option>
              <option value="change" className="bg-[#0A101D] text-white">Change Detected</option>
              <option value="no-change" className="bg-[#0A101D] text-white">Compliant / No Change</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Table (Left 7) and Selected Parcel Details (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Map & Parcels Table */}
        <div className="lg:col-span-7 space-y-4">
          {/* Parcel Map */}
          <div className="glass-card rounded-2xl p-3.5 space-y-2.5 border border-cyan-500/15">
            <div className="flex items-center justify-between text-xs text-slate-300 px-1">
              <span className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Cadastral Vector Boundaries</span>
              </span>
              <span className="text-slate-300 text-xs font-sans">Click parcel to inspect</span>
            </div>
            <div className="relative w-full h-76 rounded-xl overflow-hidden border border-cyan-500/20 bg-[#050811] shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          </div>

          {/* Parcels Table */}
          <div className="glass-card rounded-2xl p-4 space-y-3 border border-cyan-500/15">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Audited Parcels ({filteredParcels.length})
              </h2>
              <span className="text-[11px] font-sans text-slate-300 font-medium">
                Sorted by Cadastral Index
              </span>
            </div>
            <div className="overflow-x-auto table-scroll-hint" ref={(el) => {
              if (el) {
                const checkOverflow = () => {
                  if (el.scrollWidth > el.clientWidth) {
                    el.classList.add('has-overflow');
                  } else {
                    el.classList.remove('has-overflow');
                  }
                };
                checkOverflow();
                window.addEventListener('resize', checkOverflow);
              }
            }}>
              <table className="w-full text-left text-xs border-collapse" aria-label="Audited cadastral parcels for the current area of interest">
                <caption className="sr-only">Cadastral parcels with zoning, area, detected buildings, vegetation index, and audit status</caption>
                <thead>
                  <tr className="border-b border-slate-800 text-slate-300 bg-slate-900/60">
                    <th scope="col" className="py-2.5 px-3 rounded-l-lg font-semibold">Code</th>
                    <th scope="col" className="py-2.5 px-2 font-semibold">Zoning</th>
                    <th scope="col" className="py-2.5 px-2 font-medium">Area</th>
                    <th scope="col" className="py-2.5 px-2 font-medium">Buildings</th>
                    <th scope="col" className="py-2.5 px-2 font-medium">NDVI</th>
                    <th scope="col" className="py-2.5 px-2 font-medium">Audit Status</th>
                    <th scope="col" className="py-2.5 px-2 rounded-r-lg font-medium"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredParcels.map((parcel) => {
                    const isSelected = activeParcel?.id === parcel.id;
                    const hasChange = parcel.changeDetected.hasChange;
                    return (
                      <tr
                        key={parcel.id}
                        onClick={() => handleParcelSelect(parcel)}
                        className={`cursor-pointer transition-all duration-150 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900/80 text-cyan-200 font-semibold' 
                            : 'hover:bg-slate-850/40 text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-white font-medium flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                          <span>{parcel.cadastralCode}</span>
                        </td>
                        <td className="py-2.5 px-2">{parcel.zoning}</td>
                        <td className="py-2.5 px-2 font-mono">{parcel.areaHectares} ha</td>
                        <td className="py-2.5 px-2 font-mono text-amber-300">{parcel.buildingCount}</td>
                        <td className="py-2.5 px-2 font-mono text-emerald-400">{parcel.ndviMean}</td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border inline-flex items-center gap-1 ${
                            hasChange
                              ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          }`}>
                            {hasChange ? 'Change detected' : 'Compliant'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Parcel Details */}
        <div className="lg:col-span-5 space-y-4">
          {activeParcel ? (
            <div className="glass-panel-elevated rounded-2xl border border-cyan-500/20 p-5 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3.5">
                <div>
                  <div className="text-[11px] uppercase font-sans tracking-wider text-cyan-400 font-semibold">
                    Audited Parcel Profile
                  </div>
                  <h2 className="text-xl font-extrabold font-mono text-white mt-0.5 tracking-tight">
                    {activeParcel.cadastralCode}
                  </h2>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border shadow-sm ${
                  activeParcel.changeDetected.hasChange
                    ? 'bg-amber-950/70 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                }`}>
                  {activeParcel.changeDetected.hasChange ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{activeParcel.changeDetected.hasChange ? 'Change Detected' : 'Compliant'}</span>
                </div>
              </div>

              {/* Boundary & Zoning */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="glass-card p-3 rounded-xl border border-cyan-500/15">
                  <span className="text-xs text-slate-300 uppercase font-semibold block">Total Area</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    {activeParcel.areaHectares} ha
                  </span>
                  <span className="text-[11px] font-sans text-slate-300">
                    {(activeParcel.areaHectares * 10000).toLocaleString()} m²
                  </span>
                </div>

                <div className="glass-card p-3 rounded-xl border border-cyan-500/15">
                  <span className="text-xs text-slate-300 uppercase font-semibold block">Land Use Zoning</span>
                  <span className="text-base font-semibold text-cyan-300 mt-0.5 block truncate">
                    {activeParcel.zoning}
                  </span>
                  <span className="text-[11px] font-sans text-slate-300">
                    Perimeter: {activeParcel.perimeterM} m
                  </span>
                </div>
              </div>

              {/* Detected Features Grid */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Segmented Structural Features</span>
                </h3>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="glass-card p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-300 uppercase font-semibold block">Buildings (YOLO)</span>
                    <span className="text-sm font-bold font-mono text-amber-300">
                      {activeParcel.buildingCount} Structures
                    </span>
                  </div>
                  <div className="glass-card p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-300 uppercase font-semibold block">Impervious Cover</span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {activeParcel.builtCoveragePercent}%
                    </span>
                  </div>
                  <div className="glass-card p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-300 uppercase font-semibold block">NDVI Vegetation</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {activeParcel.ndviMean}
                    </span>
                  </div>
                  <div className="glass-card p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-300 uppercase font-semibold block">Super-Resolution</span>
                    <span className="text-sm font-bold text-cyan-300">
                      SwinIR 2.5m
                    </span>
                  </div>
                </div>
              </div>

              {/* Change Detection Callout */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Audit Findings
                </h3>

                {activeParcel.changeDetected.hasChange ? (
                  <div className="glass-card p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-xs space-y-1.5 shadow-[0_0_16px_rgba(245,158,11,0.15)]">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Possible New Construction</span>
                      </span>
                      <span className="font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                        +{activeParcel.changeDetected.deltaM2} m²
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      SwinIR high-resolution imagery indicates structural footprint expansion exceeding registered cadastre baseline.
                    </p>
                  </div>
                ) : (
                  <div className="glass-card p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-slate-300 flex items-center gap-2.5 shadow-[0_0_16px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No structural discrepancies detected relative to the baseline register.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-300 text-xs font-medium border border-slate-800">
              Select a parcel from the table or map to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
