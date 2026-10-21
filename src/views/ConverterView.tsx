import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ImageItem } from '../types';
import { DropZone } from '../components/DropZone';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import { ConversionProgressBar } from '../components/ConversionProgressBar';
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
  Edit2,
  Plus,
  Crop,
  ChevronDown
} from 'lucide-react';
import { ImageEditorModal } from '../components/ImageEditorModal';
import confetti from 'canvas-confetti';

interface ConverterViewProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onFilesSelected: (files: File[], overrideTargetFormat?: ImageFormat) => void;
  defaultFormat?: ImageFormat;
  allowedFormats?: ImageFormat[];
  hideHeader?: boolean;
}

export const ConverterView: React.FC<ConverterViewProps> = ({
  images,
  setImages,
  onFilesSelected,
  defaultFormat = 'webp',
  allowedFormats,
  hideHeader = false,
}) => {
  const allFormats = getAvailableOutputFormats();
  const availableFormats = useMemo(() => {
    if (allowedFormats && allowedFormats.length > 0) {
      return allFormats.filter((f) => allowedFormats.includes(f.id));
    }
    return allFormats;
  }, [allFormats, allowedFormats]);
  const [batchTargetFormat, setBatchTargetFormat] = useState<ImageFormat>(defaultFormat);
  const [isBatchFormatOpen, setIsBatchFormatOpen] = useState<boolean>(false);
  const batchFormatDropdownRef = useRef<HTMLDivElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultFormat) {
      setBatchTargetFormat(defaultFormat);
      setImages((prev) =>
        prev.map((item) => {
          if (item.status === 'idle') {
            const currentName = item.customFilename;
            const lastDot = currentName.lastIndexOf('.');
            const base = lastDot !== -1 ? currentName.slice(0, lastDot) : currentName;
            const targetExt = defaultFormat === 'jpeg' ? '.jpg' : `.${defaultFormat}`;
            return {
              ...item,
              targetFormat: defaultFormat,
              customFilename: `${base}${targetExt}`,
            };
          }
          return item;
        })
      );
    }
  }, [defaultFormat, setImages]);

  // Close format dropdown on outside click or escape
  useEffect(() => {
    if (!isBatchFormatOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (batchFormatDropdownRef.current && !batchFormatDropdownRef.current.contains(e.target as Node)) {
        setIsBatchFormatOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBatchFormatOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBatchFormatOpen]);
  const [batchQuality, setBatchQuality] = useState<number>(0.85);

  // Target file size for all images (Batch option)
  const [useBatchTargetSize, setUseBatchTargetSize] = useState<boolean>(false);
  const [batchTargetSizeInput, setBatchTargetSizeInput] = useState<string>('');
  const [batchTargetSizeUnit, setBatchTargetSizeUnit] = useState<'KB' | 'MB'>('KB');

  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [convertingFileName, setConvertingFileName] = useState<string>('');
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

  // Image Editor Modal state
  const [editingItem, setEditingItem] = useState<ImageItem | null>(null);

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
        if (item.result?.previewUrl) {
          revokeUrl(item.result.previewUrl);
        }
        return {
          ...item,
          targetFormat: fmt,
          customFilename: `${base}${targetExt}`,
          status: 'idle',
          result: undefined,
        };
      })
    );
  };

  // Compute batch target size in bytes
  const batchTargetSizeBytes = useBatchTargetSize && parseFloat(batchTargetSizeInput) > 0
    ? (batchTargetSizeUnit === 'MB' ? parseFloat(batchTargetSizeInput) * 1024 * 1024 : parseFloat(batchTargetSizeInput) * 1024)
    : undefined;

  const handleToggleBatchTargetSize = (enabled: boolean) => {
    setUseBatchTargetSize(enabled);
    if (enabled) {
      const num = parseFloat(batchTargetSizeInput);
      const bytes = !isNaN(num) && num > 0
        ? (batchTargetSizeUnit === 'MB' ? num * 1024 * 1024 : num * 1024)
        : undefined;
      setImages((prev) =>
        prev.map((item) => {
          if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
          return {
            ...item,
            targetSizeBytes: bytes,
            status: 'idle',
            result: undefined,
          };
        })
      );
    } else {
      setImages((prev) =>
        prev.map((item) => ({
          ...item,
          targetSizeBytes: undefined,
        }))
      );
    }
  };

  const handleApplyBatchTargetSizeToAll = () => {
    const num = parseFloat(batchTargetSizeInput);
    if (isNaN(num) || num <= 0) return;
    const bytes = batchTargetSizeUnit === 'MB' ? num * 1024 * 1024 : num * 1024;
    setUseBatchTargetSize(true);
    setImages((prev) =>
      prev.map((item) => {
        if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
        return {
          ...item,
          targetSizeBytes: bytes,
          status: 'idle',
          result: undefined,
        };
      })
    );
  };

  const getIndividualTargetDisplayValue = (item: ImageItem): string => {
    if (item.targetSizeBytes === undefined) return '';
    if (item.targetSizeBytes >= 1024 * 1024 && item.targetSizeBytes % (1024 * 1024) === 0) {
      return (item.targetSizeBytes / (1024 * 1024)).toString();
    }
    return Math.round(item.targetSizeBytes / 1024).toString();
  };

  const getIndividualTargetUnit = (item: ImageItem): 'KB' | 'MB' => {
    if (item.targetSizeBytes !== undefined && item.targetSizeBytes >= 1024 * 1024 && item.targetSizeBytes % (1024 * 1024) === 0) {
      return 'MB';
    }
    return 'KB';
  };

  const handleIndividualTargetSizeChange = (id: string, val: string, unit: 'KB' | 'MB') => {
    const num = parseFloat(val);
    const bytes = !isNaN(num) && num > 0
      ? (unit === 'MB' ? num * 1024 * 1024 : num * 1024)
      : undefined;

    setImages((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (i.result?.previewUrl) revokeUrl(i.result.previewUrl);
        return {
          ...i,
          targetSizeBytes: bytes,
          status: 'idle',
          result: undefined,
        };
      })
    );
  };

  const handleIndividualTargetUnitChange = (id: string, newUnit: 'KB' | 'MB', currentVal: string) => {
    const num = parseFloat(currentVal);
    const bytes = !isNaN(num) && num > 0
      ? (newUnit === 'MB' ? num * 1024 * 1024 : num * 1024)
      : undefined;

    setImages((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (i.result?.previewUrl) revokeUrl(i.result.previewUrl);
        return {
          ...i,
          targetSizeBytes: bytes,
          status: 'idle',
          result: undefined,
        };
      })
    );
  };

  const handleClearIndividualTargetSize = (id: string) => {
    setImages((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (i.result?.previewUrl) revokeUrl(i.result.previewUrl);
        return {
          ...i,
          targetSizeBytes: undefined,
          status: 'idle',
          result: undefined,
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

      const targetBytes = item.targetSizeBytes !== undefined
        ? item.targetSizeBytes
        : (useBatchTargetSize && batchTargetSizeBytes ? batchTargetSizeBytes : undefined);

      const result = await processImage(item.originalInfo, {
        format: item.targetFormat,
        quality: item.targetQuality,
        width: item.targetWidth,
        height: item.targetHeight,
        backgroundColor: item.backgroundColor,
        targetSizeBytes: targetBytes,
        originalSizeBytes: item.originalSize,
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
      if (item.status !== 'done') {
        setConvertingFileName(item.customFilename);
        await convertSingleImage(item.id);
      }
    }
    setConvertingFileName('');
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
      await createZipArchive(filesToZip, `imagetooltip-converted-${Date.now()}.zip`, (pct) => {
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
    if (item?.originalInfo.previewUrl) revokeUrl(item.originalInfo.previewUrl);
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear queue
  const handleClearAll = () => {
    images.forEach((item) => {
      if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
      if (item.originalInfo.previewUrl) revokeUrl(item.originalInfo.previewUrl);
    });
    setImages([]);
  };

  const completedCount = images.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 max-w-6xl mx-auto px-3 sm:px-4">
      {/* Hidden file input for Adding More Images when images are in queue */}
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.ico"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files), batchTargetFormat);
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
                <FileImage className="w-5 h-5" />
              </div>
              <span>Image Converter</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Convert any image to WebP, AVIF, PNG, JPG, GIF, SVG, BMP, or ICO in batch with full privacy.
            </p>
          </div>

          {images.length > 0 && (
            <div className="flex items-center space-x-2">
              {images.length < 20 ? (
                <button
                  onClick={() => addMoreInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 transition-colors"
                  title="Add more images to the conversion queue"
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
                onClick={handleClearAll}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Queue</span>
              </button>
            </div>
          )}
        </div>
      )}

      {hideHeader && images.length > 0 && (
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {images.length} Image{images.length > 1 ? 's' : ''} in Queue
            </span>
            {images.length >= 20 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                Max 20 Reached
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {images.length < 20 && (
              <button
                onClick={() => addMoreInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 transition-colors"
                title="Add more images to the conversion queue"
              >
                <Plus className="w-4 h-4" />
                <span>Add More</span>
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Queue</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Upload Zone: Shown ONLY when NO images are loaded, strictly hidden when image(s) exist */}
      {images.length === 0 && (
        <div className="pt-4 max-w-2xl mx-auto w-full">
          <DropZone
            onFilesSelected={(files) => onFilesSelected(files, batchTargetFormat)}
            title="Drop images here to start"
            subtitle="JPG, PNG, WebP, AVIF, SVG, GIF, BMP, ICO"
          />
        </div>
      )}

      {/* Batch Conversion Preloader & Progress Bar */}
      <ConversionProgressBar
        isProcessing={isProcessingAll}
        totalCount={images.length}
        completedCount={completedCount}
        currentFileName={convertingFileName}
        targetFormat={batchTargetFormat}
        actionLabel="Converting"
      />

      {/* Batch Control Toolbar */}
      {images.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>{images.length > 1 ? 'Convert All To:' : 'Convert To:'}</span>
              </span>

              {/* Format selection dropdown as per design and theme */}
              <div className="relative inline-block text-left" ref={batchFormatDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsBatchFormatOpen((prev) => !prev)}
                  aria-expanded={isBatchFormatOpen}
                  aria-haspopup="listbox"
                  className="inline-flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  title="Choose output format for all images"
                >
                  <span className="px-2 py-0.5 rounded-md text-xs font-extrabold uppercase bg-blue-600 text-white tracking-wider">
                    {batchTargetFormat}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {availableFormats.find((f) => f.id === batchTargetFormat)?.label || batchTargetFormat.toUpperCase()}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isBatchFormatOpen ? 'rotate-180 text-blue-500' : ''
                      }`}
                  />
                </button>

                {isBatchFormatOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                      <span>Available Output Formats</span>
                      <span className="text-[10px] text-slate-400 font-normal">All images</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                      {availableFormats.map((fmt) => {
                        const isSelected = batchTargetFormat === fmt.id;
                        const isAvailable = fmt.canEncode;

                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable) {
                                handleApplyBatchFormat(fmt.id);
                                setIsBatchFormatOpen(false);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${!isAvailable
                                ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                                : isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                              }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase shrink-0 ${isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                  }`}
                              >
                                {fmt.id}
                              </span>
                              <div className="flex flex-col min-w-0 text-left">
                                <span className="text-xs sm:text-sm font-semibold truncate leading-tight">
                                  {fmt.label}
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                                  {fmt.description}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 ml-2">
                              {isSelected ? (
                                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : !isAvailable ? (
                                <span className="text-[10px] text-amber-500 font-medium">No export</span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Batch actions */}
            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <button
                onClick={handleConvertAll}
                disabled={isProcessingAll}
                className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-98"
              >
                <RefreshCw className={`w-5 h-5 ${isProcessingAll ? 'animate-spin' : ''}`} />
                <span>{isProcessingAll ? 'Converting...' : images.length > 1 ? `Convert All (${images.length})` : 'Convert'}</span>
              </button>

              {completedCount > 0 && (
                <button
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="relative p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center group flex-shrink-0"
                  title={isZipping ? `Archiving (${zipProgress}%)...` : `Download all (${completedCount}) converted images as ZIP`}
                  aria-label={isZipping ? `Archiving (${zipProgress}%)...` : `Download all (${completedCount}) converted images as ZIP`}
                >
                  {isZipping ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Archive className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded-full bg-slate-900 dark:bg-slate-950 text-emerald-400 border border-emerald-500/60 shadow-xs uppercase tracking-tight">
                    {isZipping ? `${zipProgress}%` : `${completedCount > 1 ? completedCount : ''}ZIP`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Quality slider and Batch Target File Size (All Images) */}
          {(batchTargetFormat === 'jpeg' || batchTargetFormat === 'webp' || batchTargetFormat === 'avif' || batchTargetFormat === 'png') && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-700 dark:text-slate-300">
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

              {/* Batch Target File Size option for all images */}
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={useBatchTargetSize}
                    onChange={(e) => handleToggleBatchTargetSize(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Target Size (All Images):</span>
                </label>

                {useBatchTargetSize && (
                  <div className="flex flex-wrap items-center gap-1.5 animate-fade-in">
                    <input
                      type="number"
                      min="5"
                      max="50000"
                      value={batchTargetSizeInput}
                      onChange={(e) => {
                        setBatchTargetSizeInput(e.target.value);
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num) && num > 0) {
                          const bytes = batchTargetSizeUnit === 'MB' ? num * 1024 * 1024 : num * 1024;
                          setImages((prev) =>
                            prev.map((item) => ({
                              ...item,
                              targetSizeBytes: bytes,
                              status: item.status === 'done' ? 'idle' : item.status,
                            }))
                          );
                        }
                      }}
                      placeholder="e.g. 250"
                      className="w-20 text-xs sm:text-sm font-mono font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={batchTargetSizeUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value as 'KB' | 'MB';
                        setBatchTargetSizeUnit(newUnit);
                        const num = parseFloat(batchTargetSizeInput);
                        if (!isNaN(num) && num > 0) {
                          const bytes = newUnit === 'MB' ? num * 1024 * 1024 : num * 1024;
                          setImages((prev) =>
                            prev.map((item) => ({
                              ...item,
                              targetSizeBytes: bytes,
                              status: item.status === 'done' ? 'idle' : item.status,
                            }))
                          );
                        }
                      }}
                      className="text-xs sm:text-sm font-bold px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleApplyBatchTargetSizeToAll}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-900 transition-colors"
                      title="Apply this target size to all images in queue"
                    >
                      Apply to All
                    </button>
                  </div>
                )}
              </div>
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
          const effectiveTargetBytes = item.targetSizeBytes !== undefined
            ? item.targetSizeBytes
            : (useBatchTargetSize && batchTargetSizeBytes ? batchTargetSizeBytes : undefined);

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border transition-all duration-150 ${item.status === 'done'
                ? 'border-emerald-300 dark:border-emerald-900/60 shadow-xs'
                : item.status === 'error'
                  ? 'border-rose-300 dark:border-rose-900/60'
                  : 'border-slate-200 dark:border-slate-800'
                }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
                {/* Left: Thumbnail & Filename info */}
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1 w-full">
                  {/* Thumbnail preview */}
                  <div
                    onClick={() =>
                      setModalItem({
                        url: item.result?.previewUrl || item.originalInfo.previewUrl,
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
                    className="relative w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shadow-xs"
                    title="Click to view full image"
                  >
                    <img
                      src={item.result?.previewUrl || item.originalInfo.previewUrl}
                      alt={item.file.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Name and details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <input
                        type="text"
                        value={item.customFilename}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setImages((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, customFilename: newName } : i))
                          );
                        }}
                        className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 px-1.5 py-1 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none truncate w-full max-w-[180px] xs:max-w-xs sm:max-w-md"
                        title="Click to rename output file"
                      />
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                      <span>{item.originalDimensions.width} × {item.originalDimensions.height} px</span>
                      <span>•</span>
                      <span>Original: <strong className="text-slate-700 dark:text-slate-200">{formatBytes(item.originalSize)}</strong></span>
                      <span className="uppercase font-sans font-bold text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {inputFormat}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Target Format dropdown, Individual Target Size, status, and download buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80">
                  {/* Target format select */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">To:</span>
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
                      className="text-xs sm:text-sm font-bold uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-2 px-2.5 sm:px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {availableFormats.map((f) => (
                        <option key={f.id} value={f.id} disabled={!f.canEncode}>
                          {f.label} {!f.canEncode ? '(Unsupported)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Individual Target File Size Input */}
                  <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs" title="Set output file size limit for this individual image">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      Size:
                    </span>
                    <input
                      type="number"
                      min="5"
                      max="50000"
                      placeholder={useBatchTargetSize && batchTargetSizeInput ? `${batchTargetSizeInput}` : 'Auto'}
                      value={getIndividualTargetDisplayValue(item)}
                      onChange={(e) => handleIndividualTargetSizeChange(item.id, e.target.value, getIndividualTargetUnit(item))}
                      className="w-16 sm:w-20 text-xs font-mono font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      title="Custom output file size for this image"
                    />
                    <select
                      value={getIndividualTargetUnit(item)}
                      onChange={(e) => handleIndividualTargetUnitChange(item.id, e.target.value as 'KB' | 'MB', getIndividualTargetDisplayValue(item))}
                      className="text-xs font-bold px-1.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                    {item.targetSizeBytes !== undefined && (
                      <button
                        type="button"
                        onClick={() => handleClearIndividualTargetSize(item.id)}
                        className="text-xs text-slate-400 hover:text-rose-500 px-1 font-bold"
                        title="Reset to batch / auto"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Result Size / Savings */}
                  {item.result && (
                    <div className="text-right font-mono">
                      <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                        {formatBytes(item.result.fileSizeBytes)}
                      </div>
                      {effectiveTargetBytes && (
                        <div
                          className={`text-[11px] font-bold ${item.result.fileSizeBytes <= effectiveTargetBytes
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                            }`}
                        >
                          {item.result.fileSizeBytes <= effectiveTargetBytes
                            ? `✓ ≤ ${formatBytes(effectiveTargetBytes)}`
                            : `Target: ${formatBytes(effectiveTargetBytes)}`}
                        </div>
                      )}
                      {savings && (
                        <div
                          className={`text-xs sm:text-sm font-bold ${savings.isSmaller ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                            }`}
                        >
                          {savings.isSmaller ? `-${savings.percent}% (${formatBytes(savings.bytesSaved)} saved)` : `+${savings.percent}%`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Edit (Crop, Rotate, Flip) button */}
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Edit image (Crop, Rotate, Flip)"
                    >
                      <Crop className="w-3.5 h-3.5 text-blue-500" />
                      <span>Edit</span>
                    </button>

                    {item.status === 'done' && item.result ? (
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
                        onClick={() => convertSingleImage(item.id)}
                        disabled={item.status === 'processing'}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-all active:scale-95"
                      >
                        <RefreshCw className={`w-4 h-4 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                        <span>{item.status === 'processing' ? 'Converting...' : 'Convert'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveImage(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Item-level Conversion Preloader & Progress Bar */}
              {item.status === 'processing' && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-bold">
                    <span className="flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span>Converting to {item.targetFormat.toUpperCase()}...</span>
                    </span>
                    <span className="animate-pulse">Active</span>
                  </div>
                  <div
                    className="w-full bg-slate-200 dark:bg-slate-800 rounded-md h-3.5 p-0.5 overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700"
                    role="progressbar"
                    aria-label={`Converting ${item.customFilename}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-xs w-full relative overflow-hidden shadow-xs">
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/25 rounded-t-xs" />
                    </div>
                  </div>
                </div>
              )}

              {/* Transparency Warning Notice for JPEG/BMP */}
              {hasTransparencyWarning && (
                <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <strong>Warning:</strong> {item.targetFormat.toUpperCase()} does not support transparency. Transparent background will be replaced with a solid color.
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Fill Color:</span>
                    <input
                      type="color"
                      value={item.backgroundColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setImages((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, backgroundColor: newColor } : i))
                        );
                      }}
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <span className="font-mono text-xs uppercase font-semibold">{item.backgroundColor}</span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {item.status === 'error' && (
                <div className="mt-2 text-sm text-rose-600 dark:text-rose-400 font-medium flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
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
