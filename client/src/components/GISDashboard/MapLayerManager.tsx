import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaOfInterest, MapLayerState, Parcel, SpectralBand, ImageryResponseDto } from '../../types';
import { PARCELS_DATA, BUILDINGS_DATA, ROADS_DATA } from '../../data/geospatialData';
import { parseImageryBbox, formatCoordinates } from '../../utils/geoUtils';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen, 
  Layers, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Sliders, 
  Compass,
  Sparkles,
  MapPin
} from 'lucide-react';

export interface MapLayerManagerProps {
  activeAOI: AreaOfInterest;
  layers: MapLayerState;
  selectedBand: SpectralBand;
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel) => void;
  onChangeBaseType?: (type: 'satellite' | 'dark' | 'topo') => void;
  showLeftPanel?: boolean;
  onToggleLeftPanel?: () => void;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
  // Phase 5: Uploaded Imagery Features
  uploadedImageryList?: ImageryResponseDto[];
  selectedImagery?: ImageryResponseDto | null;
  onSelectImagery?: (imagery: ImageryResponseDto) => void;
  showImageryBbox?: boolean;
  onToggleImageryBbox?: () => void;
  imageryOpacity?: number;
}

export const MapLayerManager: React.FC<MapLayerManagerProps> = ({
  activeAOI,
  layers,
  selectedBand,
  selectedParcel,
  onSelectParcel,
  onChangeBaseType,
  showLeftPanel = true,
  onToggleLeftPanel,
  showRightPanel = true,
  onToggleRightPanel,
  uploadedImageryList = [],
  selectedImagery = null,
  onSelectImagery,
  showImageryBbox = true,
  onToggleImageryBbox,
  imageryOpacity = 0.85,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups references
  const aoiGroupRef = useRef<L.LayerGroup | null>(null);
  const parcelGroupRef = useRef<L.LayerGroup | null>(null);
  const buildingGroupRef = useRef<L.LayerGroup | null>(null);
  const roadGroupRef = useRef<L.LayerGroup | null>(null);
  const landCoverGroupRef = useRef<L.LayerGroup | null>(null);
  const confidenceGroupRef = useRef<L.LayerGroup | null>(null);
  const imageryBboxGroupRef = useRef<L.LayerGroup | null>(null);

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number }>({
    lat: activeAOI.center[0],
    lng: activeAOI.center[1],
  });
  const [currentZoom, setCurrentZoom] = useState<number>(activeAOI.zoom);
  const [showLayerQuickMenu, setShowLayerQuickMenu] = useState<boolean>(false);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: activeAOI.center,
      zoom: activeAOI.zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Zoom control at top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Scale control at bottom-left
    L.control.scale({ position: 'bottomleft', imperial: false, metric: true }).addTo(map);

    // Initial Base Tile Layer
    const baseTileUrl =
      layers.baseType === 'dark' || !layers.satelliteBase
        ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const baseTile = L.tileLayer(baseTileUrl, {
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = baseTile;

    // Initialize all layer groups
    aoiGroupRef.current = L.layerGroup().addTo(map);
    parcelGroupRef.current = L.layerGroup().addTo(map);
    buildingGroupRef.current = L.layerGroup().addTo(map);
    roadGroupRef.current = L.layerGroup().addTo(map);
    landCoverGroupRef.current = L.layerGroup().addTo(map);
    confidenceGroupRef.current = L.layerGroup().addTo(map);
    imageryBboxGroupRef.current = L.layerGroup().addTo(map);

    // Track mouse coords & zoom
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    // ResizeObserver for reliable Leaflet dimension updates
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    const t1 = setTimeout(() => map.invalidateSize(), 60);
    const t2 = setTimeout(() => map.invalidateSize(), 250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate Leaflet size whenever sidebars toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize({ pan: false });
    const timer = setTimeout(() => map.invalidateSize({ pan: false }), 200);
    return () => clearTimeout(timer);
  }, [showLeftPanel, showRightPanel]);

  // Update Base Tile Layer dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 19;

    if (layers.baseType === 'dark' || !layers.satelliteBase) {
      url = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
    } else if (layers.baseType === 'topo') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      maxZoom = 17;
    }

    const tile = L.tileLayer(url, {
      maxZoom,
      opacity: layers.baseType === 'satellite' && selectedBand === 'false-color-nir' ? 0.85 : 1,
    }).addTo(map);

    tileLayerRef.current = tile;
  }, [layers.baseType, layers.satelliteBase, selectedBand]);

  // Center when AOI changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView(activeAOI.center, activeAOI.zoom);
    setTimeout(() => map.invalidateSize(), 60);
  }, [activeAOI]);

  // Fly to Selected Uploaded Imagery Extent when selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedImagery) return;

    const parsed = parseImageryBbox(
      selectedImagery.bbox,
      activeAOI.center,
      selectedImagery.width,
      selectedImagery.height
    );

    const bounds = L.latLngBounds(parsed.bounds);
    map.flyToBounds(bounds, {
      duration: 1.4,
      easeLinearity: 0.25,
      padding: [60, 60],
      maxZoom: 17,
    });
  }, [selectedImagery]);

  // Render Phase 5 Uploaded Imagery Bounding Boxes & Footprints
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !imageryBboxGroupRef.current) return;

    imageryBboxGroupRef.current.clearLayers();
    if (!showImageryBbox) return;

    // Render all uploaded imagery footprints
    uploadedImageryList.forEach((img, idx) => {
      const isSelected = selectedImagery?.id === img.id;
      const parsed = parseImageryBbox(img.bbox, activeAOI.center, img.width, img.height);
      const bounds = L.latLngBounds(parsed.bounds);

      // Distinct styling for selected vs unselected imagery
      const strokeColor = isSelected ? '#00f2ff' : img.status === 'PROCESSED' ? '#10b981' : '#38bdf8';
      const fillColor = isSelected ? '#06b6d4' : img.status === 'PROCESSED' ? '#059669' : '#0284c7';
      const fillOpacity = isSelected ? 0.25 * imageryOpacity : 0.12 * imageryOpacity;
      const weight = isSelected ? 3 : 1.75;
      const dashArray = isSelected ? '6, 4' : '4, 4';

      const rect = L.rectangle(bounds, {
        color: strokeColor,
        weight,
        dashArray,
        fillColor,
        fillOpacity,
      });

      // Interactive Click to Select Imagery
      rect.on('click', () => {
        if (onSelectImagery) {
          onSelectImagery(img);
        }
      });

      // Rich Interactive Popup with Imagery Metadata
      const popupHtml = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #f8fafc; min-width: 220px; font-size: 11px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(6, 182, 212, 0.3); padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-weight: 700; color: #00f2ff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">
              🛰️ Imagery Raster #${img.id}
            </span>
            <span style="padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: ${
              img.status === 'PROCESSED' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(6, 182, 212, 0.25)'
            }; color: ${img.status === 'PROCESSED' ? '#34d399' : '#38bdf8'}; border: 1px solid ${
              img.status === 'PROCESSED' ? '#059669' : '#0284c7'
            };">
              ${img.status}
            </span>
          </div>
          <div style="font-weight: 600; color: #ffffff; margin-bottom: 6px; word-break: break-all;">
            ${img.filename}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-family: monospace; font-size: 10px; background: rgba(0,0,0,0.4); padding: 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
            <div><span style="color: #64748b;">DIM:</span> <span style="color: #34d399;">${img.width || 'N/A'}×${img.height || 'N/A'}</span></div>
            <div><span style="color: #64748b;">BANDS:</span> <span style="color: #38bdf8;">${img.bands || 'N/A'}</span></div>
            <div><span style="color: #64748b;">EPSG:</span> <span style="color: #fbbf24;">${img.epsg || 'WGS84'}</span></div>
            <div><span style="color: #64748b;">SIZE:</span> <span style="color: #e2e8f0;">${(img.fileSize / 1024).toFixed(0)} KB</span></div>
          </div>
          ${
            img.enhancedFilePath
              ? `<div style="margin-top: 6px; padding: 4px 6px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 4px; color: #a7f3d0; font-size: 9px;">
                  ✨ Enhanced with OpenCV CLAHE & Sharpening
                 </div>`
              : ''
          }
        </div>
      `;
      rect.bindPopup(popupHtml);

      // Tooltip on Hover
      rect.bindTooltip(
        `<div class="font-mono text-xs">
          <div class="font-bold text-cyan-300">Raster #${img.id}: ${img.filename}</div>
          <div class="text-slate-300">${img.width ? `${img.width}×${img.height} px • ${img.bands} Bands` : 'Satellite Coverage Extent'}</div>
          <div class="text-amber-300 text-[10px]">${img.epsg ? `EPSG:${img.epsg}` : 'Georeferenced'} • ${img.status}</div>
        </div>`,
        { sticky: true }
      );

      imageryBboxGroupRef.current?.addLayer(rect);

      // Add Glowing Corner Reticles for Selected Imagery
      if (isSelected) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const nw = bounds.getNorthWest();
        const se = bounds.getSouthEast();

        [sw, ne, nw, se].forEach((corner) => {
          const marker = L.circleMarker(corner, {
            radius: 5,
            color: '#00f2ff',
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 2,
          });
          imageryBboxGroupRef.current?.addLayer(marker);
        });
      }
    });
  }, [uploadedImageryList, selectedImagery, showImageryBbox, imageryOpacity, activeAOI]);

  // Render Vector Layers (AOI, Parcels, Buildings, Roads, Land Cover, Confidence)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. AOI Boundary
    if (aoiGroupRef.current) {
      aoiGroupRef.current.clearLayers();
      if (layers.aoiBoundary) {
        const bounds = L.latLngBounds(activeAOI.bounds);
        const rect = L.rectangle(bounds, {
          color: '#22d3ee',
          weight: 2,
          dashArray: '5, 5',
          fillColor: '#0891b2',
          fillOpacity: 0.05,
        });
        rect.bindTooltip(`AOI: ${activeAOI.name}`, { sticky: true });
        aoiGroupRef.current.addLayer(rect);
      }
    }

    // 2. Parcels
    const parcels = PARCELS_DATA[activeAOI.id] || [];
    if (parcelGroupRef.current) {
      parcelGroupRef.current.clearLayers();
      if (layers.parcels) {
        parcels.forEach((parcel) => {
          const isSelected = selectedParcel?.id === parcel.id;
          const polygon = L.polygon(parcel.coordinates as [number, number][], {
            color: isSelected ? '#38bdf8' : '#10b981',
            weight: isSelected ? 3 : 1.5,
            fillColor: isSelected ? '#38bdf8' : '#059669',
            fillOpacity: layers.layerOpacity.parcels * (isSelected ? 0.35 : 0.15),
          });

          polygon.on('click', () => {
            onSelectParcel(parcel);
          });

          polygon.bindTooltip(
            `<div class="font-mono text-xs">
              <div class="font-bold text-cyan-300">${parcel.cadastralCode}</div>
              <div class="text-slate-300">Zoning: ${parcel.zoning}</div>
              <div class="text-slate-300">Area: ${parcel.areaHectares} ha</div>
            </div>`,
            { sticky: true }
          );

          parcelGroupRef.current?.addLayer(polygon);
        });
      }
    }

    // 3. Buildings
    const buildings = BUILDINGS_DATA[activeAOI.id] || [];
    if (buildingGroupRef.current) {
      buildingGroupRef.current.clearLayers();
      if (layers.buildings) {
        buildings.forEach((bld) => {
          const bounds = L.latLngBounds(bld.bounds as [[number, number], [number, number]]);
          const rect = L.rectangle(bounds, {
            color: '#fbbf24',
            weight: 1.5,
            fillColor: '#f59e0b',
            fillOpacity: 0.45,
          });

          rect.bindTooltip(
            `<div class="font-mono text-xs">
              <div class="font-bold text-amber-300">${bld.type.toUpperCase()}</div>
              <div>Footprint: ${bld.areaM2} m²</div>
            </div>`,
            { sticky: true }
          );

          buildingGroupRef.current?.addLayer(rect);
        });
      }
    }

    // 4. Roads
    const roads = ROADS_DATA[activeAOI.id] || [];
    if (roadGroupRef.current) {
      roadGroupRef.current.clearLayers();
      if (layers.roads) {
        roads.forEach((road) => {
          const polyline = L.polyline(road.coordinates, {
            color: '#06b6d4',
            weight: road.type === 'arterial' ? 3.5 : 2,
            opacity: 0.85,
            dashArray: road.type === 'unpaved' ? '4, 4' : undefined,
          });
          roadGroupRef.current?.addLayer(polyline);
        });
      }
    }

    // 5. Land Cover
    if (landCoverGroupRef.current) {
      landCoverGroupRef.current.clearLayers();
      if (layers.landCover) {
        const [cLat, cLng] = activeAOI.center;
        const patches = [
          {
            coords: [
              [cLat + 0.008, cLng - 0.015],
              [cLat + 0.014, cLng - 0.006],
              [cLat + 0.009, cLng + 0.002],
              [cLat + 0.004, cLng - 0.008],
            ],
            color: '#10b981',
            name: 'Tree Canopy',
          },
          {
            coords: [
              [cLat - 0.004, cLng + 0.006],
              [cLat + 0.003, cLng + 0.014],
              [cLat - 0.008, cLng + 0.018],
              [cLat - 0.012, cLng + 0.008],
            ],
            color: '#2dd4bf',
            name: 'Cropland',
          },
        ];

        patches.forEach((patch) => {
          const poly = L.polygon(patch.coords as [number, number][], {
            color: patch.color,
            weight: 1,
            fillColor: patch.color,
            fillOpacity: layers.layerOpacity.landCover * 0.35,
          });
          poly.bindTooltip(patch.name, { sticky: true });
          landCoverGroupRef.current?.addLayer(poly);
        });
      }
    }

    // 6. Confidence Map
    if (confidenceGroupRef.current) {
      confidenceGroupRef.current.clearLayers();
      if (layers.confidenceMap) {
        const [cLat, cLng] = activeAOI.center;
        const confCircle = L.circle([cLat + 0.002, cLng + 0.002], {
          radius: 800,
          color: '#38bdf8',
          weight: 1,
          dashArray: '3, 3',
          fillColor: '#0284c7',
          fillOpacity: layers.layerOpacity.confidence * 0.25,
        });
        confidenceGroupRef.current.addLayer(confCircle);
      }
    }
  }, [activeAOI, layers, selectedParcel]);

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(activeAOI.center, activeAOI.zoom, { duration: 1.2 });
  };

  return (
    <div className="relative flex-1 w-full h-full min-h-0 min-w-0 bg-[#080D1A] overflow-hidden select-none">
      {/* Leaflet Map DOM Host Container */}
      <div
        ref={mapContainerRef}
        id="leaflet-gis-map-canvas"
        className="w-full h-full min-h-[300px] relative z-0"
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
      />

      {/* Top-Left: Left Panel Toggle */}
      {onToggleLeftPanel && (
        <div className="absolute top-3 left-12 z-20 flex items-center">
          <button
            onClick={onToggleLeftPanel}
            aria-label={showLeftPanel ? 'Collapse Controls Panel' : 'Expand Controls Panel'}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans active:scale-95"
            title={showLeftPanel ? 'Collapse Panel' : 'Expand Panel'}
          >
            {showLeftPanel ? <PanelLeftClose className="w-3.5 h-3.5 text-cyan-400" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline text-[11px] font-medium">
              {showLeftPanel ? 'Hide Panel' : 'Imagery & Controls'}
            </span>
          </button>
        </div>
      )}

      {/* Top-Right: Unified Basemap Selector, Layer Menu & Right Panel Toggle */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Uploaded BBox Toggle Action */}
        {onToggleImageryBbox && (
          <button
            onClick={onToggleImageryBbox}
            className={`p-2 rounded-xl glass-panel text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border ${
              showImageryBbox
                ? 'border-cyan-400/50 text-cyan-300 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Uploaded Imagery Bounding Box Overlay"
          >
            {showImageryBbox ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">Imagery BBox</span>
          </button>
        )}

        {/* Reset View Action */}
        <button
          onClick={handleResetView}
          className="p-2 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex items-center gap-1 text-xs"
          title="Reset View to AOI Extent"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Reset Extent</span>
        </button>

        {/* Basemap Switcher */}
        <div className="flex items-center glass-panel rounded-xl p-1 text-xs font-sans shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-cyan-500/20">
          <button
            onClick={() => onChangeBaseType && onChangeBaseType('satellite')}
            aria-label="Switch to Satellite Basemap"
            className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              layers.baseType === 'satellite'
                ? 'bg-cyan-950/80 text-cyan-200 font-semibold border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => onChangeBaseType && onChangeBaseType('dark')}
            aria-label="Switch to Dark Canvas Basemap"
            className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              layers.baseType === 'dark'
                ? 'bg-cyan-950/80 text-cyan-200 font-semibold border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark Canvas
          </button>
          <button
            onClick={() => onChangeBaseType && onChangeBaseType('topo')}
            aria-label="Switch to Topographic Basemap"
            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              layers.baseType === 'topo'
                ? 'bg-cyan-950/80 text-cyan-200 font-semibold border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Topo
          </button>
        </div>

        {/* Right Panel Toggle */}
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            aria-label={showRightPanel ? 'Collapse Analysis Panel' : 'Expand Analysis Panel'}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans active:scale-95"
            title={showRightPanel ? 'Collapse Analysis' : 'Expand Analysis'}
          >
            <span className="hidden xl:inline text-[11px] font-medium">
              {showRightPanel ? 'Hide Analysis' : 'Analysis'}
            </span>
            {showRightPanel ? <PanelRightClose className="w-3.5 h-3.5 text-cyan-400" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Selected Imagery Banner Indicator (Top-Center Floating Badge) */}
      {selectedImagery && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="glass-panel px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-cyan-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_15px_rgba(6,182,212,0.25)] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-400 text-[10px]">ACTIVE RASTER:</span>
            <span className="text-cyan-300 font-bold max-w-[160px] sm:max-w-[240px] truncate">
              #{selectedImagery.id} {selectedImagery.filename}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {selectedImagery.status}
            </span>
          </div>
        </div>
      )}

      {/* Bottom-Left: Live Map Projection & Telemetry Badge */}
      <div className="absolute bottom-3 left-14 z-20 glass-panel rounded-xl px-3 py-1 text-[11px] text-slate-400 flex items-center gap-2 pointer-events-none font-mono shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-cyan-500/20">
        <Compass className="w-3 h-3 text-cyan-400" />
        <span>EPSG:{selectedImagery?.epsg || '4326 (WGS84)'}</span>
        <span className="text-slate-600">|</span>
        <span>Z: {currentZoom}</span>
      </div>

      {/* Bottom-Right: Lat/Lng Coordinates Readout */}
      <div className="absolute bottom-3 right-3 z-20 glass-panel rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2.5 pointer-events-none font-mono shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-cyan-500/20">
        <span className="status-dot-static text-cyan-400" />
        <span className="text-cyan-300 font-medium">{formatCoordinates(mouseCoords.lat, mouseCoords.lng)}</span>
      </div>
    </div>
  );
};
