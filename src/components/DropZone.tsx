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
  subtitle = 'Supports JPG, PNG, WebP, GIF, SVG, BMP, ICO (Up to 100MB each)',
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
        // Accept images or common graphic extensions
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
      // Reset input value so same files can be re-selected if removed
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-200 text-center ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-blue-500/10'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-900'
      } ${compact ? 'p-6' : 'p-8 sm:p-12'}`}
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

      <div className="flex flex-col items-center justify-center space-y-3">
        <div
          className={`rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 ${
            compact ? 'w-12 h-12' : 'w-16 h-16'
          }`}
        >
          {compact ? <Plus className="w-6 h-6" /> : <UploadCloud className="w-8 h-8" />}
        </div>

        <div>
          <h3 className={`font-bold text-slate-800 dark:text-slate-100 ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>
            {title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Choose Files</span>
          </button>
          <div className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Clipboard className="w-3.5 h-3.5 text-slate-400" />
            <span>Paste (Ctrl+V)</span>
          </div>
        </div>

        {!compact && (
          <div className="flex flex-wrap justify-center items-center gap-1.5 pt-3">
            {['JPG', 'PNG', 'WebP', 'SVG', 'GIF', 'BMP', 'ICO'].map((fmt) => (
              <span
                key={fmt}
                className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
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
