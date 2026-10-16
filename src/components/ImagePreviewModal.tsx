import React from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { formatBytes } from '../utils/imageProcessor';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  filename: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  format: string;
  hasTransparency?: boolean;
  onDownload?: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  filename,
  width,
  height,
  fileSizeBytes,
  format,
  hasTransparency = false,
  onDownload,
}) => {
  const [zoom, setZoom] = React.useState(1);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5 truncate">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-base sm:text-lg">
              {filename}
            </h3>
            <span className="shrink-0 text-xs font-mono uppercase px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900">
              {format}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Canvas Area */}
        <div
          className={`flex-1 overflow-auto flex items-center justify-center p-6 min-h-[300px] ${
            hasTransparency ? 'bg-checkerboard-light dark:bg-checkerboard-dark' : 'bg-slate-100 dark:bg-slate-950'
          }`}
        >
          <img
            src={imageUrl}
            alt={filename}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            className="max-h-[60vh] max-w-full object-contain transition-transform duration-150 drop-shadow-md rounded"
          />
        </div>

        {/* Modal Footer with details & zoom controls */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center space-x-4 font-mono">
            <span>Dimensions: <strong className="text-slate-900 dark:text-white">{width} × {height} px</strong></span>
            <span>Size: <strong className="text-slate-900 dark:text-white">{formatBytes(fileSizeBytes)}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-sm font-bold w-14 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
