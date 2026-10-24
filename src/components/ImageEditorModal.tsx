import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop as CropIcon,
  Check,
  RotateCcw as ResetIcon,
  Maximize2,
  Sparkles,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { ImageItem } from '../types';
import { loadImageFromFile, revokeUrl } from '../utils/imageProcessor';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageItem: ImageItem | null;
  onSave: (updatedItem: ImageItem) => void;
}

type AspectRatioOption = 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2' | '2:3';

interface NormalizedCrop {
  x: number;      // 0 to 1
  y: number;      // 0 to 1
  width: number;  // 0 to 1
  height: number; // 0 to 1
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageItem,
  onSave,
}) => {
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('free');
  const [crop, setCrop] = useState<NormalizedCrop>({ x: 0, y: 0, width: 1, height: 1 });
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Dragging state
  const dragRef = useRef<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';
    startX: number;
    startY: number;
    initialCrop: NormalizedCrop;
    boxWidth: number;
    boxHeight: number;
  } | null>(null);

  // Initialize or reset when image changes or modal opens
  useEffect(() => {
    if (isOpen && imageItem) {
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setAspectRatio('free');
      setCrop({ x: 0, y: 0, width: 1, height: 1 });
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRef.current = img;
        setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoaded(true);
      };
      img.src = imageItem.originalInfo.previewUrl;
    }
  }, [isOpen, imageItem]);

  // Compute effective width & height based on 90° / 270° rotation
  const isPerpendicular = rotation === 90 || rotation === 270;
  const effectiveWidth = isPerpendicular ? naturalDimensions.height : naturalDimensions.width;
  const effectiveHeight = isPerpendicular ? naturalDimensions.width : naturalDimensions.height;

  // Measure workspace and calculate exact pixel dimensions for containerRef
  useEffect(() => {
    if (!isOpen || !workspaceRef.current || effectiveWidth <= 0 || effectiveHeight <= 0) return;

    const updateDisplaySize = () => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const padding = window.innerWidth < 640 ? 12 : 24;
      const availW = Math.max(40, rect.width - padding * 2);
      const availH = Math.max(40, rect.height - padding * 2);

      const scale = Math.min(availW / effectiveWidth, availH / effectiveHeight);
      const width = Math.max(20, Math.round(effectiveWidth * scale));
      const height = Math.max(20, Math.round(effectiveHeight * scale));

      setDisplaySize({ width, height });
    };

    updateDisplaySize();
    const observer = new ResizeObserver(updateDisplaySize);
    observer.observe(workspaceRef.current);
    window.addEventListener('resize', updateDisplaySize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDisplaySize);
    };
  }, [isOpen, effectiveWidth, effectiveHeight]);

  // Render rotated and flipped image on preview canvas
  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || !imageLoaded) return;
    const canvas = canvasRef.current;
    canvas.width = effectiveWidth;
    canvas.height = effectiveHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, effectiveWidth, effectiveHeight);
    ctx.save();
    ctx.translate(effectiveWidth / 2, effectiveHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(
      imgRef.current,
      -naturalDimensions.width / 2,
      -naturalDimensions.height / 2,
      naturalDimensions.width,
      naturalDimensions.height
    );
    ctx.restore();
  }, [imageLoaded, effectiveWidth, effectiveHeight, rotation, flipH, flipV, naturalDimensions]);

  // Aspect ratio helper
  const getAspectRatioValue = useCallback((ratio: AspectRatioOption): number | null => {
    switch (ratio) {
      case '1:1': return 1;
      case '16:9': return 16 / 9;
      case '9:16': return 9 / 16;
      case '4:3': return 4 / 3;
      case '3:2': return 3 / 2;
      case '2:3': return 2 / 3;
      case 'free':
      default:
        return null;
    }
  }, []);

  // Adjust crop to target aspect ratio
  const applyAspectRatioToCrop = useCallback((targetRatio: AspectRatioOption, currentCrop: NormalizedCrop = crop) => {
    const ratioVal = getAspectRatioValue(targetRatio);
    if (!ratioVal || effectiveWidth === 0 || effectiveHeight === 0) {
      return currentCrop;
    }

    const normRatio = ratioVal * (effectiveHeight / effectiveWidth);

    let newWidth = currentCrop.width;
    let newHeight = newWidth / normRatio;

    if (newHeight > 1) {
      newHeight = 1;
      newWidth = newHeight * normRatio;
    }

    if (newWidth > 1) {
      newWidth = 1;
      newHeight = newWidth / normRatio;
    }

    // Center crop
    const newX = Math.max(0, Math.min(1 - newWidth, (1 - newWidth) / 2));
    const newY = Math.max(0, Math.min(1 - newHeight, (1 - newHeight) / 2));

    return {
      x: newX,
      y: newY,
      width: Math.min(1, newWidth),
      height: Math.min(1, newHeight),
    };
  }, [crop, effectiveHeight, effectiveWidth, getAspectRatioValue]);

  const handleAspectRatioChange = (ratio: AspectRatioOption) => {
    setAspectRatio(ratio);
    if (ratio === 'free') {
      return;
    }
    const newCrop = applyAspectRatioToCrop(ratio);
    setCrop(newCrop);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev + 270) % 360);
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  const handleFlipHorizontal = () => {
    setFlipH((prev) => !prev);
  };

  const handleFlipVertical = () => {
    setFlipV((prev) => !prev);
  };

  const handleResetCrop = () => {
    setAspectRatio('free');
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  const handleResetAll = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('free');
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  // Pointer drag handling for crop box & handles
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const targetElement = e.currentTarget as HTMLElement;
    try {
      targetElement.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if setPointerCapture is unsupported
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const boxWidth = rect.width > 0 ? rect.width : displaySize.width;
    const boxHeight = rect.height > 0 ? rect.height : displaySize.height;

    if (boxWidth <= 0 || boxHeight <= 0) return;

    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
      boxWidth,
      boxHeight,
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const { type: handleType, startX, startY, initialCrop, boxWidth: bW, boxHeight: bH } = dragRef.current;

      const deltaX = (ev.clientX - startX) / bW;
      const deltaY = (ev.clientY - startY) / bH;

      let nextX = initialCrop.x;
      let nextY = initialCrop.y;
      let nextW = initialCrop.width;
      let nextH = initialCrop.height;

      const minSize = 0.05; // minimum 5%

      if (handleType === 'move') {
        nextX = Math.max(0, Math.min(1 - initialCrop.width, initialCrop.x + deltaX));
        nextY = Math.max(0, Math.min(1 - initialCrop.height, initialCrop.y + deltaY));
      } else {
        if (handleType.includes('e')) {
          nextW = Math.max(minSize, Math.min(1 - initialCrop.x, initialCrop.width + deltaX));
        }
        if (handleType.includes('s')) {
          nextH = Math.max(minSize, Math.min(1 - initialCrop.y, initialCrop.height + deltaY));
        }
        if (handleType.includes('w')) {
          const maxDeltaW = initialCrop.width - minSize;
          const clampedDeltaX = Math.max(-initialCrop.x, Math.min(maxDeltaW, deltaX));
          nextX = initialCrop.x + clampedDeltaX;
          nextW = initialCrop.width - clampedDeltaX;
        }
        if (handleType.includes('n')) {
          const maxDeltaH = initialCrop.height - minSize;
          const clampedDeltaY = Math.max(-initialCrop.y, Math.min(maxDeltaH, deltaY));
          nextY = initialCrop.y + clampedDeltaY;
          nextH = initialCrop.height - clampedDeltaY;
        }

        // Maintain aspect ratio if set
        const ratioVal = getAspectRatioValue(aspectRatio);
        if (ratioVal && effectiveWidth > 0 && effectiveHeight > 0) {
          const normRatio = ratioVal * (effectiveHeight / effectiveWidth);
          if (handleType === 'e' || handleType === 'w') {
            nextH = Math.min(1 - nextY, nextW / normRatio);
          } else if (handleType === 'n' || handleType === 's') {
            nextW = Math.min(1 - nextX, nextH * normRatio);
          } else {
            const targetW = nextH * normRatio;
            if (targetW <= 1 - nextX) {
              nextW = targetW;
            } else {
              nextW = 1 - nextX;
              nextH = nextW / normRatio;
            }
          }

          if (handleType.includes('w')) {
            nextX = (initialCrop.x + initialCrop.width) - nextW;
          }
          if (handleType.includes('n')) {
            nextY = (initialCrop.y + initialCrop.height) - nextH;
          }
        }
      }

      setCrop({
        x: Math.max(0, Math.min(1 - nextW, nextX)),
        y: Math.max(0, Math.min(1 - nextH, nextY)),
        width: Math.min(1, Math.max(minSize, nextW)),
        height: Math.min(1, Math.max(minSize, nextH)),
      });
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      try {
        targetElement.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // Render & Apply Changes
  const handleApply = async () => {
    if (!imageItem || !imgRef.current) return;
    setIsApplying(true);

    try {
      const srcImg = imgRef.current;
      const origW = naturalDimensions.width;
      const origH = naturalDimensions.height;

      // 1. Create canvas for rotation & flipping
      const rotCanvas = document.createElement('canvas');
      rotCanvas.width = effectiveWidth;
      rotCanvas.height = effectiveHeight;
      const rotCtx = rotCanvas.getContext('2d');

      if (!rotCtx) throw new Error('Could not get canvas context');

      rotCtx.save();
      rotCtx.translate(effectiveWidth / 2, effectiveHeight / 2);
      rotCtx.rotate((rotation * Math.PI) / 180);
      rotCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      rotCtx.drawImage(srcImg, -origW / 2, -origH / 2, origW, origH);
      rotCtx.restore();

      // 2. Crop from rotated canvas
      const cropPixelX = Math.round(crop.x * effectiveWidth);
      const cropPixelY = Math.round(crop.y * effectiveHeight);
      const cropPixelW = Math.max(1, Math.round(crop.width * effectiveWidth));
      const cropPixelH = Math.max(1, Math.round(crop.height * effectiveHeight));

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = cropPixelW;
      finalCanvas.height = cropPixelH;
      const finalCtx = finalCanvas.getContext('2d');

      if (!finalCtx) throw new Error('Could not get crop canvas context');

      finalCtx.drawImage(
        rotCanvas,
        cropPixelX,
        cropPixelY,
        cropPixelW,
        cropPixelH,
        0,
        0,
        cropPixelW,
        cropPixelH
      );

      // Determine output mime
      let mimeType = imageItem.file.type || 'image/png';
      if (mimeType === 'image/svg+xml') {
        mimeType = 'image/png';
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas to Blob export failed'));
          },
          mimeType,
          0.95
        );
      });

      // Create new File object
      const updatedFile = new File([blob], imageItem.file.name, {
        type: blob.type,
        lastModified: Date.now(),
      });

      const newInfo = await loadImageFromFile(updatedFile);

      if (imageItem.result?.previewUrl) {
        revokeUrl(imageItem.result.previewUrl);
      }

      const updatedItem: ImageItem = {
        ...imageItem,
        file: updatedFile,
        originalInfo: newInfo,
        originalSize: blob.size,
        originalDimensions: {
          width: cropPixelW,
          height: cropPixelH,
        },
        status: 'idle',
        result: undefined,
      };

      onSave(updatedItem);
      onClose();
    } catch (err) {
      console.error('Failed to apply image edits:', err);
      alert('Failed to apply image edits. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen || !imageItem) return null;

  // Real-time calculated cropped dimensions
  const croppedPixelWidth = Math.round(crop.width * effectiveWidth);
  const croppedPixelHeight = Math.round(crop.height * effectiveHeight);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl h-[95vh] sm:h-[92vh] max-h-[900px] shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CropIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="editor-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Edit & Crop: {imageItem.customFilename}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={handleResetAll}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset all edits"
            >
              <ResetIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset All</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-Sided Layout: Left = All Options, Right = Image Preview & Crop Box */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* LEFT SIDE: All Options & Controls */}
          <div className="w-full md:w-80 lg:w-88 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-5">
              {/* Aspect Ratio Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                    <span>Aspect Ratio</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetCrop}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Reset Crop
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {(['free', '1:1', '16:9', '9:16', '4:3', '3:2', '2:3'] as AspectRatioOption[]).map((ratio) => {
                    const isSelected = aspectRatio === ratio;
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => handleAspectRatioChange(ratio)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${isSelected
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700'
                          }`}
                      >
                        {ratio === 'free' ? 'Free' : ratio}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transform: Rotate & Flip */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider mb-2">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Transform & Orientation</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleRotateLeft}
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    title="Rotate Left 90°"
                  >
                    <RotateCcw className="w-4 h-4 text-blue-500" />
                    <span>Rotate -90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRotateRight}
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    title="Rotate Right 90°"
                  >
                    <RotateCw className="w-4 h-4 text-blue-500" />
                    <span>Rotate +90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFlipHorizontal}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer ${flipH
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span>Flip Horizontal</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFlipVertical}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer ${flipV
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    title="Flip Vertical"
                  >
                    <FlipVertical className="w-4 h-4" />
                    <span>Flip Vertical</span>
                  </button>
                </div>
              </div>

              {/* Dimensions Information Box */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Output Resolution:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {croppedPixelWidth} × {croppedPixelHeight}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-1.5">
                  <span>Original Dimensions:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {naturalDimensions.width} × {naturalDimensions.height}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Rotation:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {rotation}°
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions of Left Panel */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 mt-4">
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying || !imageLoaded}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-500/20 transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isApplying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Applying Changes…</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Apply</span>
                  </>
                )}
              </button>


            </div>
          </div>

          {/* RIGHT SIDE: Image Preview & Interactive Crop Box */}
          <div
            ref={workspaceRef}
            className="flex-1 min-h-[320px] md:min-h-0 bg-slate-950 flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden relative touch-none"
          >
            {imageLoaded ? (
              <div
                ref={containerRef}
                className="relative select-none touch-none flex items-center justify-center shrink-0"
                style={{
                  width: displaySize.width > 0 ? `${displaySize.width}px` : 'auto',
                  height: displaySize.height > 0 ? `${displaySize.height}px` : 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  aspectRatio: displaySize.width > 0 ? undefined : `${effectiveWidth} / ${effectiveHeight}`,
                }}
              >
                {/* Rotated & Flipped Live Preview Canvas */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain pointer-events-none rounded shadow-md block"
                />

                {/* Dark Overlay Outside Crop Area (using polygon clip-path) */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    clipPath: `polygon(
                      0% 0%, 
                      100% 0%, 
                      100% 100%, 
                      0% 100%, 
                      0% ${crop.y * 100}%, 
                      ${crop.x * 100}% ${crop.y * 100}%, 
                      ${crop.x * 100}% ${(crop.y + crop.height) * 100}%, 
                      ${(crop.x + crop.width) * 100}% ${(crop.y + crop.height) * 100}%, 
                      ${(crop.x + crop.width) * 100}% ${crop.y * 100}%, 
                      0% ${crop.y * 100}%
                    )`,
                  }}
                />

                {/* Draggable & Resizable Crop Box */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                  className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] cursor-move transition-[box-shadow] touch-none"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.width * 100}%`,
                    height: `${crop.height * 100}%`,
                  }}
                >
                  {/* Rule of Thirds Grid */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div />
                  </div>

                  {/* Dimension Badge */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 bg-slate-900/90 text-white font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30 transition-all ${crop.y < 0.08 ? 'top-2' : '-top-7'
                      }`}
                  >
                    {croppedPixelWidth} × {croppedPixelHeight}
                  </div>

                  {/* 4 Corner Handles with expanded 44px+ touch-friendly hit areas */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-sm shadow-md cursor-nwse-resize z-20 touch-none after:absolute after:-inset-3 after:content-['']"
                    aria-label="Resize Top Left"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-sm shadow-md cursor-nesw-resize z-20 touch-none after:absolute after:-inset-3 after:content-['']"
                    aria-label="Resize Top Right"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-sm shadow-md cursor-nwse-resize z-20 touch-none after:absolute after:-inset-3 after:content-['']"
                    aria-label="Resize Bottom Right"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-sm shadow-md cursor-nesw-resize z-20 touch-none after:absolute after:-inset-3 after:content-['']"
                    aria-label="Resize Bottom Left"
                  />

                  {/* 4 Edge Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'n')}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-white border border-blue-600 rounded-sm shadow cursor-ns-resize z-20 touch-none after:absolute after:-inset-3 after:content-['']"
                    aria-label="Resize Top Edge"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 's')}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-white border border-blue-600 rounded-sm shadow cursor-ns-resize z-20 touch-none after:absolute after:-inset-3 after:content-['']"
                    aria-label="Resize Bottom Edge"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'w')}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-8 bg-white border border-blue-600 rounded-sm shadow cursor-ew-resize z-20 touch-none after:absolute after:-inset-3 after:content-['']"
                    aria-label="Resize Left Edge"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'e')}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-8 bg-white border border-blue-600 rounded-sm shadow cursor-ew-resize z-20 touch-none after:absolute after:-inset-3 after:content-['']"
                    aria-label="Resize Right Edge"
                  />
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm animate-pulse flex items-center space-x-2">
                <Maximize2 className="w-5 h-5 animate-spin" />
                <span>Loading image canvas…</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
