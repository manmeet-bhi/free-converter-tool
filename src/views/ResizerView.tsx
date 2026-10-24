import React, { useState, useEffect, useRef } from 'react';
import { ImageItem } from '../types';
import { DropZone } from '../components/DropZone';
import { ImageCard } from '../components/ImageCard';
import {
  getAvailableOutputFormats,
  ImageFormat
} from '../utils/formatSupport';
import {
  processImage,
  formatBytes,
  revokeUrl,
  ImageFitMode
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
  Lock,
  Unlock,
  AlertTriangle,
  Archive,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Download,
  ArrowRight,
  Sparkles,
  Maximize2,
  Check,
  Settings,
  Eye,
  Scaling,
} from 'lucide-react';
import { ImageEditorModal } from '../components/ImageEditorModal';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import confetti from 'canvas-confetti';

interface ResizerViewProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onFilesSelected: (files: File[]) => void;
  hideHeader?: boolean;
}

interface SocialPreset {
  category: string;
  name: string;
  width: number;
  height: number;
}

type ResizeMode = 'size' | 'percentage' | 'social';
type UnitType = 'px' | '%' | 'in' | 'cm' | 'mm';

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
  { category: 'Icons', name: 'Favicon Standard', width: 32, height: 32 },
  { category: 'Icons', name: 'Favicon High-DPI', width: 64, height: 64 },
  { category: 'Icons', name: 'App Icon', width: 256, height: 256 },
];

export const ResizerView: React.FC<ResizerViewProps> = ({
  images,
  setImages,
  onFilesSelected,
  hideHeader = false,
}) => {
  const availableFormats = getAvailableOutputFormats().filter(
    (f) => f.id === 'jpeg' || f.id === 'png' || f.id === 'webp' || f.id === 'avif'
  );
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Resize Settings Mode: By Size | As Percentage | Social Media
  const [resizeMode, setResizeMode] = useState<ResizeMode>('size');

  // Dimension settings
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [targetHeight, setTargetHeight] = useState<number>(800);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [unit, setUnit] = useState<UnitType>('px');
  const [scalePercent, setScalePercent] = useState<number>(100);

  // Advanced export settings
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>('webp');
  const [quality, setQuality] = useState<number>(0.85);
  const [qualityInput, setQualityInput] = useState<string>('85');
  const [fitMode, setFitMode] = useState<ImageFitMode>('cover');
  const [containBgColor, setContainBgColor] = useState<string>('#ffffff');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Selection state for checkbox resizing
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Mobile settings drawer/collapsible state
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState<boolean>(false);

  // Target output file size option
  const [useTargetSize, setUseTargetSize] = useState<boolean>(false);
  const [targetSizeInput, setTargetSizeInput] = useState<string>('200');
  const [targetSizeUnit, setTargetSizeUnit] = useState<'KB' | 'MB'>('KB');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resizingFileName, setResizingFileName] = useState<string>('');
  const [completedResizeCount, setCompletedResizeCount] = useState<number>(0);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Image Editor Modal state
  const [editingItem, setEditingItem] = useState<ImageItem | null>(null);

  // Full Preview Modal state
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

  // Info card popover state
  const [infoItemId, setInfoItemId] = useState<string | null>(null);

  // Sorting state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sync initial dimensions with first image if available
  useEffect(() => {
    if (images.length > 0 && images[0]) {
      setTargetWidth(images[0].originalDimensions.width);
      setTargetHeight(images[0].originalDimensions.height);
    }
  }, [images.length]);

  // Keep selectedIds in sync with images, default newly loaded images to selected
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

  // Unit conversion helper
  const handleUnitChange = (newUnit: UnitType) => {
    setUnit(newUnit);
    if (newUnit === '%') {
      setResizeMode('percentage');
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
    setMaintainAspect(false);
    setFitMode('cover');
  };

  // Quick Rotate 90° Clockwise
  const handleQuickRotate = async (item: ImageItem) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.originalInfo.previewUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const newBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!newBlob) return;

      const newPreviewUrl = URL.createObjectURL(newBlob);
      const updatedOriginalInfo = {
        ...item.originalInfo,
        width: canvas.width,
        height: canvas.height,
        previewUrl: newPreviewUrl,
      };

      setImages((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
              ...i,
              originalDimensions: { width: canvas.width, height: canvas.height },
              originalInfo: updatedOriginalInfo,
              result: undefined,
              status: 'idle',
            }
            : i
        )
      );
    } catch {
      setEditingItem(item);
    }
  };

  // Sort images in queue
  const handleSortImages = () => {
    const nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(nextDir);
    setImages((prev) =>
      [...prev].sort((a, b) =>
        nextDir === 'asc'
          ? a.customFilename.localeCompare(b.customFilename)
          : b.customFilename.localeCompare(a.customFilename)
      )
    );
  };

  // Delete single image
  const handleRemoveImage = (id: string) => {
    const item = images.find((i) => i.id === id);
    if (item?.result?.previewUrl) revokeUrl(item.result.previewUrl);
    if (item?.originalInfo.previewUrl) revokeUrl(item.originalInfo.previewUrl);
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear all images
  const handleClearAll = () => {
    images.forEach((item) => {
      if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
      if (item.originalInfo.previewUrl) revokeUrl(item.originalInfo.previewUrl);
    });
    setImages([]);
  };

  // Compute final dimensions for a given item based on settings
  const getItemFinalDimensions = (item: ImageItem): { width: number; height: number } => {
    if (resizeMode === 'percentage') {
      const w = Math.max(1, Math.round((item.originalDimensions.width * scalePercent) / 100));
      const h = Math.max(1, Math.round((item.originalDimensions.height * scalePercent) / 100));
      return { width: w, height: h };
    }

    if (resizeMode === 'social') {
      return { width: targetWidth, height: targetHeight };
    }

    if (maintainAspect) {
      const itemRatio = item.originalDimensions.width / item.originalDimensions.height;
      if (item.originalDimensions.width >= item.originalDimensions.height) {
        const finalW = targetWidth;
        const finalH = Math.max(1, Math.round(targetWidth / itemRatio));
        return { width: finalW, height: finalH };
      } else {
        const finalH = targetHeight;
        const finalW = Math.max(1, Math.round(targetHeight * itemRatio));
        return { width: finalW, height: finalH };
      }
    }

    return { width: targetWidth, height: targetHeight };
  };

  // Resize a single item
  const resizeSingleItem = async (item: ImageItem) => {
    setImages((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', error: undefined } : i))
    );

    const startTime = Date.now();

    try {
      if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);

      const { width: finalW, height: finalH } = getItemFinalDimensions(item);

      let targetBytes: number | undefined = undefined;
      if (useTargetSize) {
        const num = parseFloat(targetSizeInput);
        if (!isNaN(num) && num > 0) {
          targetBytes = targetSizeUnit === 'MB' ? num * 1024 * 1024 : num * 1024;
        }
      }

      const result = await processImage(item.originalInfo, {
        format: selectedFormat,
        quality: quality,
        width: finalW,
        height: finalH,
        fit: fitMode,
        backgroundColor: fitMode === 'contain' ? containBgColor : (item.backgroundColor || '#ffffff'),
        targetSizeBytes: targetBytes,
        originalSizeBytes: item.originalSize,
      });

      // Update filename
      const currentName = item.customFilename;
      const lastDot = currentName.lastIndexOf('.');
      const base = lastDot !== -1 ? currentName.slice(0, lastDot) : currentName;
      const targetExt = selectedFormat === 'jpeg' ? '.jpg' : `.${selectedFormat}`;
      const newName = `${base}-${finalW}x${finalH}${targetExt}`;

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
              customFilename: newName,
              targetWidth: result.width || finalW,
              targetHeight: result.height || finalH,
              targetFormat: selectedFormat,
              targetSizeBytes: targetBytes,
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

  // Resize selected images in queue
  const handleResizeSelected = async () => {
    const itemsToResize = images.filter((img) => selectedIds.has(img.id));
    if (itemsToResize.length === 0) return;

    setIsProcessing(true);
    setCompletedResizeCount(0);
    for (let i = 0; i < itemsToResize.length; i++) {
      const item = itemsToResize[i];
      setResizingFileName(item.customFilename);
      await resizeSingleItem(item);
      setCompletedResizeCount(i + 1);
    }
    setResizingFileName('');
    setIsProcessing(false);
    confetti({ particleCount: 45, spread: 70, origin: { y: 0.85 } });
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
      await createZipArchive(filesToZip, `imagetooltip-resized-${Date.now()}.zip`);
    } catch {
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const isUpscaling = images[0] && (targetWidth > images[0].originalDimensions.width || targetHeight > images[0].originalDimensions.height);
  const completedItems = images.filter((i) => i.status === 'done' && i.result);
  const completedCount = completedItems.length;

  // If no images are present, show the standard clean DropZone with View Header (matching ConverterView)
  if (images.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 max-w-6xl mx-auto px-3 sm:px-4">
        {/* Hidden file input */}
        <input
          ref={addMoreInputRef}
          id="resizer-file-input-empty"
          name="resizerFiles"
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
                  <Scaling className="w-5 h-5" />
                </div>
                <span>Image Resizer</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Resize images by dimensions, percentages, or social presets with smart scaling in batch with full privacy.
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
        id="resizer-file-input"
        name="resizerFilesActive"
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

      {/* Two-Column Editor Layout */}
      {images.length > 0 && (
        <div className="flex-1 flex flex-col lg:flex-row w-full items-stretch">
          {/* MOBILE CONTROLS TOGGLE BAR (Visible on mobile screens) */}
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between z-20">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mode:
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 uppercase">
                {resizeMode}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {selectedFormat === 'jpeg' ? 'JPG' : selectedFormat.toUpperCase()}
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
            className={`w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex flex-col justify-between transition-colors z-20 ${
              isMobileSettingsOpen ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Scrollable Upper Settings Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Top Action Bar: Add More, Sort, Clear (Unified Design) */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  Resizer Queue ({images.length})
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
                <label htmlFor="resizer-select-all" className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    id="resizer-select-all"
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

              {/* Tab Selector: [ By Size ] [ As Percentage ] [ Social Media ] */}
              <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setResizeMode('size')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${resizeMode === 'size'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                  By Size
                </button>

                <button
                  type="button"
                  onClick={() => setResizeMode('percentage')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${resizeMode === 'percentage'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                  Percentage
                </button>

                <button
                  type="button"
                  onClick={() => setResizeMode('social')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${resizeMode === 'social'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                  Social Media
                </button>
              </div>

              {/* TAB 1: By Size Inputs (Width, Height, px unit, Lock Aspect Ratio) */}
              {resizeMode === 'size' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Width */}
                    <div>
                      <label htmlFor="resizer-width-input" className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Width</label>
                      <input
                        id="resizer-width-input"
                        name="targetWidth"
                        type="number"
                        autoComplete="off"
                        min="1"
                        max="20000"
                        value={targetWidth || ''}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                        placeholder="Enter Width"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Height with px dropdown */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="resizer-height-input" className="text-xs font-medium text-slate-700 dark:text-slate-300">Height</label>
                        <select
                          id="resizer-unit-select"
                          name="targetUnit"
                          autoComplete="off"
                          value={unit}
                          onChange={(e) => handleUnitChange(e.target.value as UnitType)}
                          className="bg-transparent border-none text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer focus:outline-none"
                        >
                          <option value="px" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">px ▾</option>
                          <option value="%" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">% ▾</option>
                        </select>
                      </div>
                      <input
                        id="resizer-height-input"
                        name="targetHeight"
                        type="number"
                        autoComplete="off"
                        min="1"
                        max="20000"
                        value={targetHeight || ''}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                        placeholder="Enter Height"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Lock Aspect Ratio Checkbox */}
                  <label htmlFor="resizer-maintain-aspect" className="flex items-center space-x-2.5 cursor-pointer pt-1 group select-none">
                    <input
                      id="resizer-maintain-aspect"
                      name="maintainAspect"
                      type="checkbox"
                      checked={maintainAspect}
                      onChange={(e) => setMaintainAspect(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Lock Aspect Ratio
                    </span>
                  </label>
                </div>
              )}

              {/* TAB 2: As Percentage */}
              {resizeMode === 'percentage' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <label htmlFor="resizer-scale-percent" className="text-slate-700 dark:text-slate-300">Scale Percentage</label>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">{scalePercent}%</span>
                  </div>

                  <input
                    id="resizer-scale-percent"
                    name="scalePercentage"
                    type="range"
                    autoComplete="off"
                    min="10"
                    max="300"
                    value={scalePercent}
                    onChange={(e) => handleApplyPercent(parseInt(e.target.value) || 100)}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />

                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[25, 50, 75, 100, 150].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyPercent(pct)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${scalePercent === pct
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                          }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {images[0] && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Calculated Dimensions:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                        {Math.round((images[0].originalDimensions.width * scalePercent) / 100)} ×{' '}
                        {Math.round((images[0].originalDimensions.height * scalePercent) / 100)} px
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Social Media Presets */}
              {resizeMode === 'social' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">Select Platform Preset</label>
                  <select
                    onChange={(e) => {
                      const preset = SOCIAL_PRESETS.find((p) => p.name === e.target.value);
                      if (preset) handleSelectPreset(preset);
                    }}
                    defaultValue=""
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Choose platform preset...</option>
                    {SOCIAL_PRESETS.map((p) => (
                      <option key={p.name} value={p.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {p.name} ({p.width} × {p.height})
                      </option>
                    ))}
                  </select>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>Target Resolution:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {targetWidth} × {targetHeight} px
                    </span>
                  </div>
                </div>
              )}

              {/* Fitting Strategy Selector (Prevents Instagram / Social media stretching) */}
              {(resizeMode === 'social' || (resizeMode === 'size' && !maintainAspect)) && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-normal text-slate-600 dark:text-slate-400">Fitting Strategy</label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Prevents Distortion</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFitMode('cover')}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${fitMode === 'cover'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-white shadow-sm ring-1 ring-blue-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <Crop className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Fill / Crop</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">No stretch, fills frame</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFitMode('contain')}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${fitMode === 'contain'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-white shadow-sm ring-1 ring-blue-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Fit / Pad</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Keeps full image</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFitMode('fill')}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${fitMode === 'fill'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-white shadow-sm ring-1 ring-amber-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Stretch</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">May distort</p>
                    </button>
                  </div>

                  {fitMode === 'contain' && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Margin Color:</span>
                      <div className="flex items-center space-x-2">
                        {[
                          { color: '#ffffff', label: 'White' },
                          { color: '#000000', label: 'Black' },
                          { color: '#0e131f', label: 'Dark' }
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setContainBgColor(c.color)}
                            className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${containBgColor === c.color ? 'scale-110 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600'
                              }`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          />
                        ))}
                        <input
                          id="resizer-contain-color"
                          name="containColor"
                          type="color"
                          autoComplete="off"
                          value={containBgColor}
                          onChange={(e) => setContainBgColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                          title="Custom Color"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Output Format Section (Dropdown Selector, regular font weight label) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label htmlFor="resizer-format-select" className="text-xs font-normal text-slate-600 dark:text-slate-400 block">
                  Output Format
                </label>
                <div className="relative">
                  <select
                    id="resizer-format-select"
                    name="outputFormat"
                    autoComplete="off"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as ImageFormat)}
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
                    <label htmlFor="resizer-quality-input" className="font-normal text-slate-600 dark:text-slate-400">
                      Quality Level:
                    </label>
                    <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <input
                        id="resizer-quality-input"
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
                        placeholder="85"
                        className="w-14 sm:w-16 font-mono font-bold text-right text-xs sm:text-sm px-1.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        title="Enter custom quality percentage (1-100%)"
                      />
                      <span className="font-mono font-bold text-slate-500 dark:text-slate-400 text-xs sm:text-sm">%</span>
                    </div>
                  </div>
                  <input
                    id="resizer-quality-slider"
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
                    <label htmlFor="resizer-target-size" className="text-xs font-normal text-slate-600 dark:text-slate-400">
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
                      id="resizer-target-size"
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
                      placeholder="e.g. 200"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                    />
                    <select
                      id="resizer-target-unit"
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
            </div>

            {/* Bottom Sticky Action Bar: Resize CTA Button & Download ZIP (Always visible!) */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 space-y-2.5">
              <button
                type="button"
                onClick={handleResizeSelected}
                disabled={isProcessing || selectedIds.size === 0}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 cursor-pointer text-center"
              >
                {isProcessing
                  ? `Resizing (${completedResizeCount}/${selectedIds.size})...`
                  : selectedIds.size === 0
                  ? 'Select Images to Resize'
                  : selectedIds.size === 1
                  ? `Resize to ${selectedFormat === 'jpeg' ? 'JPG' : selectedFormat.toUpperCase()}`
                  : `Resize (${selectedIds.size}) to ${selectedFormat === 'jpeg' ? 'JPG' : selectedFormat.toUpperCase()}`}
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
                  targetFormat={selectedFormat}
                  processingLabel="Resizing"
                  onToggleSelect={toggleSelect}
                  onRemove={handleRemoveImage}
                  onRotate={handleQuickRotate}
                  onCrop={(img) => setEditingItem(img)}
                  onPreview={(img) =>
                    setModalItem({
                      url: img.result?.previewUrl || img.originalInfo.previewUrl,
                      filename: img.customFilename,
                      width: getItemFinalDimensions(img).width,
                      height: getItemFinalDimensions(img).height,
                      size: img.result ? img.result.fileSizeBytes : img.originalSize,
                      format: selectedFormat,
                      hasTransparency: img.originalInfo.hasTransparency,
                      onDownload: img.result ? () => downloadBlob(img.result!.blob, img.customFilename) : undefined,
                    })
                  }
                  targetDimensions={getItemFinalDimensions(item)}
                  onProcessSingle={(id) => {
                    const itm = images.find((x) => x.id === id);
                    if (itm) resizeSingleItem(itm);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM ACTION BAR (Clean text, no icons) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-3 z-30 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => setIsMobileSettingsOpen((prev) => !prev)}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 text-xs font-medium"
        >
          <Settings className="w-4 h-4 text-blue-500" />
          <span className="hidden sm:inline">Options</span>
        </button>

        <button
          type="button"
          onClick={handleResizeSelected}
          disabled={isProcessing || selectedIds.size === 0}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all text-center"
        >
          {isProcessing
            ? `Resizing (${completedResizeCount}/${selectedIds.size})...`
            : selectedIds.size === 0
            ? 'Select Images'
            : `Resize (${selectedIds.size}) to ${selectedFormat === 'jpeg' ? 'JPG' : selectedFormat.toUpperCase()}`}
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

      {/* Preview Modal */}
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
