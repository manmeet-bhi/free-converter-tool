import React, { useState, useRef, useCallback } from 'react';
import { Eye, ArrowLeftRight } from 'lucide-react';

interface CompareSliderProps {
  originalUrl: string;
  processedUrl: string;
  originalLabel?: string;
  processedLabel?: string;
  originalSizeText?: string;
  processedSizeText?: string;
  hasTransparency?: boolean;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  originalUrl,
  processedUrl,
  originalLabel = 'Original',
  processedLabel = 'Compressed',
  originalSizeText,
  processedSizeText,
  hasTransparency = false,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0-100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(x, rect.width));
    const percent = (clampedX / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-600 dark:text-slate-300">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-500" />
          <span>Interactive Before / After Comparison</span>
        </div>
        <span className="text-xs text-slate-400 font-normal">Drag center handle</span>
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-72 sm:h-96 rounded-xl overflow-hidden cursor-ew-resize border border-slate-200 dark:border-slate-800 ${
          hasTransparency ? 'bg-checkerboard-light dark:bg-checkerboard-dark' : 'bg-slate-950'
        }`}
      >
        {/* Processed (After) Image - Full width underlayer */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <img
            src={processedUrl}
            alt={processedLabel}
            className="max-h-full max-w-full object-contain pointer-events-none select-none"
          />
        </div>

        {/* Original (Before) Image - Clipped top layer */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="absolute inset-0 w-full h-full min-w-full">
            <div
              className="absolute inset-0 flex items-center justify-center p-2"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              }}
            >
              <img
                src={originalUrl}
                alt={originalLabel}
                className="max-h-full max-w-full object-contain pointer-events-none select-none"
              />
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 text-blue-600 shadow-md flex items-center justify-center cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow">
            <span>{originalLabel}</span>
            {originalSizeText && (
              <span className="text-slate-300 font-mono text-xs">({originalSizeText})</span>
            )}
          </div>
        </div>

        <div className="absolute top-3 right-3 pointer-events-none">
          <div className="bg-blue-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow">
            <span>{processedLabel}</span>
            {processedSizeText && (
              <span className="text-blue-100 font-mono text-xs">({processedSizeText})</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
