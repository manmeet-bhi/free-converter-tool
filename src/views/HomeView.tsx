import React from 'react';
import { ActiveTab } from '../types';
import { DropZone } from '../components/DropZone';
import {
  ShieldCheck,
  Zap,
  Lightbulb,
  Heart,
  Maximize2,
  Wand2,
  Code,
  ShoppingBag,
  Camera,
  Share2,
  Mail,
  PenTool,
  Briefcase,
  GraduationCap,
  CloudOff,
  Trash2
} from 'lucide-react';
import { isWebpEncodingSupported, isAvifEncodingSupported } from '../utils/formatSupport';

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
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Convert &amp; Compress
        </h1>
        {/* Hero DropZone */}
        <div className="pt-4 max-w-2xl mx-auto">
          <DropZone
            onFilesSelected={(files) => onFilesSelected(files, 'converter')}
            title="Drop images here to start"
            subtitle="JPG, PNG, WebP, AVIF, SVG, GIF, BMP, ICO"
          />
        </div>
      </div>

      {/* Feature Highlights Section */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 sm:gap-y-10 gap-x-6">
            {/* 1. Perfect Quality */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200 mb-2.5">
                <Maximize2 className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Perfect Quality
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Advanced encoding algorithms preserve crisp details and color accuracy without degradation.
              </p>
            </div>

            {/* 2. Lightning Fast */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200 mb-2.5">
                <Zap className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Lightning Fast
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Instant client-side processing leverages local hardware acceleration for real-time speed.
              </p>
            </div>

            {/* 3. Easy To Use */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200 mb-2.5">
                <Wand2 className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Easy To Use
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Just drop your files and let our tools do the rest in one simple, intuitive click.
              </p>
            </div>

            {/* 4. Works Anywhere */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200 mb-2.5">
                <Lightbulb className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Works Anywhere
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                100% browser-based with zero install. Seamless on Windows, macOS, Linux, iOS & Android.
              </p>
            </div>

            {/* 5. Privacy Guaranteed */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200 mb-2.5">
                <ShieldCheck className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Privacy Guaranteed
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your photos never leave your device. All conversions run locally inside your browser.
              </p>
            </div>

            {/* 6. Free to use */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200 mb-2.5">
                <Heart className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Free to Use
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No subscriptions, no hidden watermarks, and no limits. Completely free forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How To Resize & Compress Guides */}
      <section className="max-w-2xl mx-auto px-4 space-y-6">
        {/* 1. How to Resize an Image */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* Visual Illustration matching reference */}
            <div className="bg-slate-100 dark:bg-[#1f242d] rounded-2xl p-6 flex items-center justify-center border border-slate-200/80 dark:border-slate-800/80 min-h-[160px] sm:min-h-[190px]">
              <svg viewBox="0 0 250 120" fill="none" stroke="currentColor" className="w-full max-w-[210px] h-auto text-slate-800 dark:text-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* Left: Original Image */}
                <g transform="translate(10, 15)">
                  <rect x="0" y="0" width="76" height="76" rx="14" strokeWidth="2.5" />
                  <circle cx="38" cy="28" r="7" strokeWidth="2.5" />
                  <path d="M4 64 L26 42 L42 56 L54 44 L72 62" strokeWidth="2.5" />
                </g>

                {/* Arrow */}
                <g transform="translate(104, 46)">
                  <line x1="0" y1="8" x2="22" y2="8" strokeWidth="2.5" />
                  <polyline points="15,1 22,8 15,15" strokeWidth="2.5" />
                </g>

                {/* Right: Resized Image with dashed handles */}
                <g transform="translate(145, 10)">
                  {/* Dashed outer bounding box */}
                  <rect x="6" y="6" width="80" height="80" strokeDasharray="4 4" strokeWidth="2" className="text-slate-400 dark:text-slate-400" />
                  {/* Corner handles */}
                  <rect x="3" y="3" width="6" height="6" fill="currentColor" />
                  <rect x="83" y="3" width="6" height="6" fill="currentColor" />
                  <rect x="3" y="83" width="6" height="6" fill="currentColor" />
                  <rect x="83" y="83" width="6" height="6" fill="currentColor" />
                  {/* Diagonal resize cursor arrow */}
                  <g transform="translate(68, 14)">
                    <path d="M0 10 L8 2 M2 2 L8 2 L8 8" strokeWidth="2.5" />
                  </g>
                  {/* Scaled inner image */}
                  <g transform="translate(8, 26)">
                    <rect x="0" y="0" width="52" height="52" rx="10" strokeWidth="2.2" />
                    <circle cx="26" cy="18" r="5" strokeWidth="2.2" />
                    <path d="M3 44 L18 28 L30 38 L38 30 L49 41" strokeWidth="2.2" />
                  </g>
                </g>
              </svg>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                How to Resize an Image?
              </h3>
              <ol className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>
                  1. Click on the <strong className="text-slate-900 dark:text-white font-semibold">"Select Image"</strong> button to select an image.
                </li>
                <li>
                  2. Enter a new <strong className="text-slate-900 dark:text-white font-semibold">target size</strong> for your image.
                </li>
                <li>
                  3. Click the <strong className="text-slate-900 dark:text-white font-semibold">"Resize Image"</strong> button to resize the image.
                </li>
              </ol>
              <div className="pt-1">
                <button
                  onClick={() => setActiveTab('resizer')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Go to Image Resizer &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. How to Compress an Image */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* Visual Illustration for Compress */}
            <div className="bg-slate-100 dark:bg-[#1f242d] rounded-2xl p-6 flex items-center justify-center border border-slate-200/80 dark:border-slate-800/80 min-h-[160px] sm:min-h-[190px]">
              <svg viewBox="0 0 250 120" fill="none" stroke="currentColor" className="w-full max-w-[210px] h-auto text-slate-800 dark:text-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* Left: Original Large Image */}
                <g transform="translate(10, 10)">
                  <rect x="0" y="0" width="76" height="76" rx="14" strokeWidth="2.5" />
                  <circle cx="38" cy="28" r="7" strokeWidth="2.5" />
                  <path d="M4 64 L26 42 L42 56 L54 44 L72 62" strokeWidth="2.5" />
                  <rect x="14" y="82" width="48" height="18" rx="9" fill="currentColor" className="text-slate-200 dark:text-slate-800" stroke="none" />
                  <text x="38" y="95" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold" stroke="none" className="text-slate-700 dark:text-slate-300">
                    5.2 MB
                  </text>
                </g>

                {/* Arrow */}
                <g transform="translate(104, 46)">
                  <line x1="0" y1="8" x2="22" y2="8" strokeWidth="2.5" />
                  <polyline points="15,1 22,8 15,15" strokeWidth="2.5" />
                </g>

                {/* Right: Compressed Image with Reduction */}
                <g transform="translate(150, 10)">
                  <rect x="4" y="4" width="72" height="72" rx="12" strokeWidth="2.5" />
                  <circle cx="40" cy="28" r="6" strokeWidth="2.2" />
                  <path d="M8 62 L26 42 L38 52 L48 42 L68 58" strokeWidth="2.2" />
                  {/* Compression Inward Corner Marks */}
                  <path d="M-1 4 L4 4 L4 -1" strokeWidth="2" />
                  <path d="M81 4 L76 4 L76 -1" strokeWidth="2" />
                  <path d="M-1 76 L4 76 L4 81" strokeWidth="2" />
                  <path d="M81 76 L76 76 L76 81" strokeWidth="2" />
                  <rect x="8" y="82" width="64" height="18" rx="9" fill="currentColor" className="text-emerald-100 dark:text-emerald-950" stroke="none" />
                  <text x="40" y="95" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" stroke="none" className="text-emerald-700 dark:text-emerald-400">
                    -85% (350 KB)
                  </text>
                </g>
              </svg>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                How to Compress an Image?
              </h3>
              <ol className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>
                  1. Click on the <strong className="text-slate-900 dark:text-white font-semibold">"Select Image"</strong> button to upload your picture.
                </li>
                <li>
                  2. Choose your preferred <strong className="text-slate-900 dark:text-white font-semibold">compression quality</strong> or target file size.
                </li>
                <li>
                  3. Click the <strong className="text-slate-900 dark:text-white font-semibold">"Download"</strong> button to save the optimized file.
                </li>
              </ol>
              <div className="pt-1">
                <button
                  onClick={() => setActiveTab('compressor')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Go to Image Compressor &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Uses This Tool Section */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Who Uses This Tool?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Code className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Web Developers</span>
            </div>

            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">E-Commerce Sellers</span>
            </div>

            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Photographers</span>
            </div>

            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-950/70 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                <Share2 className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Social Media Managers</span>
            </div>

            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Email Marketers</span>
            </div>

            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <PenTool className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Bloggers and Content Creators</span>
            </div>

            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Office &amp; Business Teams</span>
            </div>

            <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Student &amp; Educators</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy-First Image Compression Section */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Side: Big Icons Arranged in a Straight Vertical Line */}
            <div className="relative flex flex-col justify-between space-y-6 sm:space-y-7">
              {/* Vertical connector line */}
              <div className="absolute left-7 sm:left-8 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-800" />

              {/* Icon 1: Zero Server Uploads */}
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">
                  <CloudOff className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Zero Server Uploads
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    100% in-browser processing
                  </p>
                </div>
              </div>

              {/* Icon 2: No Retention, No Storage */}
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border-2 border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10">
                  <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    No Retention, No Storage
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Zero logs or saved data
                  </p>
                </div>
              </div>

              {/* Icon 3: GDPR & CCPA Compliant */}
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/80 border-2 border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-md shadow-purple-500/10">
                  <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    GDPR &amp; CCPA Compliant
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Strict privacy standards
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Detailed Explanations */}
            <div className="flex flex-col justify-between space-y-6 sm:space-y-7 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
              <div className="space-y-1.5">
                <h5 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  100% Local
                </h5>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-4.5">
                  All the compression happens directly on your machine. Zero server connections, zero data sent.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  No Sign-Ups
                </h5>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-4.5">
                  Just jump in and use it. We don't want your email, there are no accounts, and we don't track you.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  Poof, It's Gone
                </h5>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-4.5">
                  The second you close your browser tab, all temporary memory used for your images is completely wiped clean.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
