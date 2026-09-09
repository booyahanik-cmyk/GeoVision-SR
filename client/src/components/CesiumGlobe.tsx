import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { AreaOfInterest } from '../types';
import { AREAS_OF_INTEREST } from '../data/geospatialData';
import { RotateCw, Compass } from 'lucide-react';

// Configure Cesium base URL for Workers & Assets from reliable high-speed CDN
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = 'https://cdn.jsdelivr.net/npm/cesium@1.126.0/Build/Cesium/';
}

interface CesiumGlobeProps {
  onSelectAOI?: (aoi: AreaOfInterest) => void;
  onLaunchAnalysis?: (aoi?: AreaOfInterest) => void;
  selectedAOI?: AreaOfInterest;
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
  onSelectAOI,
  onLaunchAnalysis,
  selectedAOI,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const isRotatingRef = useRef<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [activeAOIId, setActiveAOIId] = useState<string>(selectedAOI?.id || AREAS_OF_INTEREST[0].id);

  // Sync with selectedAOI from parent
  useEffect(() => {
    if (selectedAOI && selectedAOI.id !== activeAOIId) {
      setActiveAOIId(selectedAOI.id);
      flyToAOI(selectedAOI);
    }
  }, [selectedAOI?.id]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create high-resolution Earth satellite imagery layer (Esri World Imagery)
    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 18,
      credit: 'Copernicus Sentinel / Esri / NASA Earthdata',
    });

    // Initialize Cesium Viewer with clean scientific institutional aesthetics
    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: new Cesium.ImageryLayer(imageryProvider),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      selectionIndicator: false,
      timeline: false,
      animation: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      scene3DOnly: true,
      shouldAnimate: true,
    });

    viewerRef.current = viewer;

    // Configure dark space & atmosphere visuals
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#060A14');
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#060A14');
    viewer.scene.globe.enableLighting = false; // uniform scientific illumination
    viewer.scene.globe.depthTestAgainstTerrain = false;

    // Atmosphere styling
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.skyAtmosphere.brightnessShift = 0.05;
      viewer.scene.skyAtmosphere.saturationShift = 0.1;
    }

    // Majestic perspective framing the complete Earth as a prominent hero sphere within the right column
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(16.0, 30.0, 9200000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-88),
        roll: 0,
      },
    });

    // Add subtle visual marker pins for the Sentinel-2 AOIs
    const entities: Cesium.Entity[] = [];

    AREAS_OF_INTEREST.forEach((aoi) => {
      const lat = aoi.center[0];
      const lon = aoi.center[1];

      const entity = viewer.entities.add({
        id: aoi.id,
        name: aoi.name,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 10000),
        point: {
          pixelSize: 6,
          color: Cesium.Color.fromCssColorString('#22D3EE'),
          outlineColor: Cesium.Color.fromCssColorString('#080D1A'),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      entities.push(entity);
    });

    // Setup interactive entity click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
      const pickedObject = viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && typeof pickedObject.id.id === 'string') {
        const matchingAOI = AREAS_OF_INTEREST.find((a) => a.id === pickedObject.id.id);
        if (matchingAOI) {
          setActiveAOIId(matchingAOI.id);
          flyToAOI(matchingAOI);
          if (onSelectAOI) onSelectAOI(matchingAOI);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Track user mouse drag to temporarily stop auto-rotation
    handler.setInputAction(() => {
      isRotatingRef.current = false;
      setIsRotating(false);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Continuous auto-rotation on tick
    const onTickListener = () => {
      if (isRotatingRef.current) {
        viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0005);
      }
    };

    viewer.clock.onTick.addEventListener(onTickListener);

    // ResizeObserver ensures Cesium canvas immediately adapts to container dimensions
    const resizeObserver = new ResizeObserver(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.resize();
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      viewer.clock.onTick.removeEventListener(onTickListener);
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  const flyToAOI = (aoi: AreaOfInterest) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    setActiveAOIId(aoi.id);
    isRotatingRef.current = false;
    setIsRotating(false);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        aoi.center[1],
        aoi.center[0] - 0.4,
        650000
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0,
      },
      duration: 2.2,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  };

  const toggleRotation = () => {
    const next = !isRotating;
    isRotatingRef.current = next;
    setIsRotating(next);
  };

  const resetGlobeView = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(16.0, 30.0, 9200000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-88),
        roll: 0,
      },
      duration: 1.8,
    });
  };

  const currentAOI = AREAS_OF_INTEREST.find((a) => a.id === activeAOIId) || AREAS_OF_INTEREST[0];

  return (
    <div className="relative w-full h-full bg-[#060A14] overflow-hidden select-none">
      {/* Real Cesium Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* Subtle Minimal Globe Controls (Top-Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 glass-panel p-1 rounded-xl z-10 font-sans shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-cyan-500/20">
        {/* Reset Camera */}
        <button
          onClick={resetGlobeView}
          title="Reset camera view"
          aria-label="Reset 3D Earth camera view"
          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>

        {/* Play / Pause Rotation */}
        <button
          onClick={toggleRotation}
          title={isRotating ? "Pause rotation" : "Rotate Earth"}
          aria-label={isRotating ? "Pause Earth rotation" : "Start Earth rotation"}
          className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
            isRotating ? 'text-cyan-400 bg-cyan-950/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>
      </div>
    </div>
  );
};

