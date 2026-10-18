import React from 'react';
import { AlertCircle, X, ImagePlus } from 'lucide-react';
import { formatBytes } from '../utils/imageProcessor';

export interface UploadStatus {
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  currentFileName: string;
  currentFileSize?: number;
  progressPercent: number;
  phase?: 'verifying' | 'decoding' | 'complete' | 'idle';
  errorMessages?: string[];
  onDismissErrors?: () => void;
}

interface UploadProgressBarProps {
  status: UploadStatus;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ status }) => {
  const {
    isUploading,
    totalFiles,
    completedFiles,
    currentFileName,
    currentFileSize,
    progressPercent,
    errorMessages,
    onDismissErrors,
  } = status;

  if (!isUploading && (!errorMessages || errorMessages.length === 0)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-xs transition-all duration-200 animate-fade-in">
      <div className="w-full max-w-lg pointer-events-auto space-y-3 shadow-2xl">
        {/* Security / Upload Error Notification if any files were rejected */}
        {errorMessages && errorMessages.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl p-4 shadow-xl backdrop-blur-md animate-fade-in space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <h4 className="font-bold text-sm">Security / File Validation Alert</h4>
              </div>
              {onDismissErrors && (
                <button
                  onClick={onDismissErrors}
                  className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                  aria-label="Dismiss errors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <ul className="text-xs space-y-1 list-disc list-inside text-rose-700 dark:text-rose-300">
              {errorMessages.map((msg, idx) => (
                <li key={idx} className="leading-relaxed">
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md animate-fade-in space-y-4">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3 min-w-0">
                {/* Clean Adding Image Icon */}
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs border border-blue-200 dark:border-blue-900/60">
                  <ImagePlus className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-slate-800 dark:text-slate-100 block truncate text-sm sm:text-base">
                      Adding Images
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
                      {Math.min(totalFiles, completedFiles + 1)} / {totalFiles} added
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                    <strong className="text-slate-700 dark:text-slate-200">{currentFileName}</strong>
                    {currentFileSize ? ` (${formatBytes(currentFileSize)})` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 pl-3">
                <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-base sm:text-lg">
                  {Math.min(100, Math.round(progressPercent))}%
                </span>
              </div>
            </div>

            {/* Classical Look Progress Bar Track */}
            <div
              className="w-full bg-slate-200 dark:bg-slate-800 rounded-lg h-5 p-0.5 overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700"
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Image loading progress"
            >
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-md transition-all duration-300 ease-out shadow-xs relative overflow-hidden"
                style={{ width: `${Math.min(100, Math.max(4, progressPercent))}%` }}
              >
                {/* Classical top gloss reflection */}
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
        )}
      </div>
    </div>
  );
};
