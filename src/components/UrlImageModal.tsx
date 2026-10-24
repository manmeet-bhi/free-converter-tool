import React, { useState, useEffect, useRef } from 'react';
import { Link2, X, Loader2, AlertCircle, Image as ImageIcon, ClipboardPaste, ArrowRight, CheckCircle2 } from 'lucide-react';

interface UrlImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesLoaded: (files: File[]) => void;
}

const MAX_URLS = 10;

export const UrlImageModal: React.FC<UrlImageModalProps> = ({
  isOpen,
  onClose,
  onImagesLoaded,
}) => {
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressState, setProgressState] = useState<{
    currentIndex: number;
    totalCount: number;
    currentUrl: string;
    percent: number;
  }>({
    currentIndex: 0,
    totalCount: 0,
    currentUrl: '',
    percent: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract clean valid URLs from raw text
  const parseUrls = (text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('http://') || line.startsWith('https://'));
  };

  const parsedUrls = parseUrls(textInput);
  const isOverLimit = parsedUrls.length > MAX_URLS;
  const activeUrls = parsedUrls.slice(0, MAX_URLS);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTextInput('');
      setErrorMessage(null);
      setIsLoading(false);
      setProgressState({ currentIndex: 0, totalCount: 0, currentUrl: '', percent: 0 });
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    setErrorMessage(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const combined = textInput ? `${textInput.trim()}\n${text.trim()}` : text.trim();
          setTextInput(combined);
        } else {
          setErrorMessage('Clipboard is empty.');
        }
      } else {
        setErrorMessage('Clipboard access not supported. Please paste manually (Ctrl+V).');
      }
    } catch {
      setErrorMessage('Unable to read clipboard. Please paste directly into the box.');
    }
  };

  const fetchBlobWithFallbacks = async (targetUrl: string): Promise<Blob> => {
    // 1. Direct fetch with CORS mode
    try {
      const res = await fetch(targetUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        if (blob && (blob.type.startsWith('image/') || blob.size > 0)) {
          return blob;
        }
      }
    } catch {
      // direct fetch failed (often CORS)
    }

    // 2. Proxy 1: allorigins
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          return blob;
        }
      }
    } catch {
      // proxy 1 failed
    }

    // 3. Proxy 2: corsproxy.io
    try {
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          return blob;
        }
      }
    } catch {
      // proxy 2 failed
    }

    // 4. HTML Image Element Canvas fallback
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context failed'));
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas image conversion failed'));
          }, 'image/png');
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Image could not be loaded'));
      img.src = targetUrl;
    });
  };

  const handleImport = async () => {
    if (activeUrls.length === 0) {
      setErrorMessage('Please enter at least one valid image URL starting with http:// or https://');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const total = activeUrls.length;
    const downloadedFiles: File[] = [];
    const failedUrls: string[] = [];

    for (let i = 0; i < total; i++) {
      const targetUrl = activeUrls[i];
      const percent = Math.round(((i + 1) / total) * 100);

      setProgressState({
        currentIndex: i + 1,
        totalCount: total,
        currentUrl: targetUrl,
        percent,
      });

      try {
        const blob = await fetchBlobWithFallbacks(targetUrl);

        // Derive clean filename
        let filename = `image_${i + 1}`;
        try {
          const parsed = new URL(targetUrl);
          const segments = parsed.pathname.split('/').filter(Boolean);
          if (segments.length > 0) {
            const last = segments[segments.length - 1];
            if (last.includes('.')) {
              filename = decodeURIComponent(last).replace(/[^a-zA-Z0-9._-]/g, '_');
            }
          }
        } catch {
          // fallback
        }

        const mimeType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
        if (!filename.includes('.')) {
          const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
          filename = `${filename}.${ext}`;
        }

        const file = new File([blob], filename, { type: mimeType });
        downloadedFiles.push(file);
      } catch {
        failedUrls.push(targetUrl);
      }
    }

    setIsLoading(false);

    if (downloadedFiles.length > 0) {
      onImagesLoaded(downloadedFiles);
      if (failedUrls.length === 0) {
        onClose();
      } else {
        setErrorMessage(
          `Imported ${downloadedFiles.length} image(s). Failed to download ${failedUrls.length} URL(s) due to host restrictions.`
        );
      }
    } else {
      setErrorMessage(
        'Could not download any images from the provided URL(s). Please check link accessibility or download directly.'
      );
    }
  };

  // Dynamic progress label as requested:
  // "write importing image if multiple images with count"
  const getProgressLabel = () => {
    if (progressState.totalCount <= 1) {
      return `Importing image (1/1)...`;
    }
    return `Importing images (${progressState.currentIndex} of ${progressState.totalCount})...`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="url-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="url-modal-title" className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                Add Images from URL
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Paste up to {MAX_URLS} image links (one per line)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Progress Bar Display when downloading */}
          {isLoading ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>{getProgressLabel()}</span>
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {progressState.percent}%
                </span>
              </div>

              {/* Progress Track & Fill */}
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressState.percent}%` }}
                />
              </div>

              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                {progressState.currentUrl}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="image-urls-input"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Image URLs (Max {MAX_URLS})
                </label>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      activeUrls.length > 0
                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {activeUrls.length} / {MAX_URLS} URLs
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000&q=80';
                      setTextInput(sample);
                      setErrorMessage(null);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>Sample</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center space-x-1"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-blue-500" />
                    <span>Paste</span>
                  </button>
                </div>
              </div>

              <textarea
                id="image-urls-input"
                ref={textareaRef}
                rows={4}
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.png&#10;https://example.com/photo3.webp"
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 font-mono resize-none leading-relaxed"
              />

              {isOverLimit && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Note: Maximum of {MAX_URLS} URLs allowed. The first {MAX_URLS} URLs will be imported.
                </p>
              )}
            </div>
          )}

          {/* Error notification */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Detected URLs Chip Preview */}
          {!isLoading && activeUrls.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ready to import ({activeUrls.length}):
              </p>
              <div className="space-y-1">
                {activeUrls.map((u, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono text-slate-700 dark:text-slate-300 truncate">{u}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = activeUrls.filter((_, i) => i !== idx).join('\n');
                        setTextInput(updated);
                      }}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                      title="Remove URL"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Helper hint */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Supports JPG, PNG, WebP, AVIF, GIF, SVG, BMP, and ICO images.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isLoading || activeUrls.length === 0}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <span>
                  {activeUrls.length > 1 ? `Import ${activeUrls.length} Images` : 'Import Image'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
