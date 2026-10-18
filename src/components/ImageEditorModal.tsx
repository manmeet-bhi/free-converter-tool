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
  Maximize2
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

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

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

    // Target pixel ratio: W / H = ratioVal
    // Normalized ratio in 0..1 space: (W_norm * effectiveWidth) / (H_norm * effectiveHeight) = ratioVal
    // => W_norm / H_norm = ratioVal * (effectiveHeight / effectiveWidth)
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
    setRotation((prev) => {
      const next = (prev + 90) % 360;
      return next;
    });
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  const handleRotateLeft = () => {
    setRotation((prev) => {
      const next = (prev + 270) % 360;
      return next;
    });
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
    e: React.PointerEvent,
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
      boxWidth: rect.width,
      boxHeight: rect.height,
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const { type: handleType, startX, startY, initialCrop, boxWidth, boxHeight } = dragRef.current;

      const deltaX = (ev.clientX - startX) / boxWidth;
      const deltaY = (ev.clientY - startY) / boxHeight;

      let nextX = initialCrop.x;
      let nextY = initialCrop.y;
      let nextW = initialCrop.width;
      let nextH = initialCrop.height;

      const minSize = 0.05; // minimum 5%

      if (handleType === 'move') {
        nextX = Math.max(0, Math.min(1 - initialCrop.width, initialCrop.x + deltaX));
        nextY = Math.max(0, Math.min(1 - initialCrop.height, initialCrop.y + deltaY));
      } else {
        // Handle resizing
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
          } else {
            nextW = Math.min(1 - nextX, nextH * normRatio);
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
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
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
      // Translate to center
      rotCtx.translate(effectiveWidth / 2, effectiveHeight / 2);
      // Rotate
      rotCtx.rotate((rotation * Math.PI) / 180);
      // Flip
      rotCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      // Draw image centered
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
        mimeType = 'image/png'; // Convert SVG edits to raster PNG
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

      // Load new LoadedImageInfo
      const newInfo = await loadImageFromFile(updatedFile);

      // Clean up previous result preview if exists
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

  // Transform style for the preview container
  const transformStyle: React.CSSProperties = {
    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    transition: 'transform 0.2s ease-out',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <CropIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="editor-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                Edit Image: {imageItem.customFilename}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Original: {naturalDimensions.width}×{naturalDimensions.height} px • Output: {croppedPixelWidth}×{croppedPixelHeight} px
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetAll}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset all edits"
            >
              <ResetIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 shrink-0 text-xs sm:text-sm">
          {/* Rotate & Flip Tools */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">Transform:</span>
            
            <button
              type="button"
              onClick={handleRotateLeft}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-colors flex items-center space-x-1"
              title="Rotate Left 90°"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs font-semibold hidden md:inline">-90°</span>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-colors flex items-center space-x-1"
              title="Rotate Right 90°"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-xs font-semibold hidden md:inline">+90°</span>
            </button>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={handleFlipHorizontal}
              className={`p-2 rounded-xl border shadow-xs transition-colors flex items-center space-x-1 ${
                flipH 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Flip Horizontal (Mirror)"
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="text-xs font-semibold hidden md:inline">Flip H</span>
            </button>

            <button
              type="button"
              onClick={handleFlipVertical}
              className={`p-2 rounded-xl border shadow-xs transition-colors flex items-center space-x-1 ${
                flipV 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" />
              <span className="text-xs font-semibold hidden md:inline">Flip V</span>
            </button>
          </div>

          {/* Aspect Ratio Presets */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden lg:inline">Crop Ratio:</span>
            {(['free', '1:1', '16:9', '9:16', '4:3', '3:2'] as AspectRatioOption[]).map((ratio) => {
              const isSelected = aspectRatio === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => handleAspectRatioChange(ratio)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {ratio === 'free' ? 'Free' : ratio}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleResetCrop}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title="Reset Crop to Full Image"
            >
              Reset Crop
            </button>
          </div>
        </div>

        {/* Workspace: Image Preview & Interactive Crop Box */}
        <div className="flex-1 min-h-0 bg-slate-950 flex items-center justify-center p-4 sm:p-8 select-none overflow-hidden relative">
          {imageLoaded ? (
            <div 
              ref={containerRef}
              className="relative max-w-full max-h-full flex items-center justify-center"
              style={{
                aspectRatio: `${effectiveWidth} / ${effectiveHeight}`,
              }}
            >
              {/* Rotated & Flipped Image Display */}
              <img
                src={imageItem.originalInfo.previewUrl}
                alt="Editing Preview"
                style={transformStyle}
                className="max-w-full max-h-full object-contain pointer-events-none rounded shadow-md"
              />

              {/* Dark Overlay Outside Crop Area (using 4 surrounding translucent boxes) */}
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
                className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] cursor-move transition-[box-shadow]"
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
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                {/* Dimension Badge */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                  {croppedPixelWidth} × {croppedPixelHeight}
                </div>

                {/* 4 Corner Handles */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'nw')}
                  className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-xs shadow cursor-nwse-resize z-10"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'ne')}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-xs shadow cursor-nesw-resize z-10"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'se')}
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-xs shadow cursor-nwse-resize z-10"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'sw')}
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-xs shadow cursor-nesw-resize z-10"
                />

                {/* 4 Edge Handles */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'n')}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-blue-600 rounded-xs shadow cursor-ns-resize z-10"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, 's')}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-blue-600 rounded-xs shadow cursor-ns-resize z-10"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'w')}
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-6 bg-white border border-blue-600 rounded-xs shadow cursor-ew-resize z-10"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'e')}
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-6 bg-white border border-blue-600 rounded-xs shadow cursor-ew-resize z-10"
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

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Tip: Drag the crop box or handles to resize. Edits are processed client-side.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying || !imageLoaded}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Applying…</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
