import React from 'react';
import { ActiveTab } from '../types';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Github, 
  Layers, 
  Lock, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  FileCode2,
  Heart
} from 'lucide-react';

interface AboutViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-16 py-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About ImageKit • Free Converter Tool</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Reimagining Image Processing for the Modern Web
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          A high-performance, open-source utility designed to convert, compress, and resize graphics instantly inside your browser with complete privacy.
        </p>

        {/* GitHub link button */}
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <a
            href="https://github.com/manmeet-bhi/free-converter-tool"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-sm transition-all duration-150 group"
          >
            <Github className="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform" />
            <span>GitHub Repository: manmeet-bhi/free-converter-tool</span>
          </a>
        </div>
      </div>

      {/* Why We Built This */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Why Free Converter Tool?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Most online image converters force you to upload your sensitive files, photos, or graphic assets to third-party cloud servers. This introduces unnecessary security risks, slow upload queues, strict file size limitations, and watermarks.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
            <strong>ImageKit</strong> was created to prove that modern web browsers are capable of heavy, high-fidelity raster graphic processing on the client side. By leveraging HTML5 Canvas, <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">createImageBitmap</code>, and custom TypeScript binary encoders, we bring workstation-grade performance right to your browser window.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">100% In-Browser Privacy</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your images never leave your local device. No server uploads, no temporary cloud storage, and no tracking of graphic data.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Wait Times</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Experience instant conversions powered by your device's multi-core CPU and GPU acceleration without network lag.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCode2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Open Source & Free</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Free to use forever without subscriptions, paywalls, or feature gates. Completely open source and community auditable.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Specifications */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Technical Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Binary Search Compression:</strong> Automated iterative search to compress lossy images to precise target file sizes.
            </div>
          </div>
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Pure TypeScript Encoders:</strong> Built-in 24-bit BMP and multi-resolution 32-bit ICO (Favicon) encoders.
            </div>
          </div>
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">SVG Sanitization Pipeline:</strong> Secure XML parsing that cleans script tags and attributes before canvas drawing.
            </div>
          </div>
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Memory Lifecycle Management:</strong> Immediate reclamation of RAM via <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">URL.revokeObjectURL()</code>.
            </div>
          </div>
        </div>
      </div>

      {/* Community & GitHub CTA */}
      <div className="rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white p-8 sm:p-10 shadow-lg shadow-blue-500/20 text-center space-y-4">
        <h3 className="text-2xl sm:text-3xl font-extrabold">Built for Creators, Developers & Teams</h3>
        <p className="text-blue-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          ImageKit is an open-source project maintained on GitHub. Star our repository, submit issues, or contribute features!
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <a
            href="https://github.com/manmeet-bhi/free-converter-tool"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm sm:text-base font-bold bg-white text-blue-900 hover:bg-blue-50 transition-all shadow-md active:scale-98"
          >
            <Github className="w-5 h-5" />
            <span>Star on GitHub</span>
          </a>
          <button
            onClick={() => { setActiveTab('converter'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm sm:text-base font-bold bg-blue-800 hover:bg-blue-900 text-white transition-all border border-blue-400/30 shadow-md active:scale-98"
          >
            <span>Start Converting</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
