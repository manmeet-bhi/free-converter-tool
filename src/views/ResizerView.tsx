import React, { useState, useEffect, useRef } from 'react';
import { ImageItem } from '../types';
import { DropZone } from '../components/DropZone';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import { ConversionProgressBar } from '../components/ConversionProgressBar';
import { 
  getAvailableOutputFormats, 
  ImageFormat 
} from '../utils/formatSupport';
import { 
  processImage, 
  formatBytes, 
  revokeUrl 
} from '../utils/imageProcessor';
import { createZipArchive, downloadBlob } from '../utils/zipExporter';
import { 
  Scaling, 
  Download, 
  Trash2, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Archive, 
  RefreshCw, 
  Sliders, 
  Eye, 
  CheckCircle2,
  Sparkles,
  Plus,
  Crop
} from 'lucide-react';
import { ImageEditorModal } from '../components/ImageEditorModal';
import confetti from 'canvas-confetti';

interface ResizerViewProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onFilesSelected: (files: File[]) => void;
}

interface SocialPreset {
  category: string;
  name: string;
  width: number;
  height: number;
}

const SOCIAL_PRESETS: SocialPreset[] = [
  { category: 'Social Media', name: 'Instagram Square (1:1)', width: 1080, height: 1080 },
  { category: 'Social Media', name: 'Instagram Portrait (4:5)', width: 1080, height: 1350 },
  { category: 'Social Media', name: 'Instagram / TikTok Story (9:16)', width: 1080, height: 1920 },
  { category: 'Social Media', name: 'Twitter / X Post (16:9)', width: 1200, height: 675 },
  { category: 'Social Media', name: 'Twitter / X Banner', width: 1500, height: 500 },
  { category: 'Social Media', name: 'YouTube Thumbnail (16:9)', width: 1280, height: 720 },
  { category: 'Social Media', name: 'Facebook Cover', width: 820, height: 312 },
  { category: 'Social Media', name: 'LinkedIn Banner', width: 1584, height: 396 },
  { category: 'Display & Web', name: 'Full HD (1080p)', width: 1920, height: 1080 },
  { category: 'Display & Web', name: '4K Ultra HD', width: 3840, height: 2160 },
  { category: 'Icons', name: 'Favicon standard', width: 32, height: 32 },
  { category: 'Icons', name: 'Favicon High-DPI', width: 64, height: 64 },
  { category: 'Icons', name: 'App Icon', width: 256, height: 256 },
];

export const ResizerView: React.FC<ResizerViewProps> = ({
  images,
  setImages,
  onFilesSelected,
}) => {
  const availableFormats = getAvailableOutputFormats();
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [targetHeight, setTargetHeight] = useState<number>(800);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>('webp');
  const [quality, setQuality] = useState<number>(0.85);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resizingFileName, setResizingFileName] = useState<string>('');
  const [completedResizeCount, setCompletedResizeCount] = useState<number>(0);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Image Editor Modal state
  const [editingItem, setEditingItem] = useState<ImageItem | null>(null);

  // Sync initial dimensions with first image if available
  useEffect(() => {
    if (images.length > 0 && images[0]) {
      setTargetWidth(images[0].originalDimensions.width);
      setTargetHeight(images[0].originalDimensions.height);
    }
  }, [images]);

  // Handle Width change with aspect ratio maintain
  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (maintainAspect && images[0]) {
      const ratio = images[0].originalDimensions.width / images[0].originalDimensions.height;
      setTargetHeight(Math.max(1, Math.round(val / ratio)));
    }
  };

  // Handle Height change with aspect ratio maintain
  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (maintainAspect && images[0]) {
      const ratio = images[0].originalDimensions.width / images[0].originalDimensions.height;
      setTargetWidth(Math.max(1, Math.round(val * ratio)));
    }
  };

  // Percentage quick scale buttons (e.g. 50%, 75%, 200%)
  const handleApplyPercent = (pct: number) => {
    setScalePercent(pct);
    if (images[0]) {
      const newW = Math.max(1, Math.round((images[0].originalDimensions.width * pct) / 100));
      const newH = Math.max(1, Math.round((images[0].originalDimensions.height * pct) / 100));
      setTargetWidth(newW);
      setTargetHeight(newH);
    }
  };

  // Preset selector
  const handleSelectPreset = (preset: SocialPreset) => {
    setTargetWidth(preset.width);
    setTargetHeight(preset.height);
    setMaintainAspect(false); // Presets have explicit custom dimensions
  };

  // Resize a single item
  const resizeSingleItem = async (item: ImageItem, w: number, h: number) => {
    setImages((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', error: undefined } : i))
    );

    try {
      if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);

      // Calculate actual width and height for this specific item if aspect ratio is locked
      let finalW = w;
      let finalH = h;

      if (maintainAspect) {
        const itemRatio = item.originalDimensions.width / item.originalDimensions.height;
        finalW = w;
        finalH = Math.max(1, Math.round(w / itemRatio));
      }

      const result = await processImage(item.originalInfo, {
        format: selectedFormat,
        quality,
        width: finalW,
        height: finalH,
        backgroundColor: item.backgroundColor,
        originalSizeBytes: item.originalSize,
      });

      // Update filename extension
      const currentName = item.customFilename;
      const lastDot = currentName.lastIndexOf('.');
      const base = lastDot !== -1 ? currentName.slice(0, lastDot) : currentName;
      const targetExt = selectedFormat === 'jpeg' ? '.jpg' : `.${selectedFormat}`;
      const newName = `${base}-${finalW}x${finalH}${targetExt}`;

      setImages((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'done',
                result,
                customFilename: newName,
                targetWidth: finalW,
                targetHeight: finalH,
                targetFormat: selectedFormat,
              }
            : i
        )
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Resizing failed.';
      setImages((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: message } : i))
      );
    }
  };

  // Resize all images in queue
  const handleResizeAll = async () => {
    setIsProcessing(true);
    setCompletedResizeCount(0);
    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      setResizingFileName(item.customFilename);
      await resizeSingleItem(item, targetWidth, targetHeight);
      setCompletedResizeCount(i + 1);
    }
    setResizingFileName('');
    setIsProcessing(false);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
  };

  // Download all completed as ZIP
  const handleDownloadAllZip = async () => {
    const completedItems = images.filter((i) => i.status === 'done' && i.result);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    const filesToZip = completedItems.map((item) => ({
      filename: item.customFilename,
      blob: item.result!.blob,
    }));

    try {
      await createZipArchive(filesToZip, `imagekit-resized-${Date.now()}.zip`);
    } catch {
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const isUpscaling = images[0] && (targetWidth > images[0].originalDimensions.width || targetHeight > images[0].originalDimensions.height);
  const completedCount = images.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto px-4">
      {/* Hidden file input for adding more images */}
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.ico"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
              <Scaling className="w-5 h-5" />
            </div>
            <span>Image Resizer</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Resize image dimensions by exact pixels, percentages, or one-click social media presets.
          </p>
        </div>

        {images.length > 0 && (
          <div className="flex items-center space-x-2">
            {images.length < 20 ? (
              <button
                onClick={() => addMoreInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-900 transition-colors"
                title="Add more images to resize"
              >
                <Plus className="w-4 h-4" />
                <span>Add More</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                Max Limit (20/20)
              </span>
            )}
            <button
              onClick={() => {
                images.forEach((item) => {
                  if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
                  if (item.originalInfo.previewUrl) revokeUrl(item.originalInfo.previewUrl);
                });
                setImages([]);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Queue</span>
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone: Shown ONLY when NO images are loaded, strictly hidden when image(s) exist */}
      {images.length === 0 && (
        <div className="pt-4 max-w-2xl mx-auto w-full">
          <DropZone
            onFilesSelected={onFilesSelected}
            title="Drop images here to start"
            subtitle="JPG, PNG, WebP, AVIF, SVG, GIF, BMP, ICO"
          />
        </div>
      )}

      {/* Batch Resizing Preloader & Progress Bar */}
      <ConversionProgressBar
        isProcessing={isProcessing}
        totalCount={images.length}
        completedCount={completedResizeCount || completedCount}
        currentFileName={resizingFileName}
        targetFormat={selectedFormat}
        actionLabel="Resizing"
      />

      {images.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Dimension inputs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Dimensions (Pixels)
                </label>
                <button
                  type="button"
                  onClick={() => setMaintainAspect(!maintainAspect)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    maintainAspect
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                  title="Toggle Maintain Aspect Ratio"
                >
                  {maintainAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{maintainAspect ? 'Ratio Locked' : 'Unlocked'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Width (px)</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                    className="w-full text-base font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Height (px)</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                    className="w-full text-base font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Percentage Scaling */}
            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                Quick Scale by Percentage
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[25, 50, 75, 100, 150].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyPercent(pct)}
                    className={`py-2 rounded-xl text-sm font-mono font-bold border transition-colors ${
                      scalePercent === pct
                        ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Social Media & Platform Presets */}
            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                Social Media & Web Presets
              </label>
              <select
                onChange={(e) => {
                  const preset = SOCIAL_PRESETS.find((p) => p.name === e.target.value);
                  if (preset) handleSelectPreset(preset);
                }}
                defaultValue=""
                className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="" disabled>Choose a platform preset...</option>
                {SOCIAL_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.width}×{p.height})
                  </option>
                ))}
              </select>
            </div>

            {/* Upscaling Warning Notice */}
            {isUpscaling && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start space-x-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Upscaling Notice:</strong> Target dimensions exceed original image size. Upscaling may result in slight softness or pixelation.
                </div>
              </div>
            )}

            {/* Output Format and Quality */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Export Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as ImageFormat)}
                  className="text-sm font-bold uppercase px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {availableFormats.map((f) => (
                    <option key={f.id} value={f.id} disabled={!f.canEncode}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedFormat === 'jpeg' || selectedFormat === 'webp') && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Quality:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-28 accent-cyan-600 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={handleResizeAll}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-base font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-98"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Resizing...' : images.length > 1 ? `Resize All (${images.length})` : 'Resize'}</span>
              </button>

              {completedCount > 0 && (
                <button
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="relative p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center group flex-shrink-0"
                  title={isZipping ? 'Archiving ZIP...' : `Download all (${completedCount}) resized images as ZIP`}
                  aria-label={isZipping ? 'Archiving ZIP...' : `Download all (${completedCount}) resized images as ZIP`}
                >
                  {isZipping ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Archive className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded-full bg-slate-900 dark:bg-slate-950 text-emerald-400 border border-emerald-500/60 shadow-xs uppercase tracking-tight">
                    {isZipping ? '...' : `${completedCount > 1 ? completedCount : ''}ZIP`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Results List (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {images.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all ${
                  item.status === 'done'
                    ? 'border-emerald-300 dark:border-emerald-900/60 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Thumbnail and Info */}
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-checkerboard-light dark:bg-checkerboard-dark flex items-center justify-center">
                      <img
                        src={item.result?.previewUrl || item.originalInfo.previewUrl}
                        alt={item.customFilename}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-base truncate max-w-xs sm:max-w-md">
                        {item.customFilename}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono flex flex-wrap items-center gap-2">
                        <span>Original: {item.originalDimensions.width}×{item.originalDimensions.height}</span>
                        {item.result && (
                          <>
                            <span>&rarr;</span>
                            <span className="font-bold text-cyan-600 dark:text-cyan-400">
                              Target: {item.result.width}×{item.result.height} px
                            </span>
                            <span>•</span>
                            <span>{formatBytes(item.result.fileSizeBytes)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual actions */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    {/* Edit (Crop, Rotate, Flip) button */}
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Edit image (Crop, Rotate, Flip)"
                    >
                      <Crop className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Edit</span>
                    </button>

                    {item.result ? (
                      <button
                        onClick={() => downloadBlob(item.result!.blob, item.customFilename)}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95 flex items-center justify-center"
                        title={`Download ${item.customFilename}`}
                        aria-label={`Download ${item.customFilename}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => resizeSingleItem(item, targetWidth, targetHeight)}
                        disabled={item.status === 'processing'}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm disabled:opacity-50 transition-all active:scale-95"
                      >
                        <RefreshCw className={`w-4 h-4 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                        <span>{item.status === 'processing' ? 'Resizing...' : 'Resize'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Item-level Resizing Preloader & Progress Bar */}
                {item.status === 'processing' && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs text-cyan-600 dark:text-cyan-400 font-bold">
                      <span className="flex items-center space-x-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                        <span>Resizing canvas dimensions to {targetWidth}×{targetHeight} px...</span>
                      </span>
                      <span className="animate-pulse">Active</span>
                    </div>
                    <div 
                      className="w-full bg-slate-200 dark:bg-slate-800 rounded-md h-3.5 p-0.5 overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700"
                      role="progressbar"
                      aria-label={`Resizing ${item.customFilename}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="bg-cyan-600 dark:bg-cyan-500 h-full rounded-xs w-full relative overflow-hidden shadow-xs">
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/25 rounded-t-xs" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Editor Modal (Crop, Rotate, Flip) */}
      <ImageEditorModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        imageItem={editingItem}
        onSave={(updatedItem) => {
          setImages((prev) =>
            prev.map((img) => (img.id === updatedItem.id ? updatedItem : img))
          );
        }}
      />
    </div>
  );
};
