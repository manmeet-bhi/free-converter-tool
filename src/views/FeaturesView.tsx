import React from 'react';
import { ActiveTab } from '../types';
import { 
  FileImage, 
  Minimize2, 
  Scaling, 
  Archive, 
  ShieldCheck, 
  Cpu, 
  Eye, 
  Zap, 
  Sliders, 
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface FeaturesViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const FeaturesView: React.FC<FeaturesViewProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-16 py-6 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Full Feature Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Modern Image Optimization Tools
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Designed for developers, creators, marketers, and privacy-conscious users who need fast, reliable tools without server queues or file size caps.
        </p>
      </div>

      {/* Feature 1: Multi-Format Converter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileImage className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            High-Fidelity Multi-Format Converter
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Convert seamlessly between next-gen web formats (WebP), traditional photographs (JPG), transparent graphics (PNG), Windows bitmaps (BMP), and website favicons (ICO).
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Preserves alpha transparency across compatible formats</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Configurable matte background color for JPEG/BMP conversions</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Inline file renaming before export</span>
            </li>
          </ul>
          <button
            onClick={() => setActiveTab('converter')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-2"
          >
            <span>Open Converter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Format Highlights
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">WebP</div>
              <div className="text-[11px] text-slate-500">25-35% smaller than JPG</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">PNG</div>
              <div className="text-[11px] text-slate-500">Lossless 8-bit alpha</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">ICO</div>
              <div className="text-[11px] text-slate-500">Favicon generator</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">BMP</div>
              <div className="text-[11px] text-slate-500">Uncompressed 24-bit RGB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2: Smart Compressor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="order-2 md:order-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Target Size Binary Search
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Need an image strictly under 200 KB for an upload portal? Enter your ceiling and our engine solves for the maximum possible quality that remains strictly under the limit.
          </p>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            &check; Genuine measurement: reported file sizes come directly from the generated Blob.
          </div>
        </div>

        <div className="order-1 md:order-2 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Minimize2 className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Targeted Image Compressor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Configurable profiles for balanced speed, high quality, maximum compression, or exact byte targets.
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Interactive Before / After split comparison slider</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Target file size mode (KB/MB)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Automatic stripping of unwanted EXIF tags</span>
            </li>
          </ul>
          <button
            onClick={() => setActiveTab('compressor')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
          >
            <span>Open Compressor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feature 3: Precision Resizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Scaling className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Precision Image Resizer
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Resize photos by exact dimensions or scale percentage with aspect ratio constraints to avoid distortion.
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span>One-click social presets (Instagram, Twitter/X, YouTube, LinkedIn)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span>Bi-directional aspect ratio lock toggle</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span>Helpful warnings when upscaling images</span>
            </li>
          </ul>
          <button
            onClick={() => setActiveTab('resizer')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline pt-2"
          >
            <span>Open Resizer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Bulk Batch ZIP Packaging
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Process dozens of images in parallel or sequence, preview each individually, and download the entire collection as a single, cleanly named .ZIP archive with one click.
          </p>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 pt-2">
            <Archive className="w-4 h-4" />
            <span>Integrated JSZip engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
