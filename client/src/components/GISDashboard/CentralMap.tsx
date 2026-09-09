import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaOfInterest, MapLayerState, Parcel, SpectralBand } from '../../types';
import { PARCELS_DATA, BUILDINGS_DATA, ROADS_DATA } from '../../data/geospatialData';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface CentralMapProps {
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
}

export const CentralMap: React.FC<CentralMapProps> = ({
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

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number }>({
    lat: activeAOI.center[0],
    lng: activeAOI.center[1],
  });

  // Initialize Map
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

    // Layer groups
    aoiGroupRef.current = L.layerGroup().addTo(map);
    parcelGroupRef.current = L.layerGroup().addTo(map);
    buildingGroupRef.current = L.layerGroup().addTo(map);
    roadGroupRef.current = L.layerGroup().addTo(map);
    landCoverGroupRef.current = L.layerGroup().addTo(map);
    confidenceGroupRef.current = L.layerGroup().addTo(map);

    // Mouse coordinate tracker
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapInstanceRef.current = map;

    // ResizeObserver to ensure Leaflet handles container resizing immediately
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    // Ensure size calculation is triggered after initial layout
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Proactively invalidate Leaflet size whenever sidebar visibility toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize({ pan: false });
    const t1 = setTimeout(() => map.invalidateSize({ pan: false }), 50);
    const t2 = setTimeout(() => map.invalidateSize({ pan: false }), 150);
    const t3 = setTimeout(() => map.invalidateSize({ pan: false }), 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showLeftPanel, showRightPanel]);

  // Update Base Tile Layer on layer state changes
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
    setTimeout(() => map.invalidateSize(), 50);
  }, [activeAOI]);

  // Draw Vector Layers (AOI, Parcels, Buildings, Roads, Land Cover, Confidence)
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
              <div class="text-slate-400 text-[10px] mt-0.5">${parcel.changeDetected.hasChange ? 'Change detected' : 'No change'}</div>
            </div>`,
            { sticky: true }
          );

          parcelGroupRef.current?.addLayer(polygon);
        });
      }
    }

    // 3. Buildings (YOLOv11)
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
              <div>Confidence: ${(bld.confidence * 100).toFixed(0)}% (Demo)</div>
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

          polyline.bindTooltip(
            `<div class="font-mono text-xs">
              <div class="font-bold text-cyan-300">Road (${road.type})</div>
              <div>Length: ${road.lengthM}m</div>
            </div>`,
            { sticky: true }
          );

          roadGroupRef.current?.addLayer(polyline);
        });
      }
    }

    // 5. U-Net Land Cover Overlay
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
          {
            coords: [
              [cLat - 0.014, cLng - 0.012],
              [cLat - 0.006, cLng - 0.004],
              [cLat - 0.012, cLng + 0.002],
              [cLat - 0.018, cLng - 0.005],
            ],
            color: '#06b6d4',
            name: 'Water Body',
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

    // 6. Confidence Mapping Layer
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
        confCircle.bindTooltip('Confidence Index (Demo Result)', { sticky: true });
        confidenceGroupRef.current.addLayer(confCircle);
      }
    }
  }, [activeAOI, layers, selectedParcel]);

  return (
    <div className="relative flex-1 w-full h-full min-h-0 min-w-0 bg-[#080D1A] overflow-hidden select-none">
      {/* Real Leaflet Map Container with explicit defined dimensions */}
      <div
        ref={mapContainerRef}
        id="leaflet-map-container"
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
            title={showLeftPanel ? 'Collapse Controls Panel' : 'Expand Controls Panel'}
          >
            {showLeftPanel ? <PanelLeftClose className="w-3.5 h-3.5 text-cyan-400" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline text-[11px] font-medium">
              {showLeftPanel ? 'Hide Controls' : 'Controls'}
            </span>
          </button>
        </div>
      )}

      {/* Top-Right: Unified Basemap Selector & Right Panel Toggle */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Basemap Toggle */}
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
        </div>

        {/* Right Panel Toggle */}
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            aria-label={showRightPanel ? 'Collapse Analysis Panel' : 'Expand Analysis Panel'}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans active:scale-95"
            title={showRightPanel ? 'Collapse Analysis Panel' : 'Expand Analysis Panel'}
          >
            <span className="hidden xl:inline text-[11px] font-medium">
              {showRightPanel ? 'Hide Analysis' : 'Analysis'}
            </span>
            {showRightPanel ? <PanelRightClose className="w-3.5 h-3.5 text-cyan-400" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Bottom-Right: Lat/Lng Coordinate Readout with Live Telemetry Beacon */}
      <div className="absolute bottom-3 right-3 z-20 glass-panel rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2.5 pointer-events-none font-mono shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-cyan-500/20">
        <span className="status-dot-static text-cyan-400" />
        <span className="text-cyan-300 font-medium">{mouseCoords.lat.toFixed(4)}°N</span>
        <span className="text-slate-500">|</span>
        <span className="text-cyan-300 font-medium">{mouseCoords.lng.toFixed(4)}°E</span>
      </div>
    </div>
  );
};
