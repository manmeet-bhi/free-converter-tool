import React, { useState, useEffect } from 'react';
import { ImageItem } from '../types';
import { DropZone } from '../components/DropZone';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import { 
  getAvailableOutputFormats, 
  ImageFormat, 
  detectInputFormat 
} from '../utils/formatSupport';
import { 
  processImage, 
  formatBytes, 
  calculateSavings, 
  revokeUrl 
} from '../utils/imageProcessor';
import { createZipArchive, downloadBlob } from '../utils/zipExporter';
import { 
  FileImage, 
  Download, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Archive, 
  Check, 
  Sliders, 
  Eye, 
  Edit2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConverterViewProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onFilesSelected: (files: File[]) => void;
}

export const ConverterView: React.FC<ConverterViewProps> = ({
  images,
  setImages,
  onFilesSelected,
}) => {
  const availableFormats = getAvailableOutputFormats();
  const [batchTargetFormat, setBatchTargetFormat] = useState<ImageFormat>('webp');
  const [batchQuality, setBatchQuality] = useState<number>(0.85);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  // Preview Modal state
  const [modalItem, setModalItem] = useState<{
    url: string;
    filename: string;
    width: number;
    height: number;
    size: number;
    format: string;
    hasTransparency?: boolean;
    onDownload?: () => void;
  } | null>(null);

  // Apply batch target format to all images
  const handleApplyBatchFormat = (fmt: ImageFormat) => {
    setBatchTargetFormat(fmt);
    setImages((prev) =>
      prev.map((item) => {
        // Compute new filename extension
        const currentName = item.customFilename;
        const lastDot = currentName.lastIndexOf('.');
        const base = lastDot !== -1 ? currentName.slice(0, lastDot) : currentName;
        const targetExt = fmt === 'jpeg' ? '.jpg' : `.${fmt}`;
        return {
          ...item,
          targetFormat: fmt,
          customFilename: `${base}${targetExt}`,
        };
      })
    );
  };

  // Convert a single image
  const convertSingleImage = async (id: string) => {
    const item = images.find((i) => i.id === id);
    if (!item) return;

    setImages((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'processing', error: undefined } : i))
    );

    try {
      // Clean up previous result URL if exists
      if (item.result?.previewUrl) {
        revokeUrl(item.result.previewUrl);
      }

      const result = await processImage(item.originalInfo, {
        format: item.targetFormat,
        quality: item.targetQuality,
        width: item.targetWidth,
        height: item.targetHeight,
        backgroundColor: item.backgroundColor,
      });

      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'done', result } : i))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Conversion failed.';
      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'error', error: message } : i))
      );
    }
  };

  // Convert all images
  const handleConvertAll = async () => {
    setIsProcessingAll(true);
    for (const item of images) {
      if (item.status !== 'processing') {
        await convertSingleImage(item.id);
      }
    }
    setIsProcessingAll(false);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
  };

  // Download all completed results as ZIP
  const handleDownloadAllZip = async () => {
    const completedItems = images.filter((i) => i.status === 'done' && i.result);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    setZipProgress(0);

    const filesToZip = completedItems.map((item) => ({
      filename: item.customFilename,
      blob: item.result!.blob,
    }));

    try {
      await createZipArchive(filesToZip, `imagekit-converted-${Date.now()}.zip`, (pct) => {
        setZipProgress(pct);
      });
    } catch {
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  // Remove single image
  const handleRemoveImage = (id: string) => {
    const item = images.find((i) => i.id === id);
    if (item?.result?.previewUrl) revokeUrl(item.result.previewUrl);
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear queue
  const handleClearAll = () => {
    images.forEach((item) => {
      if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
    });
    setImages([]);
  };

  const completedCount = images.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto px-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <FileImage className="w-5 h-5" />
            </div>
            <span>Image Converter</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Convert any image to WebP, PNG, JPG, BMP, or ICO in batch with full privacy.
          </p>
        </div>

        {images.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Upload Zone */}
      <DropZone
        onFilesSelected={onFilesSelected}
        title="Add images to convert"
        subtitle="Drag & drop multiple files, or click to browse. Images are processed locally."
        compact={images.length > 0}
      />

      {/* Batch Control Toolbar */}
      {images.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                <span>Convert All To:</span>
              </span>

              {/* Format selection chips */}
              <div className="flex flex-wrap gap-1.5">
                {availableFormats.map((fmt) => {
                  const isSelected = batchTargetFormat === fmt.id;
                  const isAvailable = fmt.canEncode;

                  return (
                    <div key={fmt.id} className="relative group">
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleApplyBatchFormat(fmt.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                          !isAvailable
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                            : isSelected
                            ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={fmt.description}
                      >
                        {fmt.id}
                        {!isAvailable && ' (No export)'}
                      </button>

                      {!isAvailable && (
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] shadow-xl border border-slate-700 leading-normal pointer-events-none">
                          <p className="font-semibold text-amber-300 mb-0.5">Encoding Unavailable</p>
                          <p>{fmt.unsupportedMessage || `${fmt.label} canvas encoding is not supported in this browser version.`}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Batch actions */}
            <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
              <button
                onClick={handleConvertAll}
                disabled={isProcessingAll}
                className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-98"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessingAll ? 'animate-spin' : ''}`} />
                <span>{isProcessingAll ? 'Converting...' : `Convert All (${images.length})`}</span>
              </button>

              {completedCount > 0 && (
                <button
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-98"
                >
                  <Archive className="w-4 h-4" />
                  <span>{isZipping ? `Archiving (${zipProgress}%)...` : `Download All (${completedCount} ZIP)`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quality slider for lossy batch formats */}
          {(batchTargetFormat === 'jpeg' || batchTargetFormat === 'webp') && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Quality:
                </span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={batchQuality}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBatchQuality(val);
                    setImages((prev) => prev.map((item) => ({ ...item, targetQuality: val })));
                  }}
                  className="w-36 accent-blue-600 cursor-pointer"
                />
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(batchQuality * 100)}%
                </span>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Higher quality preserves fine textures; lower quality decreases file size.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Images Queue List */}
      <div className="space-y-4">
        {images.map((item) => {
          const savings = item.result
            ? calculateSavings(item.originalSize, item.result.fileSizeBytes)
            : null;
          const inputFormat = detectInputFormat(item.file);
          const hasTransparencyWarning =
            item.originalInfo.hasTransparency && (item.targetFormat === 'jpeg' || item.targetFormat === 'bmp');

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all duration-150 ${
                item.status === 'done'
                  ? 'border-emerald-300 dark:border-emerald-900/60 shadow-xs'
                  : item.status === 'error'
                  ? 'border-rose-300 dark:border-rose-900/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Left: Thumbnail & Filename info */}
                <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
                  {/* Thumbnail preview */}
                  <div
                    onClick={() =>
                      setModalItem({
                        url: item.result?.previewUrl || item.originalInfo.cleanedSvgUrl || URL.createObjectURL(item.file),
                        filename: item.customFilename,
                        width: item.result?.width || item.originalDimensions.width,
                        height: item.result?.height || item.originalDimensions.height,
                        size: item.result?.fileSizeBytes || item.originalSize,
                        format: item.result?.format || inputFormat,
                        hasTransparency: item.originalInfo.hasTransparency,
                        onDownload: item.result
                          ? () => downloadBlob(item.result!.blob, item.customFilename)
                          : undefined,
                      })
                    }
                    className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group bg-checkerboard-light dark:bg-checkerboard-dark flex items-center justify-center shadow-xs"
                    title="Click to view full image"
                  >
                    <img
                      src={item.result?.previewUrl || item.originalInfo.cleanedSvgUrl || URL.createObjectURL(item.file)}
                      alt={item.file.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Name and details */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item.customFilename}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setImages((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, customFilename: newName } : i))
                          );
                        }}
                        className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none truncate max-w-xs sm:max-w-md"
                        title="Click to rename output file"
                      />
                      <Edit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>{item.originalDimensions.width} × {item.originalDimensions.height} px</span>
                      <span>•</span>
                      <span>Original: <strong>{formatBytes(item.originalSize)}</strong></span>
                      <span className="uppercase font-sans font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {inputFormat}
                      </span>
                      {item.originalInfo.hasTransparency && (
                        <span className="font-sans text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900">
                          Alpha Transparency
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Target Format dropdown, status, and download buttons */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                  {/* Target format select */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">To:</span>
                    <select
                      value={item.targetFormat}
                      onChange={(e) => {
                        const newFmt = e.target.value as ImageFormat;
                        const currentName = item.customFilename;
                        const lastDot = currentName.lastIndexOf('.');
                        const base = lastDot !== -1 ? currentName.slice(0, lastDot) : currentName;
                        const targetExt = newFmt === 'jpeg' ? '.jpg' : `.${newFmt}`;
                        setImages((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? {
                                  ...i,
                                  targetFormat: newFmt,
                                  customFilename: `${base}${targetExt}`,
                                  status: 'idle',
                                  result: undefined,
                                }
                              : i
                          )
                        );
                      }}
                      className="text-xs font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableFormats.map((f) => (
                        <option key={f.id} value={f.id} disabled={!f.canEncode}>
                          {f.label} {!f.canEncode ? '(Unsupported)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Result Size / Savings */}
                  {item.result && savings && (
                    <div className="text-right font-mono text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {formatBytes(item.result.fileSizeBytes)}
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          savings.isSmaller ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {savings.isSmaller ? `-${savings.percent}% (${formatBytes(savings.bytesSaved)} saved)` : `+${savings.percent}%`}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {item.status === 'done' && item.result ? (
                      <button
                        onClick={() => downloadBlob(item.result!.blob, item.customFilename)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => convertSingleImage(item.id)}
                        disabled={item.status === 'processing'}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                        <span>{item.status === 'processing' ? 'Converting' : 'Convert'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveImage(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Transparency Warning Notice for JPEG/BMP */}
              {hasTransparencyWarning && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <strong>Warning:</strong> {item.targetFormat.toUpperCase()} does not support transparency. Transparent background will be replaced with a solid color.
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Fill Color:</span>
                    <input
                      type="color"
                      value={item.backgroundColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setImages((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, backgroundColor: newColor } : i))
                        );
                      }}
                      className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <span className="font-mono text-[11px] uppercase">{item.backgroundColor}</span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {item.status === 'error' && (
                <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{item.error || 'Conversion error.'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox / Preview Modal */}
      {modalItem && (
        <ImagePreviewModal
          isOpen={true}
          onClose={() => setModalItem(null)}
          imageUrl={modalItem.url}
          filename={modalItem.filename}
          width={modalItem.width}
          height={modalItem.height}
          fileSizeBytes={modalItem.size}
          format={modalItem.format}
          hasTransparency={modalItem.hasTransparency}
          onDownload={modalItem.onDownload}
        />
      )}
    </div>
  );
};
