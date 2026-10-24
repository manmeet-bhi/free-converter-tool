import React, { useRef, useState, useEffect } from 'react';
import { ImagePlus, Plus, FolderOpen, Link2, Loader2, AlertCircle } from 'lucide-react';
import { fetchImageFileFromUrl } from '../utils/urlImageFetcher';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
  showUrlImport?: boolean;
  accept?: string;
  formatBadges?: string[];
  allowVideosAndPdf?: boolean;
  allowAllMedia?: boolean;
  buttonText?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  title = 'Drop images here to start',
  subtitle,
  compact = false,
  className = '',
  showUrlImport = true,
  accept,
  formatBadges,
  allowVideosAndPdf = false,
  allowAllMedia = false,
  buttonText,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptsMedia = allowVideosAndPdf || allowAllMedia;
  const resolvedButtonText = buttonText || (acceptsMedia ? 'Choose Media / Files' : 'Choose Image');
  const defaultAccept = acceptsMedia
    ? 'image/*,video/*,audio/*,application/pdf,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.tiff,.tif,.heic,.heif,.mp4,.mov,.webm,.mkv,.avi,.m4v,.wmv,.flv,.3gp,.3g2,.ts,.mts,.m2ts,.ogv,.f4v,.vob,.mpg,.mpeg,.asf,.divx,.m2v,.mp3,.m4a,.wav,.flac,.ogg,.opus,.aac,.wma,.pdf'
    : 'image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.ico';
  const resolvedAccept = accept || defaultAccept;

  // Clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const itemType = items[i].type || '';
        const isMediaPaste =
          itemType.startsWith('image/') ||
          (acceptsMedia && (itemType.startsWith('video/') || itemType.startsWith('audio/') || itemType === 'application/pdf'));

        if (isMediaPaste) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        onFilesSelected(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected, acceptsMedia]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDropHandler = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
        if (acceptsMedia) {
          // When media is accepted, never drop files due to blank browser MIME types on OS drag
          return true;
        }
        const name = file.name.toLowerCase();
        return (
          file.type.startsWith('image/') ||
          name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.png') ||
          name.endsWith('.webp') ||
          name.endsWith('.avif') ||
          name.endsWith('.gif') ||
          name.endsWith('.bmp') ||
          name.endsWith('.svg') ||
          name.endsWith('.ico') ||
          name.endsWith('.tiff') ||
          name.endsWith('.tif') ||
          name.endsWith('.heic') ||
          name.endsWith('.heif')
        );
      });

      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleUrlSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Please enter an image link');
      return;
    }

    setUrlError(null);
    setIsUrlLoading(true);

    try {
      const file = await fetchImageFileFromUrl(trimmed);
      setUrlInput('');
      onFilesSelected([file]);
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Failed to load image from URL');
    } finally {
      setIsUrlLoading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={onDropHandler}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-200 text-center max-w-2xl mx-auto w-full ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-blue-500/10'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-900'
      } ${compact ? 'p-4 sm:p-6' : 'p-5 sm:p-10 md:p-12'} ${className}`}
      role="button"
      tabIndex={0}
      aria-label="Add images"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
    >
      <input
        ref={fileInputRef}
        id="dropzone-file-input"
        name="dropzone-file"
        type="file"
        multiple
        autoComplete="off"
        accept={resolvedAccept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-3.5">
        <div
          className={`rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200 ${
            compact ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20'
          }`}
        >
          {compact ? <Plus className="w-7 h-7" /> : <ImagePlus className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.8]" />}
        </div>

        <div>
          <h3 className={`font-extrabold text-slate-800 dark:text-slate-100 ${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Primary CTA Button */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-98 cursor-pointer"
          >
            <FolderOpen className="w-5 h-5" />
            <span>{resolvedButtonText}</span>
          </button>
        </div>

        {/* Inline URL Input with Go Button (matches project theme & colors) */}
        {showUrlImport && (
          <div
            className="w-full max-w-md pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 my-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/80" />
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                or from web URL
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/80" />
            </div>

            <form
              onSubmit={handleUrlSubmit}
              className="relative flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-xs focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden"
            >
              <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 shrink-0">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                id="image-url-input"
                name="imageUrl"
                type="url"
                autoComplete="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
                placeholder="Paste image link (https://...)"
                disabled={isUrlLoading}
                className="w-full py-2.5 px-2 text-xs sm:text-sm bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!urlInput.trim() || isUrlLoading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all shrink-0 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Load image from URL"
              >
                {isUrlLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading</span>
                  </>
                ) : (
                  <span>Go</span>
                )}
              </button>
            </form>

            {urlError && (
              <div className="mt-2 flex items-center space-x-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium text-left px-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}
          </div>
        )}

        {!compact && (
          <div className="flex flex-wrap justify-center items-center gap-2 pt-1">
            {(formatBadges || ['JPG', 'PNG', 'WebP', 'AVIF', 'SVG', 'GIF', 'BMP', 'ICO']).map((fmt) => (
              <span
                key={fmt}
                className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
              >
                .{fmt.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
