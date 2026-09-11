import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenType, AreaOfInterest } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Globe2, 
  Layers, 
  Cpu, 
  LandPlot, 
  BarChart3, 
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Database,
  UploadCloud
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
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: ScreenType; label: string; icon: React.ReactNode }[] = [
    { id: 'landing', label: 'Overview', icon: <Globe2 className="w-3.5 h-3.5" /> },
    { id: 'gis-dashboard', label: 'GIS Dashboard', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'imagery-catalog', label: 'Imagery Catalog', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'imagery-upload', label: 'Ingest Imagery', icon: <UploadCloud className="w-3.5 h-3.5" /> },
    { id: 'ai-analysis', label: 'AI Models', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'parcel-intelligence', label: 'Cadastral Parcels', icon: <LandPlot className="w-3.5 h-3.5" /> },
    { id: 'decision-support', label: 'Decision Support', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const handleNavClick = (screenId: ScreenType) => {
    onSelectScreen(screenId);
    setIsMobileMenuOpen(false);
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]';
      case 'ANALYST':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]';
      case 'MODERATOR':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]';
      case 'USER':
      default:
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#030B16]/92 backdrop-blur-xl border-b border-cyan-500/20 text-slate-100 select-none shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      {/* Top subtle specular edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />
      
      <div className="max-w-[1920px] mx-auto px-2.5 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-1.5 sm:gap-4 relative">
        {/* Left: Brand Logo & Name */}
        <button 
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-1.5 sm:gap-2.5 text-left group focus:outline-none cursor-pointer transition-transform active:scale-[0.98] shrink-0 min-w-0"
          aria-label="Navigate to GeoVision Overview"
        >
          <img
            src="/assets/logo.png"
            alt="GeoVision-SR Logo"
            className="w-7 h-7 sm:w-9 sm:h-9 object-contain shrink-0 mix-blend-screen select-none pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
          />
          <div className="flex items-center gap-1 truncate">
            <span className="text-xs sm:text-base font-bold tracking-tight text-white font-sans truncate">
              GeoVision<span className="text-cyan-400 font-medium">-SR</span>
            </span>
          </div>
        </button>

        {/* Center: Desktop Navigation Tabs with Animated Floating Indicator */}
        <nav role="tablist" aria-label="Main navigation" className="hidden xl:flex items-center space-x-1 lg:space-x-1.5 relative p-1 rounded-xl bg-[#06111F]/80 border border-cyan-500/15 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleNavClick(item.id)}
                className={`relative text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 lg:gap-2 transition-colors cursor-pointer font-sans duration-200 ${
                  isActive
                    ? 'text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
                aria-label={`Switch to ${item.label}`}
              >
                {/* Motion Sliding Tab Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-b from-cyan-950/90 to-[#08182B] border border-cyan-400/50 shadow-[0_0_16px_rgba(0,200,255,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <span className={`transition-transform duration-200 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: AOI Selector, Auth State / Buttons, Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Global AOI Quick Selector Dropdown (compact on small screens, full on tablet/desktop) */}
          {aoiList.length > 0 && onSelectAOI && (
            <div className="relative hidden sm:flex items-center">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none z-10" />
              <select
                value={activeAOI?.id}
                onChange={(e) => {
                  const target = aoiList.find((a) => a.id === e.target.value);
                  if (target) onSelectAOI(target);
                }}
                aria-label="Active Area of Interest selector"
                className="glass-input text-slate-200 text-xs rounded-xl pl-7 pr-6 py-1.5 cursor-pointer appearance-none border border-cyan-500/25 bg-[#06111F]/90 font-sans font-medium hover:border-cyan-400/50 transition-colors max-w-[130px] md:max-w-[160px] truncate"
              >
                {aoiList.map((aoi) => (
                  <option key={aoi.id} value={aoi.id} className="bg-[#06111F] text-white">
                    {aoi.name.split('&')[0].trim()} ({aoi.country})
                  </option>
                ))}
              </select>
              <span className="absolute right-2 pointer-events-none text-[8px] text-cyan-400">▼</span>
            </div>
          )}

          {/* SwinIR Active Telemetry Pill (Large Desktop) */}
          <div className="hidden 2xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-400/25 text-xs text-cyan-300 font-sans font-medium shadow-[0_0_12px_rgba(0,200,255,0.12)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,200,255,0.8)]" />
            <span>SwinIR 4× Pipeline</span>
          </div>

          {/* Auth State & User Controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-2 rounded-xl bg-[#06111F]/90 border border-cyan-500/20">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 text-[#030B16] text-xs font-bold flex items-center justify-center font-sans shadow-[0_0_10px_rgba(0,200,255,0.3)] shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-slate-200 max-w-[100px] xl:max-w-[120px] truncate font-sans">
                  {user.name}
                </span>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit mt-0.5 border ${getRoleBadgeStyle(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onSelectScreen('landing');
                }}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => onSelectScreen('login')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold btn-glow-cyan flex items-center gap-1 sm:gap-1.5 cursor-pointer transition-all shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectScreen('register')}
                className="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium btn-glass text-slate-200 hover:text-white items-center gap-1 cursor-pointer transition-all shrink-0"
              >
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Mobile & Tablet Hamburger Toggle Button (xl:hidden) */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="xl:hidden p-2 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors cursor-pointer"
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
            className="xl:hidden border-t border-cyan-500/20 bg-[#040D1A]/98 backdrop-blur-2xl px-4 py-3.5 space-y-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.85)] max-h-[82vh] overflow-y-auto"
          >
            {/* Mobile AOI Selector when screen is below sm */}
            {aoiList.length > 0 && onSelectAOI && (
              <div className="sm:hidden p-2 rounded-xl bg-[#06111F] border border-cyan-500/20 space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Globe2 className="w-3 h-3" />
                  <span>Target AOI</span>
                </div>
                <select
                  value={activeAOI?.id}
                  onChange={(e) => {
                    const target = aoiList.find((a) => a.id === e.target.value);
                    if (target) onSelectAOI(target);
                  }}
                  className="w-full text-xs text-slate-200 bg-[#081525] border border-cyan-500/25 rounded-lg px-2.5 py-1.5"
                >
                  {aoiList.map((aoi) => (
                    <option key={aoi.id} value={aoi.id}>
                      {aoi.name.split('&')[0].trim()} ({aoi.country})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mobile Auth Section */}
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#06111F] border border-cyan-500/20 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 text-[#030B16] text-xs font-bold flex items-center justify-center font-sans">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{user.name}</div>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    onSelectScreen('landing');
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium px-2 py-1 rounded bg-rose-950/30 border border-rose-500/30"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-cyan-500/15">
                <button
                  type="button"
                  onClick={() => handleNavClick('login')}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold btn-glow-cyan flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('register')}
                  className="py-2.5 px-3 rounded-xl text-xs font-medium btn-glass text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <span>Register</span>
                </button>
              </div>
            )}

            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/90 to-[#08182B] text-cyan-300 border border-cyan-400/50 shadow-[0_0_14px_rgba(0,200,255,0.22)]'
                        : 'text-slate-300 hover:bg-[#081525] hover:text-white'
                    }`}
                    aria-label={`Navigate to ${item.label}`}
                  >
                    <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="font-sans text-[13px]">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,200,255,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

