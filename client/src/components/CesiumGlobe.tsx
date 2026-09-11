import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import { AreaOfInterest } from '../types';
import { AREAS_OF_INTEREST } from '../data/geospatialData';
import { RotateCw, Compass } from 'lucide-react';

// Configure Cesium base URL for Workers & Assets from matching CDN version
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = 'https://cdn.jsdelivr.net/npm/cesium@1.145.0/Build/Cesium/';
}

interface CesiumGlobeProps {
  onSelectAOI?: (aoi: AreaOfInterest) => void;
  onLaunchAnalysis?: (aoi?: AreaOfInterest) => void;
  selectedAOI?: AreaOfInterest;
}

const CesiumGlobeComponent: React.FC<CesiumGlobeProps> = ({
  onSelectAOI,
  selectedAOI,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const isRotatingRef = useRef<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [activeAOIId, setActiveAOIId] = useState<string>(selectedAOI?.id || AREAS_OF_INTEREST[0].id);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Smooth camera fly-to function
  const flyToAOI = useCallback((aoi: AreaOfInterest) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

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
      duration: 1.8,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, []);

  // Sync with selectedAOI from parent when changed externally
  useEffect(() => {
    if (selectedAOI && selectedAOI.id !== activeAOIId) {
      flyToAOI(selectedAOI);
    }
  }, [selectedAOI?.id, flyToAOI]);

  useEffect(() => {
    if (!containerRef.current) return;

    // High-performance Earth satellite imagery layer (Esri World Imagery)
    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 14, // Capped to level 14 to avoid deep tile quadtree thrashing from orbit
      credit: 'Copernicus Sentinel / Esri / NASA Earthdata',
    });

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Initialize Cesium Viewer with request-render mode and optimized render pipeline
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
      shouldAnimate: false, // Animation loop handled efficiently via requestAnimationFrame
      requestRenderMode: true, // Only render frames when changes occur (massive GPU/battery savings)
      maximumRenderTimeChange: Infinity,
      orderIndependentTranslucency: false, // Saves 2-3 blending passes per frame
      creditContainer: document.createElement('div'), // Offscreen credit container removes ion logo
      contextOptions: {
        webgl: {
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        },
      },
    });

    if (viewer.bottomContainer) {
      (viewer.bottomContainer as HTMLElement).style.display = 'none';
    }

    viewerRef.current = viewer;

    // Device Pixel Ratio scaling:
    // On high-DPI/Retina screens (DPR >= 1.5 or 2), cap resolution scale to prevent 4K backbuffer fill-rate choking
    viewer.resolutionScale = dpr > 1 ? Math.min(1.0, 1.25 / dpr) : 1.0;

    // Ensure all standard Cesium camera controller interactions are fully enabled
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableInputs = true;
    controller.enableZoom = true;
    controller.enableRotate = true;
    controller.enableTilt = true;
    controller.enableTranslate = true;
    controller.enableLook = true;

    // High-precision camera change detection for requestRenderMode
    viewer.camera.percentageChanged = 0.001;

    // Optimize scene and globe pipeline
    const scene = viewer.scene;
    const globe = scene.globe;

    scene.backgroundColor = Cesium.Color.fromCssColorString('#060A14');
    globe.baseColor = Cesium.Color.fromCssColorString('#060A14');
    globe.enableLighting = false; // Uniform scientific illumination
    globe.depthTestAgainstTerrain = false;

    // Quadtree & memory limits to eliminate GC stutter:
    globe.tileCacheSize = 100;
    globe.maximumScreenSpaceError = 2.5;

    // Eliminate expensive ground-atmosphere surface shading pass while keeping the glowing horizon rim
    globe.showGroundAtmosphere = false;

    // Disable fog calculation in space
    if (scene.fog) {
      scene.fog.enabled = false;
    }

    // Atmosphere styling on space limb
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.brightnessShift = 0.05;
      scene.skyAtmosphere.saturationShift = 0.1;
    }

    // Initial camera view framing the Earth
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(16.0, 30.0, 9200000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-88),
        roll: 0,
      },
    });
    viewer.scene.requestRender();

    // Add subtle visual marker pins for the Sentinel-2 AOIs
    AREAS_OF_INTEREST.forEach((aoi) => {
      const lat = aoi.center[0];
      const lon = aoi.center[1];

      viewer.entities.add({
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
    });

    // Setup interactive entity click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
      const pickedObject = viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && typeof pickedObject.id.id === 'string') {
        const matchingAOI = AREAS_OF_INTEREST.find((a) => a.id === pickedObject.id.id);
        if (matchingAOI) {
          flyToAOI(matchingAOI);
          if (onSelectAOI) onSelectAOI(matchingAOI);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Camera motion lifecycle listeners to continuously drive rendering during gestures & inertia
    let isCameraMoving = false;
    let cameraMovingTimeout: ReturnType<typeof setTimeout> | null = null;

    const onCameraMoveStart = () => {
      isCameraMoving = true;
    };

    const onCameraMoveEnd = () => {
      if (cameraMovingTimeout) clearTimeout(cameraMovingTimeout);
      cameraMovingTimeout = setTimeout(() => {
        isCameraMoving = false;
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.scene.requestRender();
        }
      }, 80);
    };

    const onCameraChanged = () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.scene.requestRender();
      }
    };

    const removeMoveStart = viewer.camera.moveStart.addEventListener(onCameraMoveStart);
    const removeMoveEnd = viewer.camera.moveEnd.addEventListener(onCameraMoveEnd);
    const removeCameraChanged = viewer.camera.changed.addEventListener(onCameraChanged);

    // Track user mouse/touch interactions to pause auto-rotation immediately
    handler.setInputAction(() => {
      isRotatingRef.current = false;
      setIsRotating(false);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction(() => {
      isRotatingRef.current = false;
      setIsRotating(false);
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

    handler.setInputAction(() => {
      isRotatingRef.current = false;
      setIsRotating(false);
    }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);

    handler.setInputAction(() => {
      isRotatingRef.current = false;
      setIsRotating(false);
    }, Cesium.ScreenSpaceEventType.PINCH_START);

    // Explicit native wheel handler on canvas:
    // 1. Prevents page scrolling so trackpad/wheel purely controls Cesium camera
    // 2. Pauses auto-rotation so user zoom takes immediate priority
    // 3. Wakes up the render loop immediately to guarantee smooth zoom rendering
    const canvas = viewer.scene.canvas;
    let wheelSettleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isRotatingRef.current) {
        isRotatingRef.current = false;
        setIsRotating(false);
      }

      isCameraMoving = true;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.scene.requestRender();
      }

      if (wheelSettleTimeout) clearTimeout(wheelSettleTimeout);
      wheelSettleTimeout = setTimeout(() => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.scene.requestRender();
        }
      }, 250);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Demand-driven render loop: drives frame renders during auto-rotation or active camera movement/inertia
    // Completely idle (0 renders, 0 GPU load) when globe is static
    let animFrameId: number | null = null;
    const renderLoop = () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        if (isRotatingRef.current) {
          viewerRef.current.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0004);
          viewerRef.current.scene.requestRender();
        } else if (isCameraMoving) {
          viewerRef.current.scene.requestRender();
        }
      }
      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    // Debounced ResizeObserver prevents rapid WebGL buffer reallocations during page transitions
    let resizeFrameId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.resize();
          viewerRef.current.scene.requestRender();
        }
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Dismiss loader once initial imagery loads or after 500ms safety timeout
    const loadTimeout = setTimeout(() => {
      setIsLoaded(true);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.scene.requestRender();
      }
    }, 500);

    return () => {
      clearTimeout(loadTimeout);
      if (cameraMovingTimeout) clearTimeout(cameraMovingTimeout);
      if (wheelSettleTimeout) clearTimeout(wheelSettleTimeout);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('wheel', handleWheel);
      removeMoveStart();
      removeMoveEnd();
      removeCameraChanged();
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, [flyToAOI, onSelectAOI]);

  const toggleRotation = () => {
    const next = !isRotating;
    isRotatingRef.current = next;
    setIsRotating(next);
    if (next && viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.requestRender();
    }
  };

  const resetGlobeView = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(16.0, 30.0, 9200000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-88),
        roll: 0,
      },
      duration: 1.5,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  };

  return (
    <div className="relative w-full h-full bg-[#060A14] overflow-hidden select-none">
      {/* Real Cesium Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* Lightweight Telemetry Loading Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#060A14] pointer-events-none transition-opacity duration-300 z-10">
          <div className="w-7 h-7 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-2" />
          <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase">
            Initializing Earth Telemetry...
          </span>
        </div>
      )}

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
          className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${isRotating ? 'text-cyan-400 bg-cyan-950/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>
      </div>
    </div>
  );
};

export const CesiumGlobe = React.memo(CesiumGlobeComponent);
