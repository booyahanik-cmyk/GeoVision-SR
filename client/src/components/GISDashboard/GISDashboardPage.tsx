import React, { useState, useRef, useEffect } from 'react';
import { AreaOfInterest, PreprocessingOptions, MapLayerState, SpectralBand, Parcel, ScreenType, ImageryResponseDto } from '../../types';
import { LeftControlPanel } from './LeftControlPanel';
import { MapLayerManager } from './MapLayerManager';
import { ImageryLayerPanel } from './ImageryLayerPanel';
import { RightAnalysisPanel } from './RightAnalysisPanel';
import { UploadModal } from '../UploadModal';
import { imageryService } from '../../services/imageryService';
import { BeforeAfterViewer } from '../Imagery/BeforeAfterViewer';
import { 
  Layers, 
  Database, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  RotateCw, 
  X, 
  Info, 
  Compass, 
  FileCode,
  ArrowLeftRight
} from 'lucide-react';

export interface GISDashboardPageProps {
  activeAOI: AreaOfInterest;
  aoiList?: AreaOfInterest[];
  onSelectAOI: (aoi: AreaOfInterest) => void;
  onAddCustomAOI?: (customAOI: AreaOfInterest) => void;
  onSelectScreen: (screen: ScreenType) => void;
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel | null) => void;
  initialSelectedImageryId?: number | null;
}

export const GISDashboardPage: React.FC<GISDashboardPageProps> = ({
  activeAOI,
  aoiList,
  onSelectAOI,
  onAddCustomAOI,
  onSelectScreen,
  selectedParcel,
  onSelectParcel,
  initialSelectedImageryId = null,
}) => {
  // Preprocessing & Spectral Band State
  const [selectedBand, setSelectedBand] = useState<SpectralBand>('true-color');
  const [preprocessing, setPreprocessing] = useState<PreprocessingOptions>({
    cloudRemoval: true,
    noiseReduction: true,
    imageClipping: true,
    bandSelection: true,
    resampling: true,
    imageNormalization: true,
  });

  // Map Layers State
  const [layers, setLayers] = useState<MapLayerState>({
    satelliteBase: true,
    baseType: 'satellite',
    aoiBoundary: true,
    parcels: true,
    buildings: true,
    roads: true,
    landCover: true,
    confidenceMap: false,
    layerOpacity: {
      satellite: 1,
      landCover: 0.65,
      confidence: 0.5,
      parcels: 0.7,
    },
  });

  // Phase 5: Ingested Imagery State
  const [uploadedImageryList, setUploadedImageryList] = useState<ImageryResponseDto[]>([]);
  const [isImageryLoading, setIsImageryLoading] = useState<boolean>(true);
  const [selectedImagery, setSelectedImagery] = useState<ImageryResponseDto | null>(null);
  const [showImageryBbox, setShowImageryBbox] = useState<boolean>(true);
  const [leftTab, setLeftTab] = useState<'imagery' | 'gis-layers'>('imagery');

  // Phase 6: Before vs After Comparison State
  const [comparisonImagery, setComparisonImagery] = useState<ImageryResponseDto | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);

  const handleOpenComparison = (img: ImageryResponseDto) => {
    setComparisonImagery(img);
    setIsComparisonOpen(true);
  };

  // AI Analysis simulation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Responsive layout state
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [showLeftPanel, setShowLeftPanel] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [showRightPanel, setShowRightPanel] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
  );

  // Fetch Uploaded Imagery from Backend API
  const fetchUploadedImagery = async () => {
    setIsImageryLoading(true);
    try {
      const data = await imageryService.getAllImagery();
      setUploadedImageryList(data);

      // Auto-select if requested or pick first item if none selected
      if (initialSelectedImageryId) {
        const found = data.find((item) => item.id === initialSelectedImageryId);
        if (found) setSelectedImagery(found);
      } else if (!selectedImagery && data.length > 0) {
        setSelectedImagery(data[0]);
      }
    } catch (err) {
      console.error('Failed to load ingested imagery for GIS dashboard:', err);
    } finally {
      setIsImageryLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadedImagery();
  }, [initialSelectedImageryId]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setShowLeftPanel(false);
        setShowRightPanel(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Analysis cleanup
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  const handleTogglePreprocessing = (key: keyof PreprocessingOptions) => {
    setPreprocessing((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleLayer = (key: keyof Omit<MapLayerState, 'layerOpacity' | 'baseType'>) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangeOpacity = (key: keyof MapLayerState['layerOpacity'], value: number) => {
    setLayers((prev) => ({
      ...prev,
      layerOpacity: {
        ...prev.layerOpacity,
        [key]: value,
      },
    }));
  };

  const handleChangeBaseType = (baseType: 'satellite' | 'dark' | 'topo') => {
    setLayers((prev) => ({ ...prev, baseType }));
  };

  const handleRunAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    setIsAnalyzing(true);
    setAnalysisProgress(10);

    analysisIntervalRef.current = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
          setIsAnalyzing(false);
          setLayers((l) => ({ ...l, confidenceMap: true, landCover: true, buildings: true }));
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

  // User Actions: Open Imagery on Map
  const handleOpenImageryOnMap = (imagery: ImageryResponseDto) => {
    setSelectedImagery(imagery);
    setShowImageryBbox(true);
    // On mobile, close left panel to view map
    if (isMobile) {
      setShowLeftPanel(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 min-w-0 flex overflow-hidden relative bg-[#080D1A]">
      {/* Mobile Backdrop Click-to-Dismiss */}
      {isMobile && (showLeftPanel || showRightPanel) && (
        <div 
          onClick={() => { setShowLeftPanel(false); setShowRightPanel(false); }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Left Dual-Tab Navigation Panel */}
      {showLeftPanel && (
        <div className={isMobile ? "fixed top-14 bottom-0 left-0 z-40 max-w-[85vw] shadow-2xl flex flex-col" : "h-full z-10 flex flex-col shrink-0"}>
          {/* Dual Mode Sub-Navigation Tabs */}
          <div className="flex items-center bg-[#050914] border-b border-cyan-500/20 p-1.5 gap-1 shrink-0">
            <button
              onClick={() => setLeftTab('imagery')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                leftTab === 'imagery'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Imagery Catalog</span>
              {uploadedImageryList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-300">
                  {uploadedImageryList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setLeftTab('gis-layers')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                leftTab === 'gis-layers'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>GIS Overlays</span>
            </button>
          </div>

          {/* Active Panel View */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {leftTab === 'imagery' ? (
              <ImageryLayerPanel
                imageryList={uploadedImageryList}
                isLoading={isImageryLoading}
                selectedImagery={selectedImagery}
                onSelectImagery={setSelectedImagery}
                onOpenOnMap={handleOpenImageryOnMap}
                onOpenComparison={handleOpenComparison}
                onRefreshList={fetchUploadedImagery}
                showBbox={showImageryBbox}
                onToggleBbox={() => setShowImageryBbox((prev) => !prev)}
                onOpenUploadModal={() => setIsUploadOpen(true)}
              />
            ) : (
              <LeftControlPanel
                activeAOI={activeAOI}
                aoiList={aoiList}
                onSelectAOI={onSelectAOI}
                selectedBand={selectedBand}
                onSelectBand={setSelectedBand}
                preprocessing={preprocessing}
                onTogglePreprocessing={handleTogglePreprocessing}
                layers={layers}
                onToggleLayer={handleToggleLayer}
                onChangeOpacity={handleChangeOpacity}
                onChangeBaseType={handleChangeBaseType}
                onRunAnalysis={handleRunAnalysis}
                isAnalyzing={isAnalyzing}
                analysisProgress={analysisProgress}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Central Interactive Leaflet Map Layer Manager */}
      <div className="flex-1 flex flex-col relative h-full w-full min-w-0 min-h-0 overflow-hidden z-0">
        <MapLayerManager
          activeAOI={activeAOI}
          layers={layers}
          selectedBand={selectedBand}
          selectedParcel={selectedParcel}
          onSelectParcel={onSelectParcel}
          onChangeBaseType={handleChangeBaseType}
          showLeftPanel={showLeftPanel}
          onToggleLeftPanel={() => {
            if (isMobile && !showLeftPanel) setShowRightPanel(false);
            setShowLeftPanel((prev) => !prev);
          }}
          showRightPanel={showRightPanel}
          onToggleRightPanel={() => {
            if (isMobile && !showRightPanel) setShowLeftPanel(false);
            setShowRightPanel((prev) => !prev);
          }}
          uploadedImageryList={uploadedImageryList}
          selectedImagery={selectedImagery}
          onSelectImagery={setSelectedImagery}
          showImageryBbox={showImageryBbox}
          onToggleImageryBbox={() => setShowImageryBbox((prev) => !prev)}
        />
      </div>

      {/* Right Analysis & Imagery Telemetry Panel */}
      {showRightPanel && (
        <div className={isMobile ? "fixed top-14 bottom-0 right-0 z-40 max-w-[85vw] shadow-2xl" : "h-full z-10 shrink-0"}>
          <div className="h-full flex flex-col">
            {/* If imagery is selected, display rich metadata readout at top of right panel */}
            {selectedImagery && (
              <div className="p-3.5 bg-[#070C1A] border-b border-cyan-500/20 text-xs font-sans space-y-2 select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Selected Raster Metadata</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-400/40 text-cyan-300">
                    #{selectedImagery.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300 bg-black/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="col-span-2 truncate">
                    <span className="text-slate-500 block text-[9px]">SOURCE FILENAME</span>
                    <span className="text-cyan-200 font-bold truncate block">{selectedImagery.filename}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">RESOLUTION</span>
                    <span className="text-emerald-300">
                      {selectedImagery.width && selectedImagery.height ? `${selectedImagery.width} × ${selectedImagery.height}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">SPECTRAL BANDS</span>
                    <span className="text-cyan-300">{selectedImagery.bands || 1} Bands</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">CRS / EPSG</span>
                    <span className="text-amber-300">EPSG:{selectedImagery.epsg || '4326'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">STATUS</span>
                    <span className="text-slate-200 font-bold">{selectedImagery.status}</span>
                  </div>
                  {selectedImagery.bbox && (
                    <div className="col-span-2 truncate">
                      <span className="text-slate-500 block text-[9px]">BOUNDING BOX EXTENT</span>
                      <span className="text-slate-400 text-[9px] truncate block font-mono">{selectedImagery.bbox}</span>
                    </div>
                  )}
                </div>

                {/* Phase 6: Launch Before/After Slider Button */}
                {selectedImagery.status === 'PROCESSED' && (
                  <button
                    type="button"
                    onClick={() => handleOpenComparison(selectedImagery)}
                    className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 hover:brightness-125 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer active:scale-[0.99]"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Launch Before / After Slider</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto">
              <RightAnalysisPanel
                activeAOI={activeAOI}
                selectedParcel={selectedParcel}
                onSelectScreen={onSelectScreen}
                onSelectParcel={onSelectParcel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Satellite Ingest Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(newAOI) => {
          fetchUploadedImagery();
          if (onAddCustomAOI) {
            onAddCustomAOI(newAOI);
          } else {
            onSelectAOI(newAOI);
          }
        }}
      />

      {/* Phase 6: Interactive Before vs After Comparison Modal */}
      {isComparisonOpen && comparisonImagery && (
        <BeforeAfterViewer
          isModal={true}
          onClose={() => setIsComparisonOpen(false)}
          imageryId={comparisonImagery.id}
          imageryTitle={`Before vs After Comparison • ${comparisonImagery.filename}`}
          metadata={{
            width: comparisonImagery.width,
            height: comparisonImagery.height,
            bands: comparisonImagery.bands,
            epsg: comparisonImagery.epsg,
            status: comparisonImagery.status,
          }}
        />
      )}
    </div>
  );
};
