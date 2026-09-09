import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenType, AreaOfInterest } from '../types';
import { 
  Globe2, 
  Layers, 
  Cpu, 
  LandPlot, 
  BarChart3, 
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  activeAOI: AreaOfInterest;
  aoiList?: AreaOfInterest[];
  onSelectAOI?: (aoi: AreaOfInterest) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onSelectScreen,
  activeAOI,
  aoiList = [],
  onSelectAOI,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: ScreenType; label: string; icon: React.ReactNode }[] = [
    { id: 'landing', label: 'Overview', icon: <Globe2 className="w-3.5 h-3.5" /> },
    { id: 'gis-dashboard', label: 'GIS Dashboard', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'ai-analysis', label: 'AI Models', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'parcel-intelligence', label: 'Cadastral Parcels', icon: <LandPlot className="w-3.5 h-3.5" /> },
    { id: 'decision-support', label: 'Decision Support', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const handleNavClick = (screenId: ScreenType) => {
    onSelectScreen(screenId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#060A14]/85 backdrop-blur-xl border-b border-cyan-500/15 text-slate-100 select-none shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Top subtle specular edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />
      
      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Brand Logo & Name */}
        <button 
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none cursor-pointer transition-transform active:scale-[0.98] shrink-0 whitespace-nowrap"
          aria-label="Navigate to GeoVision Overview"
        >
          <img
            src="/assets/logo.png"
            alt="GeoVision-SR Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 mix-blend-screen select-none pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
          />
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-sm sm:text-base font-bold tracking-tight text-white font-sans whitespace-nowrap">
              GeoVision<span className="text-cyan-400 font-medium">-SR</span>
            </span>
          </div>
        </button>

        {/* Center: Desktop Navigation Tabs with Animated Floating Indicator */}
        <nav role="tablist" aria-label="Main navigation" className="hidden md:flex items-center space-x-1 lg:space-x-1.5 relative p-1 rounded-xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleNavClick(item.id)}
                className={`relative text-xs font-medium px-2.5 lg:px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 lg:gap-2 transition-colors cursor-pointer font-sans duration-200 ${
                  isActive
                    ? 'text-cyan-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
                aria-label={`Switch to ${item.label}`}
              >
                {/* Motion Sliding Tab Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-950/80 to-slate-900/90 border border-cyan-400/40 shadow-[0_0_16px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <span className={`transition-transform duration-200 ${isActive ? 'text-cyan-300 scale-110' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Global AOI Context Selector & Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global AOI Quick Selector Dropdown */}
          {aoiList.length > 0 && onSelectAOI && (
            <div className="relative flex items-center">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none z-10" />
              <select
                value={activeAOI?.id}
                onChange={(e) => {
                  const target = aoiList.find((a) => a.id === e.target.value);
                  if (target) onSelectAOI(target);
                }}
                aria-label="Active Area of Interest selector"
                className="glass-input text-slate-200 text-xs rounded-xl pl-7 pr-6 py-1.5 cursor-pointer appearance-none border border-cyan-500/20 bg-[#0A101D]/80 font-sans font-medium hover:border-cyan-400/40 transition-colors max-w-[130px] sm:max-w-[170px] truncate"
              >
                {aoiList.map((aoi) => (
                  <option key={aoi.id} value={aoi.id} className="bg-[#0A101D] text-white">
                    {aoi.name.split('&')[0].trim()} ({aoi.country})
                  </option>
                ))}
              </select>
              <span className="absolute right-2 pointer-events-none text-[8px] text-slate-400">▼</span>
            </div>
          )}

          {/* SwinIR Active Telemetry Pill (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 font-sans font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>SwinIR Pipeline</span>
          </div>

          {/* Mobile Hamburger Toggle Button (md:hidden) */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden border-t border-cyan-500/15 bg-[#080D1A]/95 backdrop-blur-2xl px-4 py-3 space-y-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900/90 text-cyan-200 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'text-slate-300 hover:bg-slate-850/60 hover:text-white'
                  }`}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="font-sans">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                  )}
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
