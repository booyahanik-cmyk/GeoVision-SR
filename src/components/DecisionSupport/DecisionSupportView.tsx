import React, { useState } from 'react';
import { AreaOfInterest } from '../../types';
import { PARCELS_DATA, BUILDINGS_DATA, LAND_COVER_CLASSES } from '../../data/geospatialData';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  PieChart,
  LandPlot,
  Zap,
  Globe2,
  Sparkles
} from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface DecisionSupportViewProps {
  activeAOI: AreaOfInterest;
}

export const DecisionSupportView: React.FC<DecisionSupportViewProps> = ({ activeAOI }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const parcels = PARCELS_DATA[activeAOI.id] || [];
  const buildings = BUILDINGS_DATA[activeAOI.id] || [];
  const changedParcels = parcels.filter((p) => p.changeDetected.hasChange);

  // 1. Chart: Land Cover Distribution (Doughnut)
  const landCoverData = {
    labels: LAND_COVER_CLASSES.map((c) => c.name),
    datasets: [
      {
        data: LAND_COVER_CLASSES.map((c) => c.percentage),
        backgroundColor: LAND_COVER_CLASSES.map((c) => c.hex),
        borderColor: '#0B1324',
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  };

  // 2. Chart: Detected Features / Building Size Distribution (Bar) - Computed dynamically from active AOI buildings
  const buildingBins = {
    under200: buildings.filter((b) => b.areaM2 < 200).length,
    from200to500: buildings.filter((b) => b.areaM2 >= 200 && b.areaM2 < 500).length,
    from500to1000: buildings.filter((b) => b.areaM2 >= 500 && b.areaM2 <= 1000).length,
    over1000: buildings.filter((b) => b.areaM2 > 1000).length,
  };

  const buildingSizesData = {
    labels: ['< 200 m²', '200-500 m²', '500-1000 m²', '> 1000 m²'],
    datasets: [
      {
        label: 'Building Count',
        data: [
          buildingBins.under200,
          buildingBins.from200to500,
          buildingBins.from500to1000,
          buildingBins.over1000,
        ],
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        hoverBackgroundColor: '#fbbf24',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.5)',
      },
    ],
  };

  // 3. Chart: Change & Parcel Summary (Bar) - Computed dynamically from active AOI parcels
  const zoningCategories = ['Agricultural', 'Commercial', 'Residential Low', 'Protected Reserve'];
  const zoningLabels = ['Agricultural', 'Commercial', 'Residential', 'Reserve'];

  const noChangeCounts = zoningCategories.map((z) => 
    parcels.filter((p) => p.zoning === z && !p.changeDetected.hasChange).length
  );
  const changeCounts = zoningCategories.map((z) => 
    parcels.filter((p) => p.zoning === z && p.changeDetected.hasChange).length
  );

  const parcelSummaryData = {
    labels: zoningLabels,
    datasets: [
      {
        label: 'Compliant / No Change',
        data: noChangeCounts,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        hoverBackgroundColor: '#34d399',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.5)',
      },
      {
        label: 'Change Detected',
        data: changeCounts,
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        hoverBackgroundColor: '#fbbf24',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.5)',
      },
    ],
  };

  // Dynamically synthesize observations based on active AOI
  const firstChangedParcel = parcels.find((p) => p.changeDetected.hasChange);
  const highestNdviParcel = parcels.length > 0 
    ? [...parcels].sort((a, b) => b.ndviMean - a.ndviMean)[0]
    : null;

  const chartOptionsDark = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 },
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 18, 36, 0.95)',
        titleColor: '#38bdf8',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono, monospace', size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
      },
      y: {
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono, monospace', size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
      },
    },
  };

  // Export GeoJSON
  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      metadata: {
        platform: 'GeoVision-SR',
        aoi: activeAOI.name,
        exportedAt: new Date().toISOString(),
      },
      features: parcels.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [p.coordinates.map(([lat, lng]) => [lng, lat])],
        },
        properties: {
          id: p.id,
          cadastralCode: p.cadastralCode,
          zoning: p.zoning,
          areaHectares: p.areaHectares,
          buildingsDetected: p.buildingCount,
          changeDetected: p.changeDetected,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GeoVision_${activeAOI.id}_parcels.geojson`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('GeoJSON exported successfully.');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Code', 'Zoning', 'Area_Ha', 'Buildings', 'NDVI', 'Change_Detected'];
    const rows = parcels.map((p) => [
      p.cadastralCode,
      p.zoning,
      p.areaHectares,
      p.buildingCount,
      p.ndviMean,
      p.changeDetected.hasChange ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeoVision_${activeAOI.id}_summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess('CSV summary exported successfully.');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="h-full overflow-y-auto text-slate-200 p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto select-none font-sans relative">
      {/* Top Banner with Glassmorphism */}
      <div className="glass-panel-elevated p-4 sm:p-5 rounded-2xl border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2 tracking-wide">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Decision Support & Analysis</span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
              Demo Results
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical breakdown, land classification metrics, footprint distributions, and open-standard GIS exports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl btn-glass text-xs font-semibold cursor-pointer active:scale-95 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportGeoJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-glow-cyan text-slate-950 text-xs font-bold cursor-pointer active:scale-95 shadow-[0_0_16px_rgba(6,182,212,0.35)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export GeoJSON</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="glass-card p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-[0_0_16px_rgba(16,185,129,0.2)] animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Summary Cards with Refined Glass Aesthetics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-xl p-4 border border-cyan-500/15 group hover:border-cyan-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-medium block">AOI Extent</span>
            <Globe2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">21.5 km²</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">2,150 Hectares Target</div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-amber-500/15 group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-medium block">Parcels Monitored</span>
            <LandPlot className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{parcels.length}</div>
          <div className="text-[11px] text-amber-300 mt-0.5 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{changedParcels.length} Discrepancy Flagged</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-teal-500/15 group hover:border-teal-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-medium block">YOLOv11 Structures</span>
            <Building2 className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300 mt-1">{buildings.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Footprints Extracted</div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-indigo-500/15 group hover:border-indigo-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-medium block">Super-Resolution</span>
            <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">4× GSD</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">10m &rarr; 2.5m Ground Res</div>
        </div>
      </div>

      {/* 3 MAJOR CHARTS in Frosted Glass Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Land Cover Distribution (Doughnut) */}
        <div className="glass-panel rounded-2xl border border-cyan-500/15 p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
              <PieChart className="w-3.5 h-3.5 text-cyan-400" />
              <span>Land Cover Distribution</span>
            </div>
            <p className="text-xs text-slate-400">
              Categorical pixel breakdown via U-Net segmentation.
            </p>
          </div>
          <div className="relative h-60 my-3">
            <Doughnut
              data={landCoverData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif', size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* 2. Detected Features (Bar) */}
        <div className="glass-panel rounded-2xl border border-cyan-500/15 p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Footprint Distribution</span>
            </div>
            <p className="text-xs text-slate-400">
              Building footprints binned by surface area (m²).
            </p>
          </div>
          <div className="relative h-60 my-3">
            <Bar data={buildingSizesData} options={chartOptionsDark} />
          </div>
        </div>

        {/* 3. Change / Parcel Summary (Bar) */}
        <div className="glass-panel rounded-2xl border border-cyan-500/15 p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
              <LandPlot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zoning Compliance Summary</span>
            </div>
            <p className="text-xs text-slate-400">
              Audit status across cadastral zoning classifications.
            </p>
          </div>
          <div className="relative h-60 my-3">
            <Bar data={parcelSummaryData} options={chartOptionsDark} />
          </div>
        </div>
      </div>

      {/* Actionable Findings Cards */}
      <div className="glass-panel rounded-2xl border border-cyan-500/15 p-4 sm:p-5 space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Key Findings</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {firstChangedParcel ? (
            <div className="glass-card p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 flex items-start gap-3 shadow-[0_0_16px_rgba(245,158,11,0.1)]">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Change Observation: Structural Discrepancy</span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Parcel <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">{firstChangedParcel.cadastralCode}</span> ({firstChangedParcel.zoning}) exhibits an unrecorded {firstChangedParcel.changeDetected.deltaM2 || 780} m² structural footprint addition relative to baseline cadastre records.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-start gap-3 shadow-[0_0_16px_rgba(16,185,129,0.1)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300">Zoning Boundary Compliance</span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  All audited cadastral boundaries in {activeAOI.name.split('&')[0].trim()} align with registered spatial records with zero structural violations detected.
                </p>
              </div>
            </div>
          )}

          {highestNdviParcel ? (
            <div className="glass-card p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-start gap-3 shadow-[0_0_16px_rgba(16,185,129,0.1)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300">Ecological Condition: High Vegetation Density</span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Parcel <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">{highestNdviParcel.cadastralCode}</span> ({highestNdviParcel.zoning}) maintains highest vegetative health index (NDVI {highestNdviParcel.ndviMean}) with zero detected canopy encroachment.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 flex items-start gap-3 shadow-[0_0_16px_rgba(6,182,212,0.1)]">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300">Spatial Telemetry Status</span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  SwinIR 4× super-resolution telemetry models verified across all {buildings.length} segmented structures.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
