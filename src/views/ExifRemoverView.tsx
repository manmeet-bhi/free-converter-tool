import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Archive,
  X,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileBox,
  FileImage,
  Video,
  ShieldCheck,
  Layers,
  BookOpen,
} from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { UploadProgressBar, UploadStatus } from '../components/UploadProgressBar';
import { readExifData, stripExifFromFile, ExifData, ExifTag, ExifRemovalResult } from '../utils/exifRemover';
import { formatBytes } from '../utils/imageProcessor';
import { downloadBlob, createZipArchive } from '../utils/zipExporter';
import { exportExifToHtml, exportExifToCsv, exportExifToJson, exportExifToTxt } from '../utils/exifExporter';

interface ExifFile {
  id: string;
  file: File;
  previewUrl: string;
  exif: ExifData | null;
  result: ExifRemovalResult | null;
  status: 'reading' | 'ready' | 'processing' | 'done' | 'error';
  error?: string;
  fileKind: 'image' | 'video' | 'pdf';
}

const CATEGORY_CONFIG = {
  location: { label: 'GPS Location', icon: MapPin, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-200 dark:border-rose-900/60' },
  camera: { label: 'Camera / Device', icon: Camera, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-200 dark:border-blue-900/60' },
  datetime: { label: 'Date & Time', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-200 dark:border-amber-900/60' },
  settings: { label: 'Settings & Technical', icon: Settings2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-200 dark:border-indigo-900/60' },
  software: { label: 'Software & Author', icon: Code2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-purple-200 dark:border-purple-900/60' },
  other: { label: 'Other Metadata', icon: Tag, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900', border: 'border-slate-200 dark:border-slate-800' },
};

function getFileKind(file: File): 'image' | 'video' | 'pdf' {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov')) {
    return 'video';
  }
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  return 'image';
}

function groupTagsByCategory(tags: ExifTag[]): Record<string, ExifTag[]> {
  const grouped: Record<string, ExifTag[]> = {};
  for (const tag of tags) {
    if (!grouped[tag.category]) grouped[tag.category] = [];
    grouped[tag.category].push(tag);
  }
  return grouped;
}

export const ExifRemoverView: React.FC = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<ExifFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRawTags, setShowRawTags] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [activeGuideStyle, setActiveGuideStyle] = useState<'saas' | 'wiki'>('saas');

  // Optimized Progress States for adding media & stripping
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    totalFiles: 0,
    completedFiles: 0,
    currentFileName: '',
    progressPercent: 0,
    phase: 'idle',
    title: 'Adding Media',
    themeColor: 'rose',
    actionLabel: 'inspected',
    errorMessages: [],
  });

  const [isStrippingAll, setIsStrippingAll] = useState(false);
  const [stripProgress, setStripProgress] = useState({ current: 0, total: 0, currentName: '' });

  const addMoreRef = useRef<HTMLInputElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on click outside
  useEffect(() => {
    if (!isExportDropdownOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isExportDropdownOpen]);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    if (!newFiles || newFiles.length === 0) return;

    const currentCount = files.length;
    const MAX_FILES = 20;
    if (currentCount >= MAX_FILES) {
      setUploadStatus({
        isUploading: false,
        totalFiles: 0,
        completedFiles: 0,
        currentFileName: '',
        progressPercent: 0,
        phase: 'idle',
        title: 'Adding Media',
        themeColor: 'rose',
        actionLabel: 'inspected',
        errorMessages: [`Maximum limit of ${MAX_FILES} files reached. Please clear or remove existing files before adding more.`],
      });
      return;
    }

    const availableSlots = Math.max(0, MAX_FILES - currentCount);
    const validationErrors: string[] = [];

    const supported = newFiles.filter(f => {
      const name = f.name.toLowerCase();
      const isSupportedType =
        f.type.startsWith('image/') ||
        f.type.startsWith('video/') ||
        f.type === 'application/pdf' ||
        name.endsWith('.jpg') || name.endsWith('.jpeg') ||
        name.endsWith('.png') || name.endsWith('.webp') ||
        name.endsWith('.avif') || name.endsWith('.gif') ||
        name.endsWith('.bmp') || name.endsWith('.tiff') ||
        name.endsWith('.tif') || name.endsWith('.mp4') ||
        name.endsWith('.mov') || name.endsWith('.pdf');
      const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
      if (!isSupportedType) {
        validationErrors.push(`"${f.name}" is not a supported image, video, or PDF format.`);
        return false;
      }
      if (f.size > MAX_SIZE) {
        validationErrors.push(`"${f.name}" exceeds the 50 MB maximum size limit (${formatBytes(f.size)}).`);
        return false;
      }
      return true;
    });

    if (newFiles.length > availableSlots) {
      validationErrors.push(`Queue limit of ${MAX_FILES} files. ${newFiles.length - availableSlots} extra file(s) were skipped.`);
    }

    const filesToProcess = supported.slice(0, availableSlots);
    if (filesToProcess.length === 0) {
      if (validationErrors.length > 0) {
        setUploadStatus({
          isUploading: false,
          totalFiles: 0,
          completedFiles: 0,
          currentFileName: '',
          progressPercent: 0,
          phase: 'idle',
          title: 'Adding Media',
          themeColor: 'rose',
          actionLabel: 'inspected',
          errorMessages: validationErrors,
        });
      }
      return;
    }

    const total = filesToProcess.length;

    // Launch real-time progress bar
    setUploadStatus({
      isUploading: true,
      totalFiles: total,
      completedFiles: 0,
      currentFileName: filesToProcess[0]?.name || '',
      currentFileSize: filesToProcess[0]?.size,
      progressPercent: 10,
      phase: 'inspecting',
      phaseDescription: 'Reading EXIF tags, GPS coords & metadata...',
      title: 'Adding & Inspecting Media',
      themeColor: 'rose',
      actionLabel: 'inspected',
      errorMessages: validationErrors,
    });

    const entriesToAdd: ExifFile[] = [];

    for (let i = 0; i < total; i++) {
      const f = filesToProcess[i];
      const startPct = Math.round((i / total) * 90) + 10;

      setUploadStatus(prev => ({
        ...prev,
        currentFileName: f.name,
        currentFileSize: f.size,
        completedFiles: i,
        progressPercent: startPct,
        phaseDescription: `Inspecting ${f.name}...`,
      }));

      // Small async yield for responsive 60fps UI painting
      await new Promise(res => setTimeout(res, 20));

      let exif: ExifData = { tags: [], hasGps: false, hasCamera: false, hasSoftware: false, rawSize: 0 };
      try {
        exif = await readExifData(f);
      } catch {
        // Fallback default empty exif structure
      }

      const entry: ExifFile = {
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        fileKind: getFileKind(f),
        previewUrl: URL.createObjectURL(f),
        exif,
        result: null,
        status: 'ready',
      };

      entriesToAdd.push(entry);

      // Dynamically add to files state so UI updates in real-time
      setFiles(prev => {
        const next = [...prev, entry];
        return next.slice(0, MAX_FILES);
      });

      if (i === 0 && !selectedId) {
        setSelectedId(entry.id);
      }

      setUploadStatus(prev => ({
        ...prev,
        completedFiles: i + 1,
        progressPercent: Math.round(((i + 1) / total) * 100),
      }));
    }

    // Complete upload
    setUploadStatus(prev => ({
      ...prev,
      progressPercent: 100,
      phase: 'complete',
      phaseDescription: 'Metadata inspection complete!',
    }));

    setTimeout(() => {
      setUploadStatus(prev => ({
        ...prev,
        isUploading: false,
      }));
    }, 280);
  }, [files.length, selectedId]);

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
    if (toProcess.length === 0) return;

    setIsStrippingAll(true);
    setStripProgress({ current: 0, total: toProcess.length, currentName: toProcess[0]?.file.name || '' });

    for (let i = 0; i < toProcess.length; i++) {
      const entry = toProcess[i];
      setStripProgress({ current: i, total: toProcess.length, currentName: entry.file.name });
      await handleStrip(entry.id);
      setStripProgress({ current: i + 1, total: toProcess.length, currentName: entry.file.name });
    }

    setIsStrippingAll(false);
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
      await createZipArchive(items, `imagetooltip-clean-${Date.now()}.zip`);
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
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 max-w-6xl mx-auto px-3 sm:px-4">
      {/* Hidden file input for Adding More Files */}
      <input
        ref={addMoreRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/quicktime,application/pdf,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.tiff,.tif,.mp4,.mov,.pdf"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <ExifIcon className="w-5 h-5" />
            </div>
            <span>{t('exif.title', 'EXIF & Metadata Remover')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('exif.subtitle', 'View, export (HTML, CSV, JSON, TXT), and permanently strip hidden metadata, GPS, and device tags from images, videos & PDFs.')}
          </p>
        </div>

        {files.length > 0 && (
          <div className="flex items-center space-x-2">
            {files.length < 20 ? (
              <button
                onClick={() => addMoreRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors"
                title="Add more files"
              >
                <FileBox className="w-4 h-4" />
                <span>{t('exif.addMore', 'Add More')}</span>
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
              <span>{t('exif.clearQueue', 'Clear Queue')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Upload Zone: Shown ONLY when NO files are loaded */}
      {files.length === 0 && (
        <div className="pt-4 max-w-2xl mx-auto w-full">
          <DropZone
            onFilesSelected={handleFilesSelected}
            title={t('exif.dropTitle', 'Drop files here to inspect & clean')}
            subtitle={t('exif.dropSubtitle', 'Images (JPEG, PNG, WebP, HEIC, GIF), Videos (MP4, MOV) & Documents (PDF)')}
            showUrlImport={false}
            allowVideosAndPdf={true}
            accept="image/*,video/mp4,video/quicktime,application/pdf,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.tiff,.tif,.mp4,.mov,.pdf"
            formatBadges={['JPG', 'PNG', 'WebP', 'HEIC', 'GIF', 'AVIF', 'MP4', 'MOV', 'PDF']}
          />
        </div>
      )}

      {/* Main Interface when files are loaded */}
      {files.length > 0 && (
        <div className="space-y-6">
          {/* Batch Stripping Progress Bar */}
          {isStrippingAll && (
            <div className="bg-gradient-to-r from-rose-50/90 via-pink-50/80 to-amber-50/90 dark:from-rose-950/50 dark:via-pink-950/40 dark:to-amber-950/50 rounded-2xl p-5 border border-rose-200 dark:border-rose-900/60 shadow-md animate-fade-in space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30 shrink-0">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        Stripping Metadata in Progress...
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
                        {stripProgress.current} / {stripProgress.total} cleaned
                      </span>
                    </div>
                    {stripProgress.currentName && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate max-w-sm sm:max-w-md">
                        Processing: <strong className="font-mono text-slate-800 dark:text-slate-100">{stripProgress.currentName}</strong>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center">
                  <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 text-xl sm:text-2xl">
                    {stripProgress.total > 0 ? Math.round((stripProgress.current / stripProgress.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div
                className="w-full bg-slate-200 dark:bg-slate-800 rounded-lg h-5 p-0.5 overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700"
                role="progressbar"
                aria-valuenow={stripProgress.total > 0 ? Math.round((stripProgress.current / stripProgress.total) * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Metadata stripping progress"
              >
                <div
                  className="bg-rose-600 dark:bg-rose-500 h-full rounded-md transition-all duration-300 ease-out shadow-xs relative overflow-hidden"
                  style={{ width: `${Math.max(4, stripProgress.total > 0 ? (stripProgress.current / stripProgress.total) * 100 : 0)}%` }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-white/25 rounded-t-sm" />
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

          {/* Action strip bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {files.length} File{files.length !== 1 ? 's' : ''} Loaded • {doneCount} Cleaned
            </span>
            <div className="flex items-center space-x-2">
              {readyCount > 0 && (
                <button
                  onClick={handleStripAll}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('exif.stripAll', 'Strip All')} ({readyCount})</span>
                </button>
              )}
              {doneCount > 1 && (
                <button
                  onClick={handleDownloadAll}
                  disabled={isZipping}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-60"
                >
                  {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  <span>{isZipping ? 'Zipping…' : t('exif.downloadAllZip', 'Download All ZIP')}</span>
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
                    className={`group relative flex items-center space-x-3 p-3 rounded-xl cursor-pointer border transition-all duration-150 ${isSelected
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                  >
                    {/* Thumbnail / Kind Icon */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {f.fileKind === 'image' && (
                        <img src={f.previewUrl} alt={f.file.name} className="w-full h-full object-cover" />
                      )}
                      {f.fileKind === 'video' && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          <Video className="w-6 h-6" />
                          <span className="text-[9px] font-bold uppercase mt-0.5">Video</span>
                        </div>
                      )}
                      {f.fileKind === 'pdf' && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                          <FileText className="w-6 h-6" />
                          <span className="text-[9px] font-bold uppercase mt-0.5">PDF</span>
                        </div>
                      )}
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
                  {/* File preview + action row */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-0">
                      {/* Original Preview */}
                      <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Original File
                          </p>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {selected.fileKind}
                          </span>
                        </div>
                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2">
                          {selected.fileKind === 'image' && (
                            <img src={selected.previewUrl} alt="original" className="max-w-full max-h-full object-contain" />
                          )}
                          {selected.fileKind === 'video' && (
                            <video src={selected.previewUrl} controls className="max-w-full max-h-full rounded-lg" />
                          )}
                          {selected.fileKind === 'pdf' && (
                            <div className="flex flex-col items-center justify-center text-center p-4">
                              <FileText className="w-12 h-12 text-rose-500 mb-2" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{selected.file.name}</span>
                              <span className="text-[11px] text-slate-400 mt-0.5">PDF Document</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">{formatBytes(selected.file.size)}</p>
                      </div>

                      {/* Cleaned Result Preview */}
                      {selected.result && (
                        <div className="flex-1 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Cleaned ✓</p>
                          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2">
                            {selected.fileKind === 'image' && (
                              <img src={selected.result.previewUrl} alt="cleaned" className="max-w-full max-h-full object-contain" />
                            )}
                            {selected.fileKind === 'video' && (
                              <video src={selected.result.previewUrl} controls className="max-w-full max-h-full rounded-lg" />
                            )}
                            {selected.fileKind === 'pdf' && (
                              <div className="flex flex-col items-center justify-center text-center p-4">
                                <ShieldCheck className="w-12 h-12 text-emerald-500 mb-2" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Metadata Stripped PDF</span>
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Ready to download</span>
                              </div>
                            )}
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
                          <span>Strip Metadata</span>
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
                          <span>{t('exif.downloadClean', 'Download Clean File')}</span>
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
                    <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 gap-3">
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

                      {/* Export Dropdown + Show IDs toggle */}
                      <div className="flex items-center space-x-2">
                        {selected.exif && selected.exif.tags.length > 0 && (
                          <div className="relative" ref={exportDropdownRef}>
                            <button
                              type="button"
                              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{t('exif.exportExif', 'Export EXIF')}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isExportDropdownOpen && (
                              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportExifToHtml(selected.file.name, selected.exif!);
                                    setIsExportDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <FileCode className="w-4 h-4 text-orange-500 shrink-0" />
                                  <div className="flex flex-col text-left">
                                    <span>Export as HTML (.html)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Styled visual report</span>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportExifToCsv(selected.file.name, selected.exif!);
                                    setIsExportDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <div className="flex flex-col text-left">
                                    <span>Export as CSV (.csv)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Spreadsheet table</span>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportExifToJson(selected.file.name, selected.exif!);
                                    setIsExportDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <Code2 className="w-4 h-4 text-blue-500 shrink-0" />
                                  <div className="flex flex-col text-left">
                                    <span>Export as JSON (.json)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Raw programmatic data</span>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportExifToTxt(selected.file.name, selected.exif!);
                                    setIsExportDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                  <div className="flex flex-col text-left">
                                    <span>Export as TXT (.txt)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Plain text report</span>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {selected.exif && selected.exif.tags.length > 0 && (
                          <button
                            onClick={() => setShowRawTags(!showRawTags)}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-2 py-1.5"
                          >
                            {showRawTags ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showRawTags ? 'Hide IDs' : 'Show IDs'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      {selected.status === 'reading' && (
                        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 py-4">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Reading metadata…</span>
                        </div>
                      )}

                      {(selected.status === 'ready' || selected.status === 'processing' || selected.status === 'done' || selected.status === 'error') && (
                        <>
                          {(!selected.exif || selected.exif.tags.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              </div>
                              <p className="font-bold text-slate-900 dark:text-white">No Metadata Tags Found</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                                This {selected.fileKind} has no detectable EXIF or container metadata embedded, or it was already scrubbed.
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
                                    <span>Software / Author Info</span>
                                  </div>
                                )}
                                {selected.exif.rawSize > 0 && (
                                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    <span>~{formatBytes(selected.exif.rawSize)} metadata block</span>
                                  </div>
                                )}
                              </div>

                              {/* Grouped tags */}
                              {Object.entries(grouped).map(([category, catTags]) => {
                                const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;
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
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Tags Stripped</p>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Select a file to inspect its metadata</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INTELLIGENT EDUCATIONAL GUIDE SECTION WITH DUAL STYLE TOGGLE: Shown ONLY when NO files are loaded */}
      {files.length === 0 && (
        <section className="max-w-2xl mx-auto space-y-8 pt-4">
          {/* Style Switcher Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Knowledge &amp; Privacy Hub
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Everything You Need to Know About EXIF &amp; Metadata
              </h2>
            </div>

            {/* Toggle pill */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setActiveGuideStyle('saas')}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeGuideStyle === 'saas'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('exif.modernGuide', 'Modern Guide')}</span>
              </button>
              <button
                onClick={() => setActiveGuideStyle('wiki')}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeGuideStyle === 'wiki'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('exif.technicalWiki', 'Technical Wiki')}</span>
              </button>
            </div>
          </div>

          {/* OPTION 1: Modern SaaS / Landing Page Style */}
          {activeGuideStyle === 'saas' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Hero Overview Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/10">
                    <ExifIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      The Hidden Footprint in Your Photos: Understanding EXIF Data
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Every time you snap a photo or record a video, your device attaches hidden metadata known as EXIF (Exchangeable Image File Format). Originally created as a cheat sheet for photographers to remember their camera settings, it has evolved into a comprehensive digital diary.
                    </p>
                  </div>
                </div>
              </div>

              {/* What exactly is hiding in your files? */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    What exactly is hiding in your files?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Sensitive attributes embedded into every image, video, and document.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 1. The Gear */}
                  <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">The Gear</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                        Camera make, model, lens specs, and even the unique hardware serial number.
                      </p>
                    </div>
                  </div>

                  {/* 2. The Settings */}
                  <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Settings2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">The Settings</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                        Shutter speed, aperture, ISO speed, flash mode, exposure bias, and white balance.
                      </p>
                    </div>
                  </div>

                  {/* 3. The Location */}
                  <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
                      <MapPin className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">The Location</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                        Exact GPS coordinates (latitude/longitude), altitude, heading, and GPS datestamps.
                      </p>
                    </div>
                  </div>

                  {/* 4. The Timeline */}
                  <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Clock className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">The Timeline</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                        Exact capture date, precise modification seconds, and device time zone.
                      </p>
                    </div>
                  </div>

                  {/* 5. The File Specs */}
                  <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Layers className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">The File Specs</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                        Dimensions, orientation, color profiles (ICC), software tags, and hidden embedded thumbnails.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How to Clean Your Files in 5 Simple Steps — VERTICAL LAYOUT */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    How to Clean Your Files in 5 Simple Steps
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Follow this straightforward sequence to completely wipe identifying metadata.
                  </p>
                </div>

                {/* Vertical connected step timeline */}
                <div className="relative flex flex-col space-y-6 sm:space-y-7 pl-2">
                  {/* Vertical connecting line */}
                  <div className="absolute left-7 sm:left-8 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800" />

                  {/* Step 1 */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md shadow-rose-500/10">
                      1
                    </div>
                    <div className="pt-0.5">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Drop them in
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Drag and drop or click <strong className="text-slate-900 dark:text-white">Select Files</strong> (process up to 20 files at once, up to 50MB each).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border-2 border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10">
                      2
                    </div>
                    <div className="pt-0.5">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Inspect the data
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Click any thumbnail to view a categorized table of all hidden tags, camera IDs, and dates.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
                      3
                    </div>
                    <div className="pt-0.5">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Target sensitive info &amp; Export
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        <strong className="text-slate-900 dark:text-white">Pro tip:</strong> Export metadata into HTML, CSV, JSON, or TXT to archive or audit sensitive tags like "GPS", "Location", "Serial", or "Owner".
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-purple-50 dark:bg-purple-950/80 border-2 border-purple-500/30 text-purple-600 dark:text-purple-400 font-extrabold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md shadow-purple-500/10">
                      4
                    </div>
                    <div className="pt-0.5">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Scrub the data
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Click <strong className="text-slate-900 dark:text-white">Remove EXIF</strong> for individual files, or use <strong className="text-slate-900 dark:text-white">Bulk Remove</strong> to wipe everything at once.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">
                      5
                    </div>
                    <div className="pt-0.5">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Download
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Save your newly cleaned files one by one, or hit <strong className="text-slate-900 dark:text-white">Download All ZIP</strong> to package the entire cleaned batch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supported Formats — Vertical Cards */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Supported Formats
                </h3>
                <div className="space-y-3.5">
                  <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                      <FileImage className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Images</span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">JPEG, PNG, WebP, HEIC/HEIF, GIF, AVIF</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">Full EXIF, XMP, IPTC, and ICC profile detection and stripping.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Video className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Videos</span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">MP4, MOV</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">Strips QuickTime udta user metadata, recording dates, GPS, and device serials.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Documents</span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">PDF</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">Clears author, producer software, and creation/modification timestamps.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why You Should Care About Metadata — VERTICAL LAYOUT */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Why You Should Care About Metadata
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Before sharing photos online, you should know what story they are really telling:
                  </p>
                </div>

                {/* Vertical list with large icon badges */}
                <div className="space-y-4">
                  {/* Location Leaks */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/60 border-2 border-rose-500/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/10">
                      <MapPin className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-rose-900 dark:text-rose-200">Location Leaks</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        GPS coordinates can expose your exact home address, children's schools, workplace, and travel habits down to the meter.
                      </p>
                    </div>
                  </div>

                  {/* Routine Tracking */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 border-2 border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/10">
                      <Clock className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">Routine Tracking</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Timestamps reveal your daily schedule, when your house is empty, and exact vacation periods.
                      </p>
                    </div>
                  </div>

                  {/* Device Fingerprinting */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/60 border-2 border-blue-500/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/10">
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-blue-900 dark:text-blue-200">Device Fingerprinting</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Camera and lens serial numbers can trace an anonymous upload or whistleblowing submission directly back to your physical hardware.
                      </p>
                    </div>
                  </div>

                  {/* Thumbnail Retention Warning */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/60 border-2 border-purple-500/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/10">
                      <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-purple-900 dark:text-purple-200">Thumbnail Retention Danger</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Even if you crop or black out sensitive parts of an image, the unedited, full-size original thumbnail is frequently left intact inside the EXIF metadata block!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Scrubbing & 100% Private — Vertical Cards */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      Smart Scrubbing: What Leaves and What Stays
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Our tool removes privacy hazards while preserving everything your device needs to display the file properly.
                  </p>
                  <div className="mt-3 space-y-2 text-xs sm:text-sm">
                    <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                      <strong>What gets wiped:</strong> GPS coordinates, camera/device info, timestamps, software tags, and hidden embedded thumbnails.
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                      <strong>What stays intact:</strong> Image orientation, color profiles (like sRGB), dimensions, transparency (PNGs), and visual pixels.
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Lock className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      100% Private, Zero Server Uploads
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    Uploading files to a remote server to clean them is counter-productive. That's why imagetooltip operates completely offline inside your browser.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">✓ No Uploads</div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">✓ Local WebAssembly</div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">✓ Zero Tracking</div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">✓ No Accounts Needed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 2: Concise & Technical (Wiki / Knowledge Base Style) */}
          {activeGuideStyle === 'wiki' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Wiki Overview Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                  <span>DOCUMENTATION // EXIF-STD-2.32</span>
                </div>
                <h3 className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                  EXIF Data Management Guide
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  EXIF (Exchangeable Image File Format) is a metadata standard used in image and video files. While originally designed to log camera settings, it now stores extensive background data, including:
                </p>

                <div className="space-y-2.5 mt-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">• Camera &amp; Device:</span>
                    <span className="text-slate-500 dark:text-slate-400">Make, model, lens, serial number</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">• Capture Settings:</span>
                    <span className="text-slate-500 dark:text-slate-400">Shutter, aperture, ISO, flash, white balance</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">• Geolocation:</span>
                    <span className="text-slate-500 dark:text-slate-400">GPS coords, altitude, heading</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">• Chronology:</span>
                    <span className="text-slate-500 dark:text-slate-400">Capture date, time, time zone</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">• Image Properties:</span>
                    <span className="text-slate-500 dark:text-slate-400">Dimensions, orientation, ICC profiles, embedded thumbnails</span>
                  </div>
                </div>
              </div>

              {/* Wiki Usage Instructions & Protocol Table */}
              <div className="space-y-6">
                {/* Usage Instructions */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                  <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                    Usage Instructions (Max 20 files, 50MB each)
                  </h4>
                  <ol className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono">
                    <li className="flex items-start space-x-2.5">
                      <span className="text-rose-600 font-bold shrink-0">1.</span>
                      <span><strong>Add Files:</strong> Drag and drop files or click Select Files.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <span className="text-rose-600 font-bold shrink-0">2.</span>
                      <span><strong>View Tags:</strong> Click on any file thumbnail to open the tag data table.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <span className="text-rose-600 font-bold shrink-0">3.</span>
                      <span><strong>Search / Export:</strong> Filter specific metadata or export to HTML, CSV, JSON, or TXT.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <span className="text-rose-600 font-bold shrink-0">4.</span>
                      <span><strong>Remove Metadata:</strong> Select Remove EXIF for single files or Bulk Remove for the batch.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <span className="text-rose-600 font-bold shrink-0">5.</span>
                      <span><strong>Save:</strong> Download files individually or select Save All (ZIP).</span>
                    </li>
                  </ol>
                </div>

                {/* Data Retention Protocol */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                  <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                    Data Retention Protocol
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                    The tool selectively strips identifying data while preserving structural data required for file rendering:
                  </p>
                  <div className="space-y-3 text-xs sm:text-sm font-mono">
                    <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">REMOVED:</span>
                      <span className="text-slate-600 dark:text-slate-300">GPS data, device/camera information, timestamps, software tags, and embedded thumbnails.</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">PRESERVED:</span>
                      <span className="text-slate-600 dark:text-slate-300">Image/video data, dimensions, orientation, color profiles, and transparency.</span>
                    </div>
                  </div>
                </div>

                {/* Privacy Risks & Local Processing Specification */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                  <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                    Privacy &amp; Security Risks of Metadata
                  </h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono">
                    <li><strong>Location Exposure:</strong> GPS data tracks physical locations and movement patterns.</li>
                    <li><strong>Schedule Exposure:</strong> Timestamps map out daily routines.</li>
                    <li><strong>Identity Linking:</strong> Serial numbers and software tags connect anonymous files to specific users.</li>
                    <li><strong>Thumbnail Retention:</strong> Cropped or redacted images often retain the original, unedited image thumbnail within the EXIF data.</li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
                  <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                    Local Processing Architecture
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                    To ensure absolute data security, this tool operates entirely via local WebAssembly and Canvas APIs within your browser.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono">
                    <li>• Files are never uploaded to external servers.</li>
                    <li>• File contents are completely inaccessible to tracking.</li>
                    <li>• No user account or registration is required.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Real-time Media Adding & Inspection Progress Modal */}
      <UploadProgressBar
        status={{
          ...uploadStatus,
          onDismissErrors: () => setUploadStatus(prev => ({ ...prev, errorMessages: [] })),
        }}
      />
    </div>
  );
};
