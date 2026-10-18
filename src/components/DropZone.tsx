import React, { useRef, useState, useEffect } from 'react';
import { ImagePlus, Image as ImageIcon, Clipboard, Plus, ChevronDown, FolderOpen, Link2 } from 'lucide-react';
import { UrlImageModal } from './UrlImageModal';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  title = 'Drop images here to start',
  subtitle = 'JPG, PNG, WebP, AVIF, SVG, GIF, BMP, ICO',
  compact = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
          name.endsWith('.avif') ||
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
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onDropHandler}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-200 text-center max-w-2xl mx-auto w-full ${isDragOver
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-blue-500/10'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-900'
          } ${compact ? 'p-5 sm:p-6' : 'p-8 sm:p-12'} ${className}`}
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
          type="file"
          multiple
          accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.ico"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3.5">
          <div
            className={`rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200 ${compact ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20'
              }`}
          >
            {compact ? <Plus className="w-7 h-7" /> : <ImagePlus className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.8]" />}
          </div>

          <div>
            <h3 className={`font-extrabold text-slate-800 dark:text-slate-100 ${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>
              {title}
            </h3>
            <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Primary CTA with dropdown options and paste hint */}
          <div
            className="flex flex-wrap items-center justify-center gap-3 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Unified Dropdown Button Group */}
            <div className="relative inline-flex rounded-xl shadow-md" ref={dropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-l-xl text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-98"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Choose Image</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen((prev) => !prev);
                }}
                aria-label="Upload options"
                aria-expanded={isDropdownOpen}
                className="px-2.5 py-3 rounded-r-xl bg-blue-600 hover:bg-blue-700 text-white border-l border-blue-500/60 transition-colors focus:outline-none"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-30 text-left animate-in fade-in zoom-in-95 duration-150"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span>Choose from Device</span>
                      <span className="text-[11px] font-normal text-slate-400">Upload local image files</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                      setIsUrlModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700/60"
                  >
                    <Link2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span>From Image URL</span>
                      <span className="text-[11px] font-normal text-slate-400">Import image via web link</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="hidden sm:inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Clipboard className="w-4.5 h-4.5 text-slate-400" />
              <span>Paste from clipboard (Ctrl+V)</span>
            </div>
          </div>

          {!compact && (
            <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
              {['JPG', 'PNG', 'WebP', 'AVIF', 'SVG', 'GIF', 'BMP', 'ICO'].map((fmt) => (
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

      {/* URL Import Modal */}
      <UrlImageModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onImagesLoaded={(files) => onFilesSelected(files)}
      />
    </>
  );
};
