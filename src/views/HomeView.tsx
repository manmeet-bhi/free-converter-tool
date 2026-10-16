import React from 'react';
import { ActiveTab } from '../types';
import { DropZone } from '../components/DropZone';
import { 
  FileImage, 
  Minimize2, 
  Scaling, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { isWebpEncodingSupported } from '../utils/formatSupport';

interface HomeViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onFilesSelected: (files: File[], defaultTool?: ActiveTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ setActiveTab, onFilesSelected }) => {
  const supportsWebp = isWebpEncodingSupported();

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-4 px-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Zero Server Uploads • 100% In-Browser Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Convert, Compress & Optimize Images
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The all-in-one private image workstation. Convert formats, compress file sizes, and resize dimensions instantly with zero data leaving your computer.
        </p>

        {/* Hero DropZone */}
        <div className="pt-4 max-w-2xl mx-auto">
          <DropZone
            onFilesSelected={(files) => onFilesSelected(files, 'converter')}
            title="Drop images here to start optimizing"
            subtitle="JPG, PNG, WebP, SVG, GIF, BMP, ICO • Unlimited & Free"
          />
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose Your Image Tool</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">All tools run natively inside your browser with maximum privacy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Converter Card */}
          <div
            onClick={() => setActiveTab('converter')}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileImage className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Image Converter
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Convert between JPG, PNG, WebP, BMP, and ICO. Batch convert multiple images simultaneously, rename outputs, and bundle into a ZIP.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">JPG &rarr; WebP</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">PNG &rarr; ICO</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">SVG &rarr; PNG</span>
              </div>
            </div>
            <div className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Open Converter</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Compressor Card */}
          <div
            onClick={() => setActiveTab('compressor')}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Minimize2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Image Compressor
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Compress JPG, PNG, and WebP files up to 90% without visible loss. Target specific file sizes (e.g. 200 KB) using our binary search optimizer.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Target KB/MB</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Quality Presets</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Before/After Slider</span>
              </div>
            </div>
            <div className="inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Open Compressor</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Resizer Card */}
          <div
            onClick={() => setActiveTab('resizer')}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-cyan-500 dark:hover:border-cyan-500 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Scaling className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Image Resizer
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Scale pixel dimensions, maintain aspect ratios, or choose one-click presets for Instagram, Twitter/X, YouTube, and website favicons.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Social Presets</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Aspect Lock</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Percentage Scale</span>
              </div>
            </div>
            <div className="inline-flex items-center text-sm font-semibold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>Open Resizer</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Browser Encoding Capabilities Status */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Your Browser Engine Capabilities
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('formats')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View detailed format matrix &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-300">JPG / PNG</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Native</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-300">WebP</span>
              <span className={`text-[11px] font-semibold flex items-center space-x-1 ${supportsWebp ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{supportsWebp ? 'Accelerated' : 'Unavailable'}</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-300">PNG</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lossless Alpha</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-300">BMP & ICO</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Client Engine</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits Grid */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Why Professionals Choose ImageKit
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Traditional online image tools upload your personal images to cloud servers. ImageKit is engineered completely differently.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">100% Private</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Images never leave your browser. Zero cloud uploads, zero data leaks, and zero tracking cookies.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">Lightning Fast</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No uploading or downloading wait times. Images process at the full speed of your local CPU and GPU.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">Batch Processing</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Queue dozens of images at once, apply uniform compression, and download everything as a clean ZIP archive.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">Safe & Sanitized</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              SVGs are thoroughly sanitized to strip potential script execution or remote tracking beacons.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Preview */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>Common Questions</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Answers</h2>
        </div>

        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
              Do my images get uploaded to any server?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No. ImageKit operates exclusively within your client web browser using the HTML5 Canvas API, standard Web Workers, and JSZip. Your images are never transmitted over the internet.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
              What is the best format for modern web images?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              WebP offers the best combination of wide browser compatibility, high compression (25-35% smaller than JPEG), and full transparency support across all modern devices.
            </p>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setActiveTab('faq')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Read all frequently asked questions &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
