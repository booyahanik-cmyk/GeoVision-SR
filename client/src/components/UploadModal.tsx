import React, { useState } from 'react';
import { UploadCloud, X, RotateCw, FileCode, CheckCircle2 } from 'lucide-react';
import { AreaOfInterest } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (mockAOI: AreaOfInterest) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [areaName, setAreaName] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!areaName) {
        setAreaName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!areaName) {
        setAreaName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const customAOI: AreaOfInterest = {
        id: `aoi-upload-${Date.now()}`,
        name: areaName || selectedFile.name.replace(/\.[^/.]+$/, ''),
        region: 'User AOI',
        country: 'Custom Ingest',
        center: [43.6812, 4.6318],
        zoom: 14,
        bounds: [
          [43.665, 4.605],
          [43.698, 4.658],
        ],
        sentinelTileId: 'SENTINEL2_CUSTOM',
        acquisitionDate: new Date().toISOString().replace('T', ' ').slice(0, 10),
        cloudCover: 0.1,
        sunElevation: 58.0,
        nativeGSD: 10.0,
        enhancedGSD: 2.5,
        description: notes || `Ingested from ${selectedFile.name}`,
      };
      onUploadSuccess(customAOI);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel-elevated rounded-2xl w-full max-w-md overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] text-slate-200 font-sans text-xs border border-cyan-500/30">
        {/* Header with specular highlight */}
        <div className="px-5 py-3.5 border-b border-cyan-500/15 flex items-center justify-between bg-gradient-to-r from-[#0B1324]/90 to-slate-900/90">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white tracking-wide">Ingest Satellite Imagery</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close upload modal"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${dragActive
              ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : selectedFile
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : 'border-cyan-500/20 bg-[#080D1A]/70 hover:border-cyan-400/50 hover:bg-cyan-950/10'
              }`}
          >
            <input
              type="file"
              id="file-upload-input"
              accept=".tif,.tiff,.geotiff,.jp2,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer block space-y-2">
              <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                {selectedFile ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-cyan-400" />
                )}
              </div>
              <div className="font-semibold text-slate-200 text-xs">
                {selectedFile ? selectedFile.name : 'Click to select or drag Sentinel GeoTIFF'}
              </div>
              <div className="text-[11px] text-slate-400">
                GeoTIFF (.tif, .jp2, .zip, .geojson, .tiff) up to 100MB
              </div>
            </label>
          </div>

          {/* Area Name Field */}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-[11px] font-medium block">
              Area Identifier / Name (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rhone Delta Sector 4"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-sans"
            />
          </div>

          {/* Notes Field */}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-[11px] font-medium block">
              Mission Notes / Annotation
            </label>
            <textarea
              rows={2}
              placeholder="Add optional notes or mission details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 resize-none font-sans"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-cyan-500/15 bg-slate-900/60 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isProcessing}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${!selectedFile || isProcessing
              ? 'bg-slate-850 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'btn-glow-cyan text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.35)] active:scale-98'
              }`}
          >
            {isProcessing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Ingesting & Processing...</span>
              </>
            ) : (
              <span>Ingest & Run Pipeline</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
