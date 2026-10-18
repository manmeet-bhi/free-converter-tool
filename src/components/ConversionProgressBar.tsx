import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface ConversionProgressProps {
  isProcessing: boolean;
  totalCount: number;
  completedCount: number;
  currentFileName?: string;
  targetFormat?: string;
  actionLabel?: string; // 'Converting' | 'Compressing' | 'Resizing'
}

export const ConversionProgressBar: React.FC<ConversionProgressProps> = ({
  isProcessing,
  totalCount,
  completedCount,
  currentFileName,
  targetFormat,
  actionLabel = 'Converting',
}) => {
  if (!isProcessing) return null;

  const percent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  return (
    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-cyan-950/40 rounded-2xl p-5 border border-blue-200 dark:border-blue-900/60 shadow-md animate-fade-in space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-3">
          {/* Preloader Animation */}
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {actionLabel} in Progress...
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {Math.min(totalCount, completedCount + 1)} / {totalCount}
              </span>
            </div>

            {currentFileName && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate max-w-sm sm:max-w-md">
                <span>{actionLabel} {Math.min(totalCount, completedCount + 1)} / {totalCount}: </span>
                <strong className="font-mono text-slate-800 dark:text-slate-100">{currentFileName}</strong>
                {targetFormat && (
                  <span className="ml-1 uppercase text-blue-600 dark:text-blue-400 font-bold">
                    &rarr; {targetFormat}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Live Percentage */}
        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center">
          <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xl sm:text-2xl">
            {percent}%
          </span>
        </div>
      </div>

      {/* Classical Progress Bar Track & Indicator */}
      <div
        className="w-full bg-slate-200 dark:bg-slate-800 rounded-lg h-5 sm:h-6 p-0.5 overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${actionLabel} progress`}
      >
        <div
          className="bg-blue-600 dark:bg-blue-500 h-full rounded-md transition-all duration-300 ease-out shadow-xs relative overflow-hidden"
          style={{ width: `${Math.max(4, percent)}%` }}
        >
          {/* Classical top gloss highlight */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/25 rounded-t-sm" />
          {/* Classical subtle diagonal stripes */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent)',
              backgroundSize: '16px 16px',
            }}
          />
        </div>
      </div>
    </div>
  );
};
