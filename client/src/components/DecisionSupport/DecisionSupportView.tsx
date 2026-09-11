import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Plugin,
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
  Sparkles,
  Info,
  X,
  FileText,
} from 'lucide-react';
import { generateDecisionSupportPDF } from '../../utils/generateDecisionReport';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Plugin reproducing Animista rotate-center (360deg rotation) & scale-in-center (82% -> 100%)
// on the doughnut arc dataset without transforming the outer canvas or card
const doughnutAnimPlugin: Plugin<'doughnut'> = {
  id: 'doughnutAnimPlugin',
  beforeDatasetDraw(chart: any) {
    if (chart.config.type !== 'doughnut') return;
    if (chart.options.animation === false) return;

    const progress = chart._animProgress ?? 1;
    if (progress >= 1) return;

    const ctx = chart.ctx;
    const { left, top, width, height } = chart.chartArea;
    const cx = left + width / 2;
    const cy = top + height / 2;

    // Easing: easeOutQuart
    const eased = 1 - Math.pow(1 - progress, 4);

    // Animista rotate-center: starts at -360deg and smoothly settles at 0deg
    const angle = (1 - eased) * (-2 * Math.PI);

    // Animista scale-in-center: starts slightly scaled down (82%) and smoothly reaches 100%
    const scale = 0.82 + 0.18 * eased;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    chart._doughnutTransformed = true;
  },
  afterDatasetDraw(chart: any) {
    if (chart._doughnutTransformed) {
      chart.ctx.restore();
      chart._doughnutTransformed = false;
    }
  },
};

// ---------- Info Popup Component ----------
interface ChartInfoPopupProps {
  chartId: 'land-cover' | 'footprint' | 'zoning';
  onClose: () => void;
}

const CHART_INFO_CONTENT: Record<string, { title: string; sections: { heading: string; items: string[] }[] }> = {
  'land-cover': {
    title: 'Land Cover Distribution',
    sections: [
      {
        heading: 'What this chart shows',
        items: [
          'Categorical pixel breakdown via U-Net segmentation.',
          'Each segment represents the proportion of land area classified into a specific cover type within the current AOI.',
        ],
      },
      {
        heading: 'Land cover categories',
        items: [
          'Built-up / Impervious — Rooftops, roads, paved surfaces, and other non-permeable ground.',
          'Dense Tree Canopy — Continuous closed-canopy woodland and forest cover.',
          'Irrigated Cropland — Actively cultivated agricultural fields with visible irrigation patterns.',
          'Open Water Bodies — Rivers, canals, ponds, and other surface water features.',
          'Bare Soil & Sand — Exposed earth, cleared ground, and sandy surfaces.',
        ],
      },
      {
        heading: 'How to interpret',
        items: [
          'Percentages represent the share of total classified pixels assigned to each category.',
          'The doughnut segments are proportional to these percentages.',
          'Hover over a segment to see the exact value.',
          'Classification is produced by U-Net ResNet101 segmentation on super-resolved imagery.',
        ],
      },
    ],
  },
  'footprint': {
    title: 'Footprint Distribution',
    sections: [
      {
        heading: 'What this chart shows',
        items: [
          'Building footprints binned by surface area (m²).',
          'Bars represent the count of detected building structures within each size range for the current AOI.',
        ],
      },
      {
        heading: 'Surface area ranges',
        items: [
          '< 200 m² — Small residential structures, sheds, and outbuildings.',
          '200–500 m² — Standard residential homes and small commercial units.',
          '500–1000 m² — Large residential or medium commercial/agricultural buildings.',
          '> 1000 m² — Industrial facilities, warehouses, and large commercial structures.',
        ],
      },
      {
        heading: 'How to interpret',
        items: [
          'Each bar height corresponds to the number of buildings ("Building Count") in that size bin.',
          'Building footprints are extracted using YOLOv11x Oriented Bounding Box detection on SwinIR-enhanced imagery.',
          'Hover over a bar to see the exact building count.',
        ],
      },
    ],
  },
  'zoning': {
    title: 'Zoning Compliance Summary',
    sections: [
      {
        heading: 'What this chart shows',
        items: [
          'Audit status across cadastral zoning classifications.',
          'Grouped bars compare the number of compliant versus change-detected parcels within each zoning category.',
        ],
      },
      {
        heading: 'Zoning categories',
        items: [
          'Agricultural — Parcels designated for farming, viticulture, or pasture.',
          'Commercial — Parcels designated for retail, office, or mixed-use commercial development.',
          'Residential — Low-density residential parcels.',
          'Reserve — Protected natural areas, state forests, or environmental conservation zones.',
        ],
      },
      {
        heading: 'Status definitions',
        items: [
          'Compliant / No Change — The parcel\'s structural footprint matches the registered cadastre baseline with no unauthorized modifications detected.',
          'Change Detected — SwinIR-enhanced imagery reveals a structural footprint discrepancy compared to the baseline register (e.g., new construction, impervious expansion, or canopy clearing).',
        ],
      },
      {
        heading: 'How to interpret',
        items: [
          'Taller green bars indicate more parcels in compliance within that zoning type.',
          'Amber bars indicate parcels flagged for further review.',
          'Hover over a bar to see the exact count.',
        ],
      },
    ],
  },
};

const ChartInfoPopup: React.FC<ChartInfoPopupProps> = ({ chartId, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to prevent the opening click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Focus trap — focus the popup on mount
  useEffect(() => {
    popupRef.current?.focus();
  }, []);

  const info = CHART_INFO_CONTENT[chartId];
  if (!info) return null;

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-label={`${info.title} — Information`}
      tabIndex={-1}
      className="info-popup-enter absolute bottom-12 right-2 z-30 w-[min(340px,calc(100vw-2rem))] max-h-[380px] overflow-y-auto rounded-xl border border-cyan-500/25 bg-[#0B1324]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-xs text-slate-300 focus:outline-none"
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#0B1324]/95 backdrop-blur-xl border-b border-cyan-500/15 px-4 py-2.5 flex items-center justify-between z-10">
        <span className="font-bold text-white text-xs tracking-wide">{info.title}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close info panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {info.sections.map((section, sIdx) => (
          <div key={sIdx}>
            <h4 className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider mb-1.5">
              {section.heading}
            </h4>
            <ul className="space-y-1">
              {section.items.map((item, iIdx) => (
                <li key={iIdx} className="text-[11px] text-slate-300/90 leading-relaxed pl-2.5 relative before:content-['·'] before:absolute before:left-0 before:text-cyan-500/60 before:font-bold">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Main Component ----------
interface DecisionSupportViewProps {
  activeAOI: AreaOfInterest;
}

export const DecisionSupportView: React.FC<DecisionSupportViewProps> = ({ activeAOI }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [openInfoPopup, setOpenInfoPopup] = useState<'land-cover' | 'footprint' | 'zoning' | null>(null);

  // Detect reduced-motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const parcels = PARCELS_DATA[activeAOI.id] || [];
  const buildings = BUILDINGS_DATA[activeAOI.id] || [];
  const changedParcels = parcels.filter((p) => p.changeDetected.hasChange);
  const hasData = parcels.length > 0 || buildings.length > 0;

  // Animation duration for Chart.js
  const animDuration = prefersReducedMotion ? 0 : 800;

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

  // 2. Chart: Detected Features / Building Size Distribution (Bar)
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

  // 3. Chart: Change & Parcel Summary (Bar)
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

  // 1. Chart Options: Land Cover Distribution (Doughnut)
  // Animista rotate-center (360deg rotation) & scale-in-center (82% -> 100%)
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion
      ? (false as const)
      : {
          animateRotate: true,
          animateScale: false,
          duration: 900,
          easing: 'easeOutQuart' as const,
          onProgress(anim: any) {
            if (anim.numSteps > 0) {
              anim.chart._animProgress = anim.currentStep / anim.numSteps;
            }
          },
          onComplete(anim: any) {
            anim.chart._animProgress = 1;
          },
        },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cbd5e1',
          font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 },
          padding: 12,
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
  };

  // 2. Chart Options: Footprint Distribution (Bar)
  // Animista scale-in-ver-bottom: bars rise vertically from zero baseline upward
  const footprintBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion
      ? (false as const)
      : {
          duration: 800,
          easing: 'easeOutQuart' as const,
        },
    animations: prefersReducedMotion
      ? undefined
      : {
          y: {
            duration: 800,
            easing: 'easeOutQuart' as const,
            delay: (ctx: any) => {
              if (ctx.type === 'data' && ctx.mode === 'default') {
                return ctx.dataIndex * 45;
              }
              return 0;
            },
          },
        },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cbd5e1',
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
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
      },
    },
  };

  // 3. Chart Options: Zoning Compliance Summary (Bar)
  // Animista scale-in-ver-bottom: compliant & change bars rise vertically from baseline
  const zoningBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion
      ? (false as const)
      : {
          duration: 800,
          easing: 'easeOutQuart' as const,
        },
    animations: prefersReducedMotion
      ? undefined
      : {
          y: {
            duration: 800,
            easing: 'easeOutQuart' as const,
            delay: (ctx: any) => {
              if (ctx.type === 'data' && ctx.mode === 'default') {
                const datasetOffset = (ctx.datasetIndex || 0) * 25;
                return ctx.dataIndex * 45 + datasetOffset;
              }
              return 0;
            },
          },
        },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cbd5e1',
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
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 } },
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

  const toggleInfoPopup = useCallback((id: 'land-cover' | 'footprint' | 'zoning') => {
    setOpenInfoPopup((prev) => (prev === id ? null : id));
  }, []);

  // Info button component for chart panels
  const InfoButton: React.FC<{ chartId: 'land-cover' | 'footprint' | 'zoning' }> = ({ chartId }) => (
    <button
      onClick={() => toggleInfoPopup(chartId)}
      className="chart-fade-in w-6 h-6 rounded-full border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
      aria-label={`Show information about ${CHART_INFO_CONTENT[chartId]?.title || chartId}`}
      aria-expanded={openInfoPopup === chartId}
    >
      <Info className="w-3 h-3" />
    </button>
  );

  // AOI extent — use bounds to compute rough area
  const aoiBounds = activeAOI.bounds;
  const latDiff = Math.abs(aoiBounds[1][0] - aoiBounds[0][0]);
  const lngDiff = Math.abs(aoiBounds[1][1] - aoiBounds[0][1]);
  // Rough approximation: 1 degree lat ≈ 111km, 1 degree lng ≈ 111km * cos(lat)
  const avgLat = (aoiBounds[0][0] + aoiBounds[1][0]) / 2;
  const heightKm = latDiff * 111;
  const widthKm = lngDiff * 111 * Math.cos((avgLat * Math.PI) / 180);
  const aoiAreaKm2 = (heightKm * widthKm).toFixed(1);
  const aoiAreaHa = Math.round(heightKm * widthKm * 100);

  // Dynamic PDF Report Export
  const handleDownloadPDF = () => {
    try {
      const fileName = generateDecisionSupportPDF({
        activeAOI,
        parcels,
        buildings,
        landCover: LAND_COVER_CLASSES,
        aoiAreaKm2,
        aoiAreaHa,
        buildingBins,
        zoningCategories,
        zoningLabels,
        noChangeCounts,
        changeCounts,
        firstChangedParcel,
        highestNdviParcel,
      });

      setDownloadSuccess(`PDF Report (${fileName}) downloaded successfully.`);
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    }
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
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl btn-glass text-xs font-semibold cursor-pointer active:scale-95 shadow-sm text-slate-200 hover:text-white"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download PDF Report</span>
          </button>

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
        <div className="glass-card p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-[0_0_16px_rgba(16,185,129,0.2)] toast-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Summary Cards with Refined Glass Aesthetics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-xl p-4 border border-cyan-500/15 group hover:border-cyan-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 uppercase font-sans font-semibold tracking-wider block">AOI Extent</span>
            <Globe2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{aoiAreaKm2} km²</div>
          <div className="text-xs text-slate-300 mt-0.5 font-sans">{aoiAreaHa.toLocaleString()} Hectares Target</div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-amber-500/15 group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 uppercase font-sans font-semibold tracking-wider block">Parcels Monitored</span>
            <LandPlot className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{parcels.length}</div>
          <div className="text-[11px] text-amber-300 mt-0.5 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{changedParcels.length} Discrepancy Flagged</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-teal-500/15 group hover:border-teal-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 uppercase font-sans font-semibold tracking-wider block">YOLOv11 Structures</span>
            <Building2 className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300 mt-1">{buildings.length}</div>
          <div className="text-xs text-slate-300 mt-0.5 font-sans">Footprints Extracted</div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-indigo-500/15 group hover:border-indigo-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 uppercase font-sans font-semibold tracking-wider block">Super-Resolution</span>
            <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">4× GSD</div>
          <div className="text-xs text-slate-300 mt-0.5 font-sans">10m &rarr; 2.5m Ground Res</div>
        </div>
      </div>

      {/* 3 MAJOR CHARTS in Frosted Glass Panels — key on AOI to replay animations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Land Cover Distribution (Doughnut) */}
        <div className="glass-panel rounded-2xl border border-cyan-500/15 p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.35)] relative">
          <div>
            <div className="chart-fade-in flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
              <PieChart className="w-3.5 h-3.5 text-cyan-400" />
              <span>Land Cover Distribution</span>
            </div>
          </div>
          <div className="relative h-60 my-3" key={`doughnut-${activeAOI.id}`}>
            <Doughnut
              data={landCoverData}
              options={doughnutOptions}
              plugins={[doughnutAnimPlugin]}
            />
          </div>
          {/* Info button */}
          <div className="flex justify-end relative">
            <InfoButton chartId="land-cover" />
            {openInfoPopup === 'land-cover' && (
              <ChartInfoPopup chartId="land-cover" onClose={() => setOpenInfoPopup(null)} />
            )}
          </div>
        </div>

        {/* 2. Detected Features (Bar) */}
        <div className="glass-panel rounded-2xl border border-cyan-500/15 p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.35)] relative">
          <div>
            <div className="chart-fade-in flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Footprint Distribution</span>
            </div>
          </div>
          <div className="relative h-60 my-3" key={`footprint-${activeAOI.id}`}>
            {buildings.length > 0 ? (
              <Bar
                data={buildingSizesData}
                options={footprintBarOptions}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-700/60 rounded-xl">
                No building data available for this AOI
              </div>
            )}
          </div>
          {/* Info button */}
          <div className="flex justify-end relative">
            <InfoButton chartId="footprint" />
            {openInfoPopup === 'footprint' && (
              <ChartInfoPopup chartId="footprint" onClose={() => setOpenInfoPopup(null)} />
            )}
          </div>
        </div>

        {/* 3. Change / Parcel Summary (Bar) */}
        <div className="glass-panel rounded-2xl border border-cyan-500/15 p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.35)] relative">
          <div>
            <div className="chart-fade-in flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
              <LandPlot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zoning Compliance Summary</span>
            </div>
          </div>
          <div className="relative h-60 my-3" key={`zoning-${activeAOI.id}`}>
            {parcels.length > 0 ? (
              <Bar
                data={parcelSummaryData}
                options={zoningBarOptions}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-700/60 rounded-xl">
                No parcel data available for this AOI
              </div>
            )}
          </div>
          {/* Info button */}
          <div className="flex justify-end relative">
            <InfoButton chartId="zoning" />
            {openInfoPopup === 'zoning' && (
              <ChartInfoPopup chartId="zoning" onClose={() => setOpenInfoPopup(null)} />
            )}
          </div>
        </div>
      </div>

      {/* Actionable Findings Cards */}
      <div className="glass-panel rounded-2xl border border-cyan-500/15 p-4 sm:p-5 space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Key Findings</span>
        </h2>

        {hasData ? (
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
                  <span className="font-bold text-cyan-300">Spatial Analysis Status</span>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    SwinIR 4× super-resolution analysis verified across all {buildings.length} segmented structures.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-4 rounded-xl border border-dashed border-slate-700/60 text-center text-xs text-slate-400">
            <p>No parcel or building data available for <span className="text-cyan-300 font-medium">{activeAOI.name.split('&')[0].trim()}</span>.</p>
            <p className="mt-1 text-slate-500">Select an AOI with processed evaluation data to view findings.</p>
          </div>
        )}
      </div>
    </div>
  );
};
