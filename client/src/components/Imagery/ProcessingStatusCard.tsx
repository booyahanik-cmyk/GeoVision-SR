import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  ArrowLeftRight, 
  Eye, 
  Clock,
  Radio
} from 'lucide-react';
import { stompProgressService, ProgressMessage } from '../../api/stompClient';

export interface ProcessingStatusCardProps {
  imageryId: number;
  filename?: string;
  initialPercentage?: number;
  initialStage?: string;
  initialMessage?: string;
  onCompleted?: () => void;
  onOpenInGIS?: () => void;
  onOpenComparison?: () => void;
  className?: string;
}

interface StepMilestone {
  percentage: number;
  label: string;
  stageKey: string;
  desc: string;
}

const MILESTONES: StepMilestone[] = [
  { percentage: 0, label: '0%', stageKey: 'INGEST_VALIDATION', desc: 'Ingest & Validation' },
  { percentage: 25, label: '25%', stageKey: 'NORMALIZATION', desc: 'Min-Max Normalization' },
  { percentage: 50, label: '50%', stageKey: 'CONTRAST_ENHANCEMENT', desc: 'CLAHE Equalization' },
  { percentage: 75, label: '75%', stageKey: 'NOISE_SHARPENING', desc: 'Denoising & Sharpening' },
  { percentage: 100, label: '100%', stageKey: 'COMPLETED', desc: 'Master GeoTIFF Ready' },
];

export const ProcessingStatusCard: React.FC<ProcessingStatusCardProps> = ({
  imageryId,
  filename,
  initialPercentage = 0,
  initialStage = 'INITIALIZING',
  initialMessage = 'Connecting to real-time WebSocket telemetry stream...',
  onCompleted,
  onOpenInGIS,
  onOpenComparison,
  className = '',
}) => {
  const [currentPercentage, setCurrentPercentage] = useState<number>(initialPercentage);
  const [currentStage, setCurrentStage] = useState<string>(initialStage);
  const [currentMessage, setCurrentMessage] = useState<string>(initialMessage);
  const [lastTimestamp, setLastTimestamp] = useState<string>(new Date().toLocaleTimeString());
  const [isDone, setIsDone] = useState<boolean>(initialPercentage >= 100);
  const [isFailed, setIsFailed] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to STOMP progress updates for this imagery ID
    const unsubscribe = stompProgressService.subscribeToImagery(imageryId, (msg: ProgressMessage) => {
      setCurrentPercentage(msg.percentage);
      setCurrentStage(msg.stage);
      setCurrentMessage(msg.message);
      setLastTimestamp(new Date().toLocaleTimeString());

      if (msg.percentage >= 100 || msg.stage === 'COMPLETED' || msg.stage === 'INGEST_COMPLETE') {
        setIsDone(true);
        if (onCompleted) {
          onCompleted();
        }
      } else if (msg.stage === 'FAILED') {
        setIsFailed(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [imageryId]);

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-b from-[#070E1F]/90 to-[#040711]/90 border border-cyan-500/30 text-slate-200 font-sans text-xs relative overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.6)] ${className}`}>
      {/* Top Specular Neon Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center border shadow-[0_0_12px_rgba(6,182,212,0.25)] ${
            isDone
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
              : isFailed
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-400'
              : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
          }`}>
            {isDone ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isFailed ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <RotateCw className="w-4 h-4 animate-spin text-cyan-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
              <span>{isDone ? 'Processing Pipeline Complete' : 'Real-Time Processing Stream'}</span>
              <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30">
                #{imageryId}
              </span>
            </div>
            {filename && (
              <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
                {filename}
              </p>
            )}
          </div>
        </div>

        {/* Live WebSocket Beacon */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-[9px] font-mono text-cyan-300">
          <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
          <span>STOMP WS</span>
        </div>
      </div>

      {/* Animated Glowing Progress Bar */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">PIPELINE EXECUTION:</span>
          <span className={`font-bold ${
            isDone ? 'text-emerald-300' : 'text-cyan-300'
          }`}>
            {currentPercentage}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out relative ${
              isDone
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, currentPercentage))}%` }}
          >
            {/* Shimmer sweep effect */}
            {!isDone && (
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* 5-Step Milestone Stepper */}
      <div className="mt-4 grid grid-cols-5 gap-1 pt-2 border-t border-slate-800/80 text-[10px]">
        {MILESTONES.map((step, idx) => {
          const isPassed = currentPercentage >= step.percentage;
          const isCurrent = currentPercentage === step.percentage && !isDone;

          return (
            <div key={step.percentage} className="flex flex-col items-center text-center space-y-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all border ${
                isPassed
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : isCurrent
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}>
                {isPassed ? '✓' : step.percentage}
              </div>
              <span className={`text-[9px] font-mono leading-tight truncate w-full ${
                isPassed ? 'text-slate-200 font-medium' : 'text-slate-600'
              }`}>
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Live Stage Description */}
      <div className="mt-3.5 p-2.5 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-300 truncate">{currentMessage}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 shrink-0 ml-2">
          <Clock className="w-2.5 h-2.5" />
          <span>{lastTimestamp}</span>
        </div>
      </div>

      {/* Post-Completion Fast Actions */}
      {isDone && (
        <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between gap-2 animate-in fade-in duration-300">
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Ready for Spatial Analysis</span>
          </span>

          <div className="flex items-center gap-2">
            {onOpenComparison && (
              <button
                type="button"
                onClick={onOpenComparison}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compare Before/After</span>
              </button>
            )}

            {onOpenInGIS && (
              <button
                type="button"
                onClick={onOpenInGIS}
                className="px-2.5 py-1 rounded-lg text-xs font-bold btn-glow-cyan text-slate-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open in GIS Map</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
