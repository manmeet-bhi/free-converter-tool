import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Clipboard, Plus } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  title = 'Drag & drop images here, or browse files',
  subtitle = 'Supports JPG, PNG, WebP, GIF, SVG, BMP, ICO (Unlimited & 100% Private)',
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
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
  }, [onFilesSelected]);

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

  const handleDrop = (e: React.DragEvent) => {
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
        const name = file.name.toLowerCase();
        return (
          file.type.startsWith('image/') ||
          name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.png') ||
          name.endsWith('.webp') ||
          name.endsWith('.gif') ||
          name.endsWith('.bmp') ||
          name.endsWith('.svg') ||
          name.endsWith('.ico')
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={onDropHandler}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-200 text-center ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-blue-500/10'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-900'
      } ${compact ? 'p-5 sm:p-6' : 'p-8 sm:p-12'}`}
      role="button"
      tabIndex={0}
      aria-label="Upload images"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.ico"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-3.5">
        <div
          className={`rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200 ${
            compact ? 'w-12 h-12' : 'w-16 h-16 sm:w-18 sm:h-18'
          }`}
        >
          {compact ? <Plus className="w-6 h-6" /> : <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />}
        </div>

        <div>
          <h3 className={`font-extrabold text-slate-800 dark:text-slate-100 ${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>
            {title}
          </h3>
          <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Primary CTA and paste hint */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all active:scale-98"
          >
            <ImageIcon className="w-5 h-5" />
            <span>Choose Images</span>
          </button>
          <div className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clipboard className="w-4 h-4 text-slate-400" />
            <span>Paste from clipboard (Ctrl+V)</span>
          </div>
        </div>

        {!compact && (
          <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
            {['JPG', 'PNG', 'WebP', 'SVG', 'GIF', 'BMP', 'ICO'].map((fmt) => (
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
