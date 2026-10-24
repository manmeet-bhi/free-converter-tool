import React, { useState } from 'react';
import { ImageItem } from '../types';
import { formatBytes } from '../utils/imageProcessor';
import { downloadBlob } from '../utils/zipExporter';
import {
  Check,
  Crop,
  RotateCw,
  Info,
  X,
  Eye,
  Download,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Play
} from 'lucide-react';

export interface ImageCardProps {
  item: ImageItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onCrop?: (item: ImageItem) => void;
  onRotate?: (item: ImageItem) => void;
  onRemove: (id: string) => void;
  onPreview: (item: ImageItem) => void;
  onDownload?: (item: ImageItem) => void;
  onProcessSingle?: (id: string) => void;
  targetFormat?: string;
  targetDimensions?: { width: number; height: number };
  savings?: { bytesSaved: number; percent: number; isSmaller: boolean } | null;
  previewLabel?: string;
  processingLabel?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onCrop,
  onRotate,
  onRemove,
  onPreview,
  onDownload,
  onProcessSingle,
  targetFormat = 'WEBP',
  targetDimensions,
  savings,
  previewLabel = 'Preview',
  processingLabel = 'Processing',
}) => {
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const isItemDone = item.status === 'done' && !!item.result;

  const displayWidth = targetDimensions?.width || item.originalDimensions.width;
  const displayHeight = targetDimensions?.height || item.originalDimensions.height;

  const handleDownload = () => {
    if (onDownload) {
      onDownload(item);
    } else if (item.result?.blob) {
      downloadBlob(item.result.blob, item.customFilename);
    }
  };

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-xs hover:shadow-md flex flex-col group transition-all w-full max-w-full sm:max-w-[380px] mx-auto ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/30'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Top Floating Action Area & Image Canvas */}
      <div className="relative p-3 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-center min-h-[200px] sm:min-h-[220px] transition-colors overflow-hidden">
        {/* Top-Left Selection Checkbox Overlay */}
        <div className="absolute top-3.5 left-3.5 z-20">
          <label
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-lg border shadow-xs cursor-pointer transition-all ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-500/30'
                : 'bg-white/95 dark:bg-slate-900/95 border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-500 hover:text-slate-300'
            }`}
            title={isSelected ? 'Deselect image' : 'Select image'}
          >
            <input
              id={`select-image-${item.id}`}
              name={`select-image-${item.id}`}
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              className="sr-only"
            />
            <Check
              className={`w-4 h-4 stroke-[3] transition-transform ${
                isSelected ? 'scale-100 text-white' : 'scale-0'
              }`}
            />
          </label>
        </div>

        {/* Integrated/Floating Pill Toolbar */}
        <div className="absolute top-3.5 right-3.5 flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md z-30 backdrop-blur-md">
          {/* Crop Button */}
          {onCrop && (
            <button
              type="button"
              onClick={() => onCrop(item)}
              title="Crop & Edit"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Crop className="w-4 h-4" />
            </button>
          )}

          {/* Rotate Button */}
          {onRotate && (
            <button
              type="button"
              onClick={() => onRotate(item)}
              title="Rotate 90°"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {/* Info Button: Toggles blur effect and details overlay */}
          <button
            type="button"
            onClick={() => setShowInfo((prev) => !prev)}
            title="Image Details"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showInfo
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            title="Delete Image"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Container */}
        <div
          onClick={() => {
            if (!showInfo && item.status !== 'processing') onPreview(item);
          }}
          className="w-full h-40 sm:h-44 rounded-lg bg-slate-200/60 dark:bg-black/40 flex items-center justify-center overflow-hidden p-1.5 relative group transition-all cursor-pointer"
          title={showInfo ? undefined : item.status === 'processing' ? 'Processing...' : 'Click to preview image'}
        >
          {/* Main Image with dynamic BLUR effect when showInfo is active OR when processing */}
          <img
            src={item.result?.previewUrl || item.originalInfo.previewUrl}
            alt={item.customFilename}
            className={`max-h-full max-w-full object-contain rounded transition-all duration-300 ${
              showInfo || item.status === 'processing'
                ? 'blur-md scale-105 opacity-40' 
                : 'group-hover:scale-[1.02]'
            }`}
          />

          {/* Processing Overlay: Blurs image and shows animated progress */}
          {item.status === 'processing' && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 z-20 backdrop-blur-md bg-slate-900/60 dark:bg-slate-950/70 p-4 rounded-lg flex flex-col items-center justify-center text-center animate-in fade-in duration-200 select-none cursor-default"
            >
              <div className="relative flex items-center justify-center mb-2.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              </div>

              <span className="text-xs font-bold text-white tracking-wide">
                {processingLabel}...
              </span>

              {/* Progress Bar inside the blurred overlay */}
              <div
                className="w-32 sm:w-36 bg-white/20 dark:bg-white/15 rounded-full h-1.5 mt-2.5 overflow-hidden shadow-inner relative"
                role="progressbar"
                aria-label={`${processingLabel} ${item.customFilename}`}
              >
                <div className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 h-full w-full rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {/* Normal Hover Overlay (only when info and processing are NOT open) */}
          {!showInfo && item.status !== 'processing' && (
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg z-10">
              <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white text-xs font-bold flex items-center space-x-1 shadow-md">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>{previewLabel}</span>
              </span>
            </div>
          )}

          {/* Frosted Glass Info Overlay: Displays when (i) button is clicked */}
          {showInfo && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 z-20 backdrop-blur-md bg-white/85 dark:bg-slate-900/90 p-3.5 rounded-lg flex flex-col justify-between text-xs animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Image Details</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close info"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] py-1 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Original Size:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatBytes(item.originalSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Dimensions:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {item.originalDimensions.width} × {item.originalDimensions.height}
                  </span>
                </div>
                {targetDimensions && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Target Output:</span>
                    <span className="font-bold">{displayWidth} × {displayHeight}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Format:</span>
                  <span className="font-bold uppercase text-blue-600 dark:text-blue-400">
                    {targetFormat}
                  </span>
                </div>
                {isItemDone && item.result && (
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 text-emerald-600 dark:text-emerald-400">
                    <span>Processed Size:</span>
                    <span className="font-bold">{formatBytes(item.result.fileSizeBytes)}</span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                Click (i) to close
              </div>
            </div>
          )}
        </div>

        {/* Processed Done Indicator */}
        {isItemDone && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center space-x-1 shadow-xs z-10">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            <span>{savings?.isSmaller ? `-${savings.percent}%` : 'Done'}</span>
          </div>
        )}
      </div>

      {/* Card Footer: Filename, Resolution & Process Button */}
      <div className="p-3.5 sm:p-4 space-y-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
        {/* Truncated Filename */}
        <div
          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
          title={item.customFilename}
        >
          {item.customFilename}
        </div>

        {/* Action Row: Resolution on Left, Process (Icon Only) or Download on Right */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Resolution Badge */}
          <div className="flex items-center space-x-1.5 min-w-0">
            <span
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold tracking-tight"
              title="Resolution"
            >
              {displayWidth} × {displayHeight}
            </span>

            {isItemDone && savings && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                {savings.isSmaller ? `-${savings.percent}%` : `+${savings.percent}%`}
              </span>
            )}
          </div>

          {/* Action Button: Process button (icon only) or Download/Preview when completed */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {item.status === 'processing' && (
              <div
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center"
                title="Processing Image..."
              >
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}

            {!isItemDone && item.status !== 'processing' && onProcessSingle && (
              <button
                type="button"
                onClick={() => onProcessSingle(item.id)}
                title="Process Image"
                aria-label="Process Image"
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            )}

            {isItemDone && (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleDownload}
                  title="Download Image"
                  aria-label="Download Image"
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onPreview(item)}
                  title={`${previewLabel} Result`}
                  aria-label={`${previewLabel} Result`}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {item.status === 'error' && (
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{item.error || 'Processing error'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
