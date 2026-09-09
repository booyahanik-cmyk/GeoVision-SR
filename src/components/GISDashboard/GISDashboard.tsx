import React, { useState, useRef, useEffect } from 'react';
import { AreaOfInterest, PreprocessingOptions, MapLayerState, SpectralBand, Parcel, ScreenType } from '../../types';
import { LeftControlPanel } from './LeftControlPanel';
import { CentralMap } from './CentralMap';
import { RightAnalysisPanel } from './RightAnalysisPanel';
import { UploadModal } from '../UploadModal';

interface GISDashboardProps {
  activeAOI: AreaOfInterest;
  aoiList?: AreaOfInterest[];
  onSelectAOI: (aoi: AreaOfInterest) => void;
  onAddCustomAOI?: (customAOI: AreaOfInterest) => void;
  onSelectScreen: (screen: ScreenType) => void;
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel | null) => void;
}

export const GISDashboard: React.FC<GISDashboardProps> = ({
  activeAOI,
  aoiList,
  onSelectAOI,
  onAddCustomAOI,
  onSelectScreen,
  selectedParcel,
  onSelectParcel,
}) => {
  const [selectedBand, setSelectedBand] = useState<SpectralBand>('true-color');
  const [preprocessing, setPreprocessing] = useState<PreprocessingOptions>({
    cloudRemoval: true,
    noiseReduction: true,
    imageClipping: true,
    bandSelection: true,
    resampling: true,
    imageNormalization: true,
  });

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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Responsive panel state: on screens < 1024px, start collapsed to prevent map crushing
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [showLeftPanel, setShowLeftPanel] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [showRightPanel, setShowRightPanel] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
  );

  // Resize listener to adapt layout dynamically
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        // If shrinking to mobile, close panels to prevent map squeezing
        setShowLeftPanel(false);
        setShowRightPanel(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup analysis interval on unmount
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
          // Auto enable confidence layer to demonstrate results
          setLayers((l) => ({ ...l, confidenceMap: true, landCover: true, buildings: true }));
          return 100;
        }
        return prev + 15;
      });
    }, 250);
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

      {/* Left Control Panel (Responsive Overlay Sheet on Mobile, Normal Sidebar on Desktop) */}
      {showLeftPanel && (
        <div className={isMobile ? "fixed top-14 bottom-0 left-0 z-40 max-w-[85vw] shadow-2xl" : "h-full z-10"}>
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
        </div>
      )}

      {/* Central Workspace Map Area */}
      <div className="flex-1 flex flex-col relative h-full w-full min-w-0 min-h-0 overflow-hidden z-0">
        <CentralMap
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
        />
      </div>

      {/* Right Analysis Panel (Responsive Overlay Sheet on Mobile, Normal Sidebar on Desktop) */}
      {showRightPanel && (
        <div className={isMobile ? "fixed top-14 bottom-0 right-0 z-40 max-w-[85vw] shadow-2xl" : "h-full z-10"}>
          <RightAnalysisPanel
            activeAOI={activeAOI}
            selectedParcel={selectedParcel}
            onSelectScreen={onSelectScreen}
            onSelectParcel={onSelectParcel}
          />
        </div>
      )}

      {/* Satellite Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(newAOI) => {
          if (onAddCustomAOI) {
            onAddCustomAOI(newAOI);
          } else {
            onSelectAOI(newAOI);
          }
        }}
      />
    </div>
  );
};
