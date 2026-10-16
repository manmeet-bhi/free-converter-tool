import React, { useState, useEffect, useMemo } from 'react';
import { ImageItem, CompressionPreset } from '../types';
import { DropZone } from '../components/DropZone';
import { CompareSlider } from '../components/CompareSlider';
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
  Minimize2, 
  Download, 
  Sliders, 
  Archive, 
  Trash2, 
  RefreshCw, 
  Info, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Sparkles,
  CheckCircle2,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CompressorViewProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onFilesSelected: (files: File[]) => void;
}

export const CompressorView: React.FC<CompressorViewProps> = ({
  images,
  setImages,
  onFilesSelected,
}) => {
  const availableFormats = getAvailableOutputFormats().filter(
    (f) => f.id === 'jpeg' || f.id === 'webp' || f.id === 'png'
  );

  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>('balanced');
  const [quality, setQuality] = useState<number>(0.75);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('webp');
  const [useTargetSize, setUseTargetSize] = useState<boolean>(false);
  const [targetSizeInput, setTargetSizeInput] = useState<string>('250');
  const [targetSizeUnit, setTargetSizeUnit] = useState<'KB' | 'MB'>('KB');
  const [resizePercent, setResizePercent] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Lightbox modal state
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

  // Sync active image if none selected
  useEffect(() => {
    if (images.length > 0 && (!activeImageId || !images.find((i) => i.id === activeImageId))) {
      setActiveImageId(images[0].id);
    }
  }, [images, activeImageId]);

  const activeImage = useMemo(
    () => images.find((i) => i.id === activeImageId) || images[0],
    [images, activeImageId]
  );

  // Preset configuration handler
  const handlePresetChange = (preset: CompressionPreset) => {
    setSelectedPreset(preset);
    if (preset === 'max') {
      setQuality(0.4);
      setResizePercent(90);
    } else if (preset === 'balanced') {
      setQuality(0.75);
      setResizePercent(100);
    } else if (preset === 'high') {
      setQuality(0.9);
      setResizePercent(100);
    }
  };

  // Compress a single image
  const compressItem = async (item: ImageItem) => {
    setImages((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', error: undefined } : i))
    );

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
      });

      // Update filename extension if format changed
      const currentName = item.customFilename;
      const lastDot = currentName.lastIndexOf('.');
      const base = lastDot !== -1 ? currentName.slice(0, lastDot) : currentName;
      const targetExt = targetFormat === 'jpeg' ? '.jpg' : `.${targetFormat}`;
      const newFilename = `${base}${targetExt}`;

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
                targetWidth: targetW,
                targetHeight: targetH,
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

  // Compress currently active image
  const handleCompressActive = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    await compressItem(activeImage);
    setIsProcessing(false);
  };

  // Compress all images in queue
  const handleCompressAll = async () => {
    setIsProcessing(true);
    for (const item of images) {
      await compressItem(item);
    }
    setIsProcessing(false);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const completedItems = images.filter((i) => i.status === 'done' && i.result);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    const filesToZip = completedItems.map((item) => ({
      filename: item.customFilename,
      blob: item.result!.blob,
    }));

    try {
      await createZipArchive(filesToZip, `imagekit-compressed-${Date.now()}.zip`);
    } catch {
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = images.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto px-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Minimize2 className="w-5 h-5" />
            </div>
            <span>Image Compressor</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Intelligently reduce image file size without perceptible loss of quality.
          </p>
        </div>

        {images.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                images.forEach((item) => {
                  if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
                });
                setImages([]);
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <DropZone
        onFilesSelected={onFilesSelected}
        title="Add images to compress"
        subtitle="Upload JPG, PNG, or WebP images. Real-time in-browser compression."
        compact={images.length > 0}
      />

      {images.length > 0 && activeImage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Compression Presets */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2.5">
                Compression Profile
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'max', label: 'Max', desc: 'Up to 90%' },
                  { id: 'balanced', label: 'Balanced', desc: 'Standard' },
                  { id: 'high', label: 'High Qual', desc: 'Minimal loss' },
                  { id: 'custom', label: 'Custom', desc: 'Manual' },
                ].map((p) => {
                  const isSelected = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetChange(p.id as CompressionPreset)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Output Format */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                Output Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableFormats.map((f) => {
                  const isSelected = targetFormat === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      disabled={!f.canEncode}
                      onClick={() => setTargetFormat(f.id)}
                      className={`p-2 rounded-xl text-xs font-bold uppercase border transition-all ${
                        !f.canEncode
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {f.id}
                    </button>
                  );
                })}
              </div>

              {/* Status and guidance messages for formats */}
              {targetFormat === 'webp' && (
                <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>WebP 25-35% high efficiency compression with full alpha transparency.</span>
                </div>
              )}

              {targetFormat === 'png' && (
                <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>PNG is lossless. To achieve dramatic 60-80% file size reduction, choose WebP.</span>
                </p>
              )}
            </div>

            {/* Quality Slider (for lossy formats) */}
            {targetFormat !== 'png' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Quality Level:
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.02"
                  value={quality}
                  onChange={(e) => {
                    setQuality(parseFloat(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Smallest Size (10%)</span>
                  <span>Balanced (75%)</span>
                  <span>Best Quality (100%)</span>
                </div>
              </div>
            )}

            {/* Target File Size Control (Binary search optimizer) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Target File Size Mode
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={useTargetSize}
                  onChange={(e) => setUseTargetSize(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {useTargetSize && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Specify your exact max desired file size. Our engine performs binary search iterations to reach it.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="10"
                      max="50000"
                      value={targetSizeInput}
                      onChange={(e) => setTargetSizeInput(e.target.value)}
                      placeholder="e.g. 250"
                      className="flex-1 text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={targetSizeUnit}
                      onChange={(e) => setTargetSizeUnit(e.target.value as 'KB' | 'MB')}
                      className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Resize Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Scale Dimensions:
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {resizePercent}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={resizePercent}
                onChange={(e) => setResizePercent(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Original: {activeImage.originalDimensions.width}×{activeImage.originalDimensions.height}</span>
                <span>
                  Result: {Math.round((activeImage.originalDimensions.width * resizePercent) / 100)}×
                  {Math.round((activeImage.originalDimensions.height * resizePercent) / 100)}
                </span>
              </div>
            </div>

            {/* Metadata stripping note */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Canvas re-encoding automatically strips unnecessary EXIF metadata.</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCompressActive}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-98"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Optimizing...' : 'Compress Active Image'}</span>
              </button>

              {images.length > 1 && (
                <button
                  onClick={handleCompressAll}
                  disabled={isProcessing}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <span>Apply & Compress All ({images.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Preview & Results Panel (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Image Thumbnails Selector */}
            {images.length > 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
                  Queue ({images.length} Images):
                </span>
                <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                  {images.map((item) => {
                    const isSelected = item.id === activeImageId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveImageId(item.id)}
                        className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                        title={item.customFilename}
                      >
                        <img
                          src={item.result?.previewUrl || item.originalInfo.cleanedSvgUrl || URL.createObjectURL(item.file)}
                          alt={item.file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {item.status === 'done' && (
                          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results Banner / Comparison */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-sm">
                    {activeImage.customFilename}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Original: {activeImage.originalDimensions.width}×{activeImage.originalDimensions.height} px • {formatBytes(activeImage.originalSize)}
                  </p>
                </div>

                {activeImage.result && (
                  <button
                    onClick={() => downloadBlob(activeImage.result!.blob, activeImage.customFilename)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Compressed</span>
                  </button>
                )}
              </div>

              {/* Compression Metric Cards */}
              {activeImage.result ? (
                (() => {
                  const savings = calculateSavings(activeImage.originalSize, activeImage.result.fileSizeBytes);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Original Size</div>
                        <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatBytes(activeImage.originalSize)}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60">
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Compressed Size</div>
                        <div className="text-sm font-mono font-bold text-indigo-700 dark:text-indigo-300">
                          {formatBytes(activeImage.result.fileSizeBytes)}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60">
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Reduction</div>
                        <div className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {savings.isSmaller ? `-${savings.percent}%` : `+${savings.percent}%`}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60">
                        <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Space Saved</div>
                        <div className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">
                          {savings.isSmaller ? formatBytes(savings.bytesSaved) : '0 B'}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center text-xs text-slate-500 dark:text-slate-400">
                  Click <strong>Compress Active Image</strong> above to run real-time compression and view savings.
                </div>
              )}

              {/* Before / After Comparison Slider */}
              {activeImage.result ? (
                <CompareSlider
                  originalUrl={activeImage.originalInfo.cleanedSvgUrl || URL.createObjectURL(activeImage.file)}
                  processedUrl={activeImage.result.previewUrl}
                  originalLabel="Original"
                  processedLabel={`Compressed (${targetFormat.toUpperCase()})`}
                  originalSizeText={formatBytes(activeImage.originalSize)}
                  processedSizeText={formatBytes(activeImage.result.fileSizeBytes)}
                  hasTransparency={activeImage.originalInfo.hasTransparency}
                />
              ) : (
                <div className="h-64 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/50">
                  <img
                    src={activeImage.originalInfo.cleanedSvgUrl || URL.createObjectURL(activeImage.file)}
                    alt={activeImage.customFilename}
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>
              )}

              {/* Batch Download Button if multiple completed */}
              {completedCount > 1 && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Download All Compressed ({completedCount} Images ZIP)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
