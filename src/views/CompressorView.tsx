import React, { useState, useEffect, useRef } from 'react';
import { ImageItem, CompressionPreset } from '../types';
import { DropZone } from '../components/DropZone';
import { CompareSlider } from '../components/CompareSlider';
import { ImageCard } from '../components/ImageCard';
import {
  getAvailableOutputFormats,
  ImageFormat,
} from '../utils/formatSupport';
import {
  processImage,
  formatBytes,
  calculateSavings,
  revokeUrl,
} from '../utils/imageProcessor';
import { createZipArchive, downloadBlob } from '../utils/zipExporter';
import {
  Plus,
  Sliders,
  Trash2,
  Crop,
  RotateCw,
  Info,
  X,
  Archive,
  RefreshCw,
  CheckCircle2,
  Download,
  ArrowRight,
  Sparkles,
  Check,
  Eye,
  Settings,
  ChevronDown,
  Minimize2,
} from 'lucide-react';
import { ImageEditorModal } from '../components/ImageEditorModal';
import confetti from 'canvas-confetti';

interface CompressorViewProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onFilesSelected: (files: File[]) => void;
  hideHeader?: boolean;
}

export const CompressorView: React.FC<CompressorViewProps> = ({
  images,
  setImages,
  onFilesSelected,
  hideHeader = false,
}) => {
  const availableFormats = getAvailableOutputFormats().filter(
    (f) => f.id === 'jpeg' || f.id === 'png' || f.id === 'webp' || f.id === 'avif'
  );

  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>('balanced');
  const [quality, setQuality] = useState<number>(0.75);
  const [qualityInput, setQualityInput] = useState<string>('75');
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('webp');
  const [useTargetSize, setUseTargetSize] = useState<boolean>(false);
  const [targetSizeInput, setTargetSizeInput] = useState<string>('250');
  const [targetSizeUnit, setTargetSizeUnit] = useState<'KB' | 'MB'>('KB');
  const [resizePercent, setResizePercent] = useState<number>(100);
  const [resizePercentInput, setResizePercentInput] = useState<string>('100');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [compressingFileName, setCompressingFileName] = useState<string>('');
  const [completedCompressCount, setCompletedCompressCount] = useState<number>(0);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Selection state for checkbox batch compression
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Info card popover state
  const [infoItemId, setInfoItemId] = useState<string | null>(null);

  // Sorting state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Compare Modal state (for Before vs After comparison slider)
  const [comparingItem, setComparingItem] = useState<ImageItem | null>(null);

  // Image Editor Modal state
  const [editingItem, setEditingItem] = useState<ImageItem | null>(null);

  // Mobile settings drawer/collapsible state
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState<boolean>(false);

  // Automatically keep selectedIds in sync with images, default newly loaded images to selected
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      images.forEach((img) => {
        if (!prev.has(img.id)) {
          next.add(img.id);
        }
      });
      const validIds = new Set(images.map((i) => i.id));
      for (const id of next) {
        if (!validIds.has(id)) next.delete(id);
      }
      return next;
    });
  }, [images]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((i) => i.id)));
    }
  };

  const handleSortImages = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setImages((prev) =>
      [...prev].sort((a, b) =>
        sortDirection === 'asc'
          ? a.customFilename.localeCompare(b.customFilename)
          : b.customFilename.localeCompare(a.customFilename)
      )
    );
  };

  const handleClearAll = () => {
    images.forEach((item) => {
      if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
      if (item.originalInfo.previewUrl) revokeUrl(item.originalInfo.previewUrl);
    });
    setImages([]);
    setSelectedIds(new Set());
  };

  const handleRemoveImage = (id: string) => {
    const item = images.find((i) => i.id === id);
    if (item?.result?.previewUrl) revokeUrl(item.result.previewUrl);
    if (item?.originalInfo.previewUrl) revokeUrl(item.originalInfo.previewUrl);
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  // Quick Rotate 90 degrees handler
  const handleQuickRotate = async (item: ImageItem) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = item.originalDimensions.height;
      canvas.height = item.originalDimensions.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      const img = new Image();
      img.src = item.originalInfo.previewUrl;
      await new Promise((res) => {
        img.onload = res;
      });
      ctx.drawImage(img, -item.originalDimensions.width / 2, -item.originalDimensions.height / 2);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const newPreviewUrl = URL.createObjectURL(blob);
        setImages((prev) =>
          prev.map((i) => {
            if (i.id !== item.id) return i;
            return {
              ...i,
              originalInfo: {
                ...i.originalInfo,
                previewUrl: newPreviewUrl,
                width: canvas.width,
                height: canvas.height,
              },
              originalDimensions: {
                width: canvas.width,
                height: canvas.height,
              },
              status: 'idle',
              result: undefined,
            };
          })
        );
      }, 'image/png');
    } catch (e) {
      console.error(e);
    }
  };

  // Preset configuration handler
  const handlePresetChange = (preset: CompressionPreset) => {
    setSelectedPreset(preset);
    if (preset === 'max') {
      setQuality(0.4);
      setQualityInput('40');
      setResizePercent(90);
      setResizePercentInput('90');
    } else if (preset === 'balanced') {
      setQuality(0.75);
      setQualityInput('75');
      setResizePercent(100);
      setResizePercentInput('100');
    } else if (preset === 'high') {
      setQuality(0.9);
      setQualityInput('90');
      setResizePercent(100);
      setResizePercentInput('100');
    }
  };

  // Compress a single image
  const compressItem = async (item: ImageItem) => {
    setImages((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', error: undefined } : i))
    );

    const startTime = Date.now();

    try {
      if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);

      // Compute target width/height from resizePercent
      const targetW = Math.round((item.originalDimensions.width * resizePercent) / 100);
      const targetH = Math.round((item.originalDimensions.height * resizePercent) / 100);

      let targetBytes: number | undefined = undefined;
      if (useTargetSize) {
        const num = parseFloat(targetSizeInput);
        if (!isNaN(num) && num > 0) {
          targetBytes = targetSizeUnit === 'MB' ? num * 1024 * 1024 : num * 1024;
        }
      }

      const result = await processImage(item.originalInfo, {
        format: targetFormat,
        quality,
        width: targetW,
        height: targetH,
        backgroundColor: item.backgroundColor,
        targetSizeBytes: targetBytes,
        originalSizeBytes: item.originalSize,
      });

      // Update filename extension if format changed
      const currentName = item.customFilename;
      const lastDot = currentName.lastIndexOf('.');
      const base = lastDot !== -1 ? currentName.slice(0, lastDot) : currentName;
      const targetExt = targetFormat === 'jpeg' ? '.jpg' : `.${targetFormat}`;
      const newFilename = `${base}${targetExt}`;

      // Ensure at least 320ms so user can see smooth blurred progress animation
      const elapsed = Date.now() - startTime;
      if (elapsed < 320) {
        await new Promise((resolve) => setTimeout(resolve, 320 - elapsed));
      }

      setImages((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'done',
                result,
                targetFormat,
                targetQuality: quality,
                customFilename: newFilename,
                targetWidth: result.width,
                targetHeight: result.height,
              }
            : i
        )
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Compression error.';
      setImages((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: message } : i))
      );
    }
  };

  // Compress selected images in queue
  const handleCompressSelected = async () => {
    const itemsToCompress = images.filter((img) => selectedIds.has(img.id));
    if (itemsToCompress.length === 0) return;

    setIsProcessing(true);
    setCompletedCompressCount(0);
    for (let i = 0; i < itemsToCompress.length; i++) {
      const item = itemsToCompress[i];
      setCompressingFileName(item.customFilename);
      await compressItem(item);
      setCompletedCompressCount(i + 1);
    }
    setCompressingFileName('');
    setIsProcessing(false);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
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
      await createZipArchive(filesToZip, `imagetooltip-compressed-${Date.now()}.zip`);
    } catch {
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = images.filter((i) => i.status === 'done').length;

  // If no images are present, show the standard clean DropZone with View Header (matching ConverterView)
  if (images.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 max-w-6xl mx-auto px-3 sm:px-4">
        {/* Hidden file input */}
        <input
          ref={addMoreInputRef}
          id="compressor-file-input-empty"
          name="compressorFiles"
          type="file"
          multiple
          autoComplete="off"
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
        {!hideHeader && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Minimize2 className="w-5 h-5" />
                </div>
                <span>Image Compressor</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Compress JPG, PNG, WebP, and AVIF images with minimal loss of visual quality in batch with full privacy.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 max-w-2xl mx-auto w-full">
          <DropZone
            onFilesSelected={onFilesSelected}
            title="Drop images here to start"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Hidden file input for adding more images */}
      <input
        ref={addMoreInputRef}
        id="compressor-file-input"
        name="compressorFilesActive"
        type="file"
        multiple
        autoComplete="off"
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.ico"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Two-Column Editor Layout (Matches ResizerView) */}
      {images.length > 0 && (
        <div className="flex-1 flex flex-col lg:flex-row w-full items-stretch">
          {/* MOBILE CONTROLS TOGGLE BAR (Visible on mobile screens) */}
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between z-20">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Format:
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 uppercase">
                {targetFormat === 'jpeg' ? 'JPG' : targetFormat}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {Math.round(quality * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSettingsOpen((prev) => !prev)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-blue-500" />
              <span>{isMobileSettingsOpen ? 'Hide Options' : 'Edit Options'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMobileSettingsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* LEFT SIDEBAR: Settings Panel (Sticky on desktop, pinned CTA) */}
          <div
            className={`w-full lg:w-80 xl:w-96 shrink-0 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex flex-col justify-between transition-colors z-20 ${
              isMobileSettingsOpen ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Scrollable Upper Settings Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Top Action Bar: Add More, Sort, Clear */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  Compressor Queue ({images.length})
                </span>
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    title="Add More Images"
                    className="p-2 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSortImages}
                    title={`Sort by filename (${sortDirection.toUpperCase()})`}
                    className="p-2 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    title="Clear All Images"
                    className="p-2 sm:p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* File Selection Status & Select All */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <label htmlFor="compressor-select-all" className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    id="compressor-select-all"
                    name="selectAll"
                    type="checkbox"
                    checked={images.length > 0 && selectedIds.size === images.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-normal text-slate-700 dark:text-slate-300">
                    Select All
                  </span>
                </label>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                  {selectedIds.size} of {images.length} selected
                </span>
              </div>

              {/* Target Output Format Dropdown (Regular font weight label) */}
              <div className="space-y-2">
                <label htmlFor="compressor-format-select" className="text-xs font-normal text-slate-600 dark:text-slate-400 block">
                  Output Format
                </label>
                <div className="relative">
                  <select
                    id="compressor-format-select"
                    name="outputFormat"
                    autoComplete="off"
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value as ImageFormat)}
                    className="w-full py-2.5 px-3.5 pr-8 rounded-xl text-xs sm:text-sm font-medium border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer appearance-none"
                  >
                    {availableFormats.map((f) => (
                      <option key={f.id} value={f.id} disabled={!f.canEncode}>
                        {f.id === 'jpeg' ? 'JPG' : f.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Quality Slider & Input (Regular font weight label) */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label htmlFor="compressor-quality-input" className="font-normal text-slate-600 dark:text-slate-400">
                    Quality Level:
                  </label>
                  <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <input
                      id="compressor-quality-input"
                      name="quality"
                      type="number"
                      autoComplete="off"
                      min="1"
                      max="100"
                      value={qualityInput}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        setQualityInput(valStr);
                        const num = parseFloat(valStr);
                        if (!isNaN(num) && num > 0) {
                          const clamped = Math.max(0.01, Math.min(1.0, num / 100));
                          setQuality(clamped);
                        }
                      }}
                      onBlur={() => {
                        const num = parseFloat(qualityInput);
                        if (isNaN(num) || num < 1) {
                          setQuality(0.05);
                          setQualityInput('5');
                        } else if (num > 100) {
                          setQuality(1.0);
                          setQualityInput('100');
                        } else {
                          const rounded = Math.round(num);
                          setQuality(rounded / 100);
                          setQualityInput(rounded.toString());
                        }
                      }}
                      placeholder="75"
                      className="w-14 sm:w-16 font-mono font-bold text-right text-xs sm:text-sm px-1.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-mono font-bold text-slate-500 dark:text-slate-400 text-xs sm:text-sm">%</span>
                  </div>
                </div>
                <input
                  id="compressor-quality-slider"
                  name="qualitySlider"
                  type="range"
                  autoComplete="off"
                  min="0.05"
                  max="1.0"
                  step="0.01"
                  value={quality}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setQuality(val);
                    setQualityInput(Math.round(val * 100).toString());
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Target File Size Mode (Direct input, regular font weight label) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="compressor-target-size" className="text-xs font-normal text-slate-600 dark:text-slate-400">
                    Target File Size (Optional)
                  </label>
                  {targetSizeInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetSizeInput('');
                        setUseTargetSize(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="compressor-target-size"
                    name="targetSize"
                    type="number"
                    autoComplete="off"
                    min="5"
                    max="50000"
                    value={targetSizeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTargetSizeInput(val);
                      setUseTargetSize(val.trim() !== '' && parseInt(val) > 0);
                    }}
                    placeholder="e.g. 250"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                  <select
                    id="compressor-target-unit"
                    name="targetSizeUnit"
                    autoComplete="off"
                    value={targetSizeUnit}
                    onChange={(e) => setTargetSizeUnit(e.target.value as 'KB' | 'MB')}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                  </select>
                </div>
              </div>

              {/* Scale Dimensions Control (Regular font weight label) */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label htmlFor="compressor-resize-percent" className="font-normal text-slate-600 dark:text-slate-400">
                    Scale Dimensions:
                  </label>
                  <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <input
                      id="compressor-resize-percent"
                      name="resizePercent"
                      type="number"
                      autoComplete="off"
                      min="10"
                      max="300"
                      value={resizePercentInput}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        setResizePercentInput(valStr);
                        const num = parseInt(valStr);
                        if (!isNaN(num) && num > 0) {
                          setResizePercent(Math.max(10, Math.min(300, num)));
                        }
                      }}
                      className="w-14 sm:w-16 font-mono font-bold text-right text-xs sm:text-sm px-1.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:outline-none"
                    />
                    <span className="font-mono font-bold text-slate-500 dark:text-slate-400 text-xs sm:text-sm">%</span>
                  </div>
                </div>
                <input
                  id="compressor-resize-slider"
                  name="resizePercentSlider"
                  type="range"
                  autoComplete="off"
                  min="10"
                  max="100"
                  step="5"
                  value={Math.min(100, resizePercent)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setResizePercent(val);
                    setResizePercentInput(val.toString());
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Bottom Sticky Action Bar: Compress CTA Button & Download ZIP (Always visible!) */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 space-y-2.5">
              <button
                type="button"
                onClick={handleCompressSelected}
                disabled={isProcessing || selectedIds.size === 0}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 cursor-pointer text-center"
              >
                {isProcessing
                  ? `Compressing (${completedCompressCount}/${selectedIds.size})...`
                  : selectedIds.size === 0
                  ? 'Select Images to Compress'
                  : selectedIds.size === 1
                  ? `Compress to ${targetFormat === 'jpeg' ? 'JPG' : targetFormat.toUpperCase()}`
                  : `Compress (${selectedIds.size}) to ${targetFormat === 'jpeg' ? 'JPG' : targetFormat.toUpperCase()}`}
              </button>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-98 cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                  <span>Download All as ZIP ({completedCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT WORKSPACE: Canvas Area */}
          <div className="flex-1 bg-slate-100/70 dark:bg-slate-950 p-3 sm:p-6 lg:p-8 min-h-[500px] overflow-y-auto pb-24 lg:pb-8 transition-colors">
            {/* Grid of Image Cards using Modular ImageCard Component */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
              {images.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  targetFormat={targetFormat}
                  processingLabel="Compressing"
                  onToggleSelect={toggleSelect}
                  onRemove={handleRemoveImage}
                  onRotate={handleQuickRotate}
                  onCrop={(img) => setEditingItem(img)}
                  onPreview={(img) => setComparingItem(img)}
                  previewLabel="Compare"
                  onProcessSingle={(id) => {
                    const itm = images.find((x) => x.id === id);
                    if (itm) compressItem(itm);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM ACTION BAR (Exact Parity & Mobile Friendly) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-3 z-30 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => setIsMobileSettingsOpen((prev) => !prev)}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 text-xs font-bold"
        >
          <Settings className="w-4 h-4 text-blue-500" />
          <span className="hidden sm:inline">Options</span>
        </button>

        <button
          type="button"
          onClick={handleCompressSelected}
          disabled={isProcessing || selectedIds.size === 0}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all text-center"
        >
          {isProcessing
            ? `Compressing (${completedCompressCount}/${selectedIds.size})...`
            : selectedIds.size === 0
            ? 'Select Images'
            : `Compress (${selectedIds.size}) to ${targetFormat === 'jpeg' ? 'JPG' : targetFormat.toUpperCase()}`}
        </button>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center justify-center shadow-md shadow-emerald-500/20"
            title="Download ZIP"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Compare Modal */}
      {comparingItem && comparingItem.result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Before vs After Comparison
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-md">
                  {comparingItem.customFilename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComparingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 p-2">
              <CompareSlider
                originalUrl={comparingItem.originalInfo.previewUrl}
                processedUrl={comparingItem.result.previewUrl}
                originalLabel="Original"
                processedLabel={`Compressed (${targetFormat.toUpperCase()})`}
                originalSizeText={formatBytes(comparingItem.originalSize)}
                processedSizeText={formatBytes(comparingItem.result.fileSizeBytes)}
                hasTransparency={comparingItem.originalInfo.hasTransparency}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                Reduced by: <strong className="text-emerald-600 dark:text-emerald-400">{calculateSavings(comparingItem.originalSize, comparingItem.result.fileSizeBytes).percent}%</strong>
              </div>
              <button
                type="button"
                onClick={() => downloadBlob(comparingItem.result!.blob, comparingItem.customFilename)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </button>
            </div>
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
