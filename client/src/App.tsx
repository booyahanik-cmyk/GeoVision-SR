import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenType, AreaOfInterest, Parcel } from './types';
import { AREAS_OF_INTEREST, PARCELS_DATA } from './data/geospatialData';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { GISDashboard } from './components/GISDashboard/GISDashboard';
import { AIAnalysisView } from './components/AIAnalysis/AIAnalysisView';
import { ParcelIntelligenceView } from './components/ParcelIntelligence/ParcelIntelligenceView';
import { DecisionSupportView } from './components/DecisionSupport/DecisionSupportView';
import { LoginPage } from './components/Auth/LoginPage';
import { RegisterPage } from './components/Auth/RegisterPage';
import { ImageryListPage } from './components/Imagery/ImageryListPage';
import { ImageryUploadPage } from './components/Imagery/ImageryUploadPage';
import { useAuth } from './context/AuthContext';

const screenOrder: ScreenType[] = [
  'landing',
  'login',
  'register',
  'gis-dashboard',
  'imagery-catalog',
  'imagery-upload',
  'ai-analysis',
  'parcel-intelligence',
  'decision-support',
];

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      x: { type: 'spring', stiffness: 320, damping: 32 },
      opacity: { duration: 0.22, ease: 'easeOut' },
      filter: { duration: 0.22 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
    filter: 'blur(4px)',
    transition: {
      x: { type: 'spring', stiffness: 320, damping: 32 },
      opacity: { duration: 0.18, ease: 'easeIn' },
      filter: { duration: 0.18 },
    },
  }),
};

export default function App() {
  const { isAuthenticated } = useAuth();

  // Master list of AOIs initialized with defaults, supporting custom uploaded AOIs
  const [aoiList, setAoiList] = useState<AreaOfInterest[]>(AREAS_OF_INTEREST);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  const [direction, setDirection] = useState<number>(1);
  const [activeAOI, setActiveAOI] = useState<AreaOfInterest>(AREAS_OF_INTEREST[0]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [targetImageryId, setTargetImageryId] = useState<number | null>(null);

  // Auth flow states
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [intendedScreen, setIntendedScreen] = useState<ScreenType>('gis-dashboard');

  const handleOpenImageryInGIS = (imageryId?: number) => {
    if (imageryId) {
      setTargetImageryId(imageryId);
    }
    handleSelectScreen('gis-dashboard');
  };

  const protectedScreens: ScreenType[] = [
    'gis-dashboard',
    'imagery-catalog',
    'imagery-upload',
    'ai-analysis',
    'parcel-intelligence',
    'decision-support',
  ];

  const handleSelectScreen = (nextScreen: ScreenType) => {
    if (nextScreen === currentScreen) return;

    // Route guard: protected screens require authentication
    if (protectedScreens.includes(nextScreen) && !isAuthenticated) {
      setIntendedScreen(nextScreen);
      setLoginNotice('Operator authentication required to access this module.');
      setDirection(1);
      setCurrentScreen('login');
      return;
    }

    const currentIndex = screenOrder.indexOf(currentScreen);
    const nextIndex = screenOrder.indexOf(nextScreen);
    setDirection(nextIndex >= currentIndex ? 1 : -1);
    setCurrentScreen(nextScreen);
  };

  const handleLoginSuccess = () => {
    setLoginNotice(null);
    const target = intendedScreen || 'gis-dashboard';
    const currentIndex = screenOrder.indexOf(currentScreen);
    const nextIndex = screenOrder.indexOf(target);
    setDirection(nextIndex >= currentIndex ? 1 : -1);
    setCurrentScreen(target);
  };

  const handleRegisterSuccess = (message: string) => {
    setLoginNotice(message);
    setDirection(-1);
    setCurrentScreen('login');
  };

  const handleStartAnalysis = (aoi?: AreaOfInterest) => {
    if (aoi) {
      setActiveAOI(aoi);
    }
    handleSelectScreen('gis-dashboard');
  };

  const handleSelectAOI = (aoi: AreaOfInterest) => {
    setActiveAOI(aoi);
    // Reset or set selected parcel to first in new AOI
    const aoiParcels = PARCELS_DATA[aoi.id] || [];
    setSelectedParcel(aoiParcels.length > 0 ? aoiParcels[0] : null);
  };

  const handleAddCustomAOI = (customAOI: AreaOfInterest) => {
    setAoiList((prev) => {
      if (prev.some((a) => a.id === customAOI.id)) return prev;
      return [customAOI, ...prev];
    });
    handleSelectAOI(customAOI);
  };

  return (
    <div className="h-screen w-screen bg-[#060913] text-slate-100 flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      {/* Accessibility: Skip to main content link */}
      <a href="#main-content" className="skip-to-content">Skip to main content</a>

      {/* Immersive Ambient Background Layer with Floating Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle high-tech grid mesh */}
        <div className="absolute inset-0 geo-grid-bg opacity-30" />
        
        {/* Ambient Glow Orb 1 - Deep Cyan (Top Left) */}
        <div className="absolute -top-[10%] -left-[10%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-cyan-600/10 blur-[130px] animate-float-1" />
        
        {/* Ambient Glow Orb 2 - Deep Indigo (Bottom Right) */}
        <div className="absolute -bottom-[10%] -right-[10%] w-[500px] sm:w-[750px] h-[500px] sm:h-[750px] rounded-full bg-indigo-600/10 blur-[140px] animate-float-2" />
        
        {/* Ambient Glow Orb 3 - Soft Teal (Center subtle pulse) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[160px] animate-pulse-glow" />
      </div>

      {/* Top Scientific Navigation Header with Global AOI Selector */}
      <Header
        currentScreen={currentScreen}
        onSelectScreen={handleSelectScreen}
        activeAOI={activeAOI}
        aoiList={aoiList}
        onSelectAOI={handleSelectAOI}
      />

      {/* Main Screen Views with Animated Slide Transitions */}
      <main id="main-content" className="flex-1 w-full min-h-0 min-w-0 relative overflow-hidden flex flex-col z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentScreen}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full min-h-0 min-w-0 flex flex-col"
          >
            {currentScreen === 'landing' && (
              <LandingPage
                onStartAnalysis={handleStartAnalysis}
                onSelectScreen={handleSelectScreen}
              />
            )}

            {currentScreen === 'login' && (
              <LoginPage
                onSuccess={handleLoginSuccess}
                onNavigateToRegister={() => {
                  setDirection(1);
                  setCurrentScreen('register');
                }}
                onBackToLanding={() => {
                  setDirection(-1);
                  setCurrentScreen('landing');
                }}
                initialMessage={loginNotice}
              />
            )}

            {currentScreen === 'register' && (
              <RegisterPage
                onSuccess={handleRegisterSuccess}
                onNavigateToLogin={() => {
                  setDirection(-1);
                  setCurrentScreen('login');
                }}
                onBackToLanding={() => {
                  setDirection(-1);
                  setCurrentScreen('landing');
                }}
              />
            )}

            {currentScreen === 'gis-dashboard' && (
              <GISDashboard
                activeAOI={activeAOI}
                aoiList={aoiList}
                onSelectAOI={handleSelectAOI}
                onAddCustomAOI={handleAddCustomAOI}
                onSelectScreen={handleSelectScreen}
                selectedParcel={selectedParcel}
                onSelectParcel={setSelectedParcel}
                initialSelectedImageryId={targetImageryId}
              />
            )}

            {currentScreen === 'imagery-catalog' && (
              <ImageryListPage
                onNavigateToUpload={() => handleSelectScreen('imagery-upload')}
                onNavigateToGIS={handleOpenImageryInGIS}
              />
            )}

            {currentScreen === 'imagery-upload' && (
              <ImageryUploadPage
                onNavigateToCatalog={() => handleSelectScreen('imagery-catalog')}
                onNavigateToGIS={handleOpenImageryInGIS}
              />
            )}

            {currentScreen === 'ai-analysis' && (
              <AIAnalysisView activeAOI={activeAOI} />
            )}

            {currentScreen === 'parcel-intelligence' && (
              <ParcelIntelligenceView
                activeAOI={activeAOI}
                selectedParcel={selectedParcel}
                onSelectParcel={setSelectedParcel}
              />
            )}

            {currentScreen === 'decision-support' && (
              <DecisionSupportView activeAOI={activeAOI} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Platform Status Footer (hidden on landing and auth pages for clean presentation) */}
      {currentScreen !== 'landing' && currentScreen !== 'login' && currentScreen !== 'register' && (
        <footer className="h-8 bg-[#070C18]/90 backdrop-blur-md border-t border-cyan-500/15 px-4 sm:px-6 flex items-center justify-between text-[11px] text-gray-400 font-sans select-none shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
          <div className="truncate flex items-center gap-2">
            <span className="status-dot-static text-cyan-400" />
            <span className="text-slate-300 font-medium">GeoVision-SR</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">SIH26142 Super-Resolution Mapping Platform</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
              Evaluation Dataset • Demonstrator Mode
            </span>
          </div>
          <div className="text-slate-500 text-[10px] font-mono">© 2026 GeoVision-SR Project</div>
        </footer>
      )}
    </div>
  );
}
