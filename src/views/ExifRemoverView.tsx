import React, { useState, useCallback, useRef } from 'react';
import { ExifIcon } from '../components/icons/ExifIcon';
import {
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Camera,
  Clock,
  Settings2,
  Code2,
  Tag,
  Eye,
  EyeOff,
  Loader2,
  FileImage,
  Archive,
  X,
  Sparkles,
  Lock,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { readExifData, stripExifFromFile, ExifData, ExifTag, ExifRemovalResult } from '../utils/exifRemover';
import { formatBytes } from '../utils/imageProcessor';
import { downloadBlob, createZipArchive } from '../utils/zipExporter';

interface ExifFile {
  id: string;
  file: File;
  previewUrl: string;
  exif: ExifData | null;
  result: ExifRemovalResult | null;
  status: 'reading' | 'ready' | 'processing' | 'done' | 'error';
  error?: string;
}

const CATEGORY_CONFIG = {
  location: { label: 'GPS Location', icon: MapPin, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-200 dark:border-rose-900/60' },
  camera: { label: 'Camera Info', icon: Camera, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-200 dark:border-blue-900/60' },
  datetime: { label: 'Date & Time', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-200 dark:border-amber-900/60' },
  settings: { label: 'Camera Settings', icon: Settings2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-200 dark:border-indigo-900/60' },
  software: { label: 'Software & App', icon: Code2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-purple-200 dark:border-purple-900/60' },
  other: { label: 'Other Metadata', icon: Tag, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900', border: 'border-slate-200 dark:border-slate-800' },
};

function groupTagsByCategory(tags: ExifTag[]): Record<string, ExifTag[]> {
  const grouped: Record<string, ExifTag[]> = {};
  for (const tag of tags) {
    if (!grouped[tag.category]) grouped[tag.category] = [];
    grouped[tag.category].push(tag);
  }
  return grouped;
}

export const ExifRemoverView: React.FC = () => {
  const [files, setFiles] = useState<ExifFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRawTags, setShowRawTags] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const addMoreRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    const supported = newFiles.filter(f => {
      const name = f.name.toLowerCase();
      const isSupportedType =
        f.type.startsWith('image/') ||
        name.endsWith('.jpg') || name.endsWith('.jpeg') ||
        name.endsWith('.png') || name.endsWith('.webp') ||
        name.endsWith('.avif') || name.endsWith('.gif') ||
        name.endsWith('.bmp') || name.endsWith('.tiff') ||
        name.endsWith('.tif');
      const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
      return isSupportedType && f.size <= MAX_SIZE;
    });

    if (supported.length === 0) return;

    const entries: ExifFile[] = supported.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      exif: null,
      result: null,
      status: 'reading' as const,
    }));

    setFiles(prev => {
      const updated = [...prev, ...entries];
      return updated.slice(0, 20);
    });

    if (!selectedId && entries.length > 0) {
      setSelectedId(entries[0].id);
    }

    // Read EXIF for each file
    for (const entry of entries) {
      try {
        const exif = await readExifData(entry.file);
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, exif, status: 'ready' } : f));
      } catch {
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'ready', exif: { tags: [], hasGps: false, hasCamera: false, hasSoftware: false, rawSize: 0 } } : f));
      }
    }
  }, [selectedId]);

  const handleStrip = useCallback(async (id: string) => {
    const entry = files.find(f => f.id === id);
    if (!entry || entry.status === 'processing' || entry.status === 'done') return;

    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing' } : f));

    try {
      const result = await stripExifFromFile(entry.file);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'done', result } : f));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: msg } : f));
    }
  }, [files]);

  const handleStripAll = useCallback(async () => {
    const toProcess = files.filter(f => f.status === 'ready' || f.status === 'error');
    for (const entry of toProcess) {
      await handleStrip(entry.id);
    }
  }, [files, handleStrip]);

  const handleDownload = useCallback((entry: ExifFile) => {
    if (!entry.result) return;
    const ext = entry.result.format;
    const baseName = entry.file.name.replace(/\.[^.]+$/, '');
    downloadBlob(entry.result.blob, `${baseName}_clean.${ext}`);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const done = files.filter(f => f.status === 'done' && f.result);
    if (done.length === 0) return;
    setIsZipping(true);
    try {
      const items = done.map(f => {
        const baseName = f.file.name.replace(/\.[^.]+$/, '');
        return { filename: `${baseName}_clean.${f.result!.format}`, blob: f.result!.blob };
      });
      await createZipArchive(items, `imagekit-clean-${Date.now()}.zip`);
    } finally {
      setIsZipping(false);
    }
  }, [files]);

  const handleRemove = useCallback((id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (selectedId === id) {
        setSelectedId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  }, [selectedId]);

  const handleClearAll = useCallback(() => {
    files.forEach(f => {
      URL.revokeObjectURL(f.previewUrl);
      if (f.result?.previewUrl) URL.revokeObjectURL(f.result.previewUrl);
    });
    setFiles([]);
    setSelectedId(null);
  }, [files]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const selected = files.find(f => f.id === selectedId) ?? null;
  const doneCount = files.filter(f => f.status === 'done').length;
  const readyCount = files.filter(f => f.status === 'ready').length;
  const grouped = selected?.exif ? groupTagsByCategory(selected.exif.tags) : {};

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto px-4">
      {/* Hidden file input for Adding More Images */}
      <input
        ref={addMoreRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.tiff,.tif"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      {/* View Header: Matches ConverterView structure */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <ExifIcon className="w-5 h-5" />
            </div>
            <span>EXIF Metadata Remover</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View and permanently strip hidden metadata, GPS location, and camera tags from your photos.
          </p>
        </div>

        {files.length > 0 && (
          <div className="flex items-center space-x-2">
            {files.length < 20 ? (
              <button
                onClick={() => addMoreRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors"
                title="Add more images"
              >
                <FileImage className="w-4 h-4" />
                <span>Add More</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                Max Limit (20/20)
              </span>
            )}
            <button
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Queue</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Upload Zone: Shown ONLY when NO images are loaded */}
      {files.length === 0 && (
        <div className="pt-4 max-w-2xl mx-auto w-full">
          <DropZone
            onFilesSelected={handleFilesSelected}
            title="Drop images here to start"
            subtitle="JPG, PNG, WebP, AVIF, TIFF — Strip GPS, timestamps & camera tags"
          />
        </div>
      )}

      {/* Main Interface when images are loaded */}
      {files.length > 0 && (
        <div className="space-y-6">
          {/* Action strip bar */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {files.length} Image{files.length !== 1 ? 's' : ''} Loaded • {doneCount} Cleaned
            </span>
            <div className="flex items-center space-x-2">
              {readyCount > 0 && (
                <button
                  onClick={handleStripAll}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Strip All ({readyCount})</span>
                </button>
              )}
              {doneCount > 1 && (
                <button
                  onClick={handleDownloadAll}
                  disabled={isZipping}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-60"
                >
                  {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  <span>{isZipping ? 'Zipping…' : 'Download All ZIP'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File List Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {files.map(f => {
            const isSelected = f.id === selectedId;
            const hasGps = f.exif?.hasGps;

            return (
              <div
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={`group relative flex items-center space-x-3 p-3 rounded-xl cursor-pointer border transition-all duration-150 ${
                  isSelected
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-800">
                  <img src={f.previewUrl} alt={f.file.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{f.file.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(f.file.size)}</span>
                    {f.status === 'reading' && (
                      <span className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Reading…</span>
                      </span>
                    )}
                    {f.status === 'processing' && (
                      <span className="inline-flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Stripping…</span>
                      </span>
                    )}
                    {f.status === 'done' && (
                      <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Clean</span>
                      </span>
                    )}
                    {f.status === 'error' && (
                      <span className="inline-flex items-center space-x-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Error</span>
                      </span>
                    )}
                    {hasGps && f.status !== 'done' && (
                      <span className="inline-flex items-center space-x-0.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                        <MapPin className="w-3 h-3" />
                        <span>GPS</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={e => { e.stopPropagation(); handleRemove(f.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-8 space-y-5">
          {selected ? (
            <>
              {/* Image preview + action row */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-0">
                  {/* Original */}
                  <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Original</p>
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                      <img src={selected.previewUrl} alt="original" className="max-w-full max-h-full object-contain" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">{formatBytes(selected.file.size)}</p>
                  </div>

                  {/* Cleaned */}
                  {selected.result && (
                    <div className="flex-1 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Cleaned ✓</p>
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                        <img src={selected.result.previewUrl} alt="cleaned" className="max-w-full max-h-full object-contain" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">{formatBytes(selected.result.cleanedSizeBytes)}</p>
                    </div>
                  )}
                </div>

                {/* Actions bar */}
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                  {selected.status === 'ready' && (
                    <button
                      onClick={() => handleStrip(selected.id)}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
                    >
                      <ExifIcon className="w-4 h-4" />
                      <span>Strip EXIF & Download</span>
                    </button>
                  )}
                  {selected.status === 'processing' && (
                    <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Stripping metadata…</span>
                    </div>
                  )}
                  {selected.status === 'done' && selected.result && (
                    <button
                      onClick={() => handleDownload(selected)}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Clean Image</span>
                    </button>
                  )}
                  {selected.status === 'error' && (
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{selected.error || 'Processing failed'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* EXIF Metadata Panel */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-slate-500" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Detected Metadata
                    </h2>
                    {selected.exif && selected.exif.tags.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                        {selected.exif.tags.length} tags
                      </span>
                    )}
                  </div>

                  {selected.exif && selected.exif.tags.length > 0 && (
                    <button
                      onClick={() => setShowRawTags(!showRawTags)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      {showRawTags ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showRawTags ? 'Hide IDs' : 'Show IDs'}</span>
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {selected.status === 'reading' && (
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 py-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Reading EXIF data…</span>
                    </div>
                  )}

                  {(selected.status === 'ready' || selected.status === 'processing' || selected.status === 'done' || selected.status === 'error') && (
                    <>
                      {(!selected.exif || selected.exif.tags.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          </div>
                          <p className="font-bold text-slate-900 dark:text-white">No EXIF Metadata Found</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            This image doesn't contain detectable EXIF data, or it's a PNG/WebP with no embedded metadata.
                          </p>
                        </div>
                      )}

                      {selected.exif && selected.exif.tags.length > 0 && (
                        <div className="space-y-3">
                          {/* Summary badges */}
                          <div className="flex flex-wrap gap-2 pb-2">
                            {selected.exif.hasGps && (
                              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>GPS Location Embedded!</span>
                              </div>
                            )}
                            {selected.exif.hasCamera && (
                              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                                <Camera className="w-3.5 h-3.5" />
                                <span>Camera Data</span>
                              </div>
                            )}
                            {selected.exif.hasSoftware && (
                              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
                                <Code2 className="w-3.5 h-3.5" />
                                <span>Software Info</span>
                              </div>
                            )}
                            {selected.exif.rawSize > 0 && (
                              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <span>~{formatBytes(selected.exif.rawSize)} metadata</span>
                              </div>
                            )}
                          </div>

                          {/* Grouped tags */}
                          {Object.entries(grouped).map(([category, catTags]) => {
                            const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                            const Icon = cfg.icon;
                            const isCollapsed = collapsedCategories.has(category);

                            return (
                              <div key={category} className={`rounded-xl border overflow-hidden ${cfg.border}`}>
                                <button
                                  onClick={() => toggleCategory(category)}
                                  className={`w-full flex items-center justify-between px-4 py-2.5 ${cfg.bg}`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                                      {cfg.label}
                                    </span>
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                      {catTags.length}
                                    </span>
                                  </div>
                                  {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                                </button>

                                {!isCollapsed && (
                                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {catTags.map((tag, i) => (
                                      <div key={i} className="flex items-start justify-between px-4 py-2.5 gap-3">
                                        <div className="min-w-0">
                                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {tag.label}
                                          </span>
                                          {showRawTags && (
                                            <span className="ml-2 text-xs font-mono text-slate-400 dark:text-slate-500">{tag.tag}</span>
                                          )}
                                        </div>
                                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400 text-right max-w-[55%] break-all">
                                          {tag.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Done: confirmation card */}
              {selected.status === 'done' && selected.result && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-300">Metadata Successfully Removed</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl p-3 border border-emerald-200 dark:border-emerald-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Original</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatBytes(selected.result.originalSizeBytes)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl p-3 border border-emerald-200 dark:border-emerald-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Cleaned</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(selected.result.cleanedSizeBytes)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl p-3 border border-emerald-200 dark:border-emerald-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Tags Removed</p>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{selected.exif?.tags.length ?? 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-center">
              <div className="space-y-2">
                <ExifIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Select an image to view its metadata</p>
              </div>
            </div>
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
