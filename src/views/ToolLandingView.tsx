import React, { useState } from 'react';
import { ActiveTab, ImageItem } from '../types';
import { ImageFormat } from '../utils/formatSupport';
import { ConverterView } from './ConverterView';
import { CompressorView } from './CompressorView';
import { ResizerView } from './ResizerView';
import { 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Layers, 
  FileCheck,
  Lock,
  Cpu
} from 'lucide-react';

export interface ToolPageConfig {
  slug: string;
  toolType: 'converter' | 'compressor' | 'resizer';
  targetFormat?: ImageFormat;
  acceptedFormats?: string[];
  h1: string;
  badge: string;
  intro: string;
  sourceFormatName?: string;
  targetFormatName?: string;
  howToSteps: { title: string; desc: string }[];
  benefits: { title: string; desc: string }[];
  faqs: { question: string; answer: string }[];
  relatedTools: { slug: string; label: string; desc: string }[];
}

interface ToolLandingViewProps {
  config: ToolPageConfig;
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onFilesSelected: (files: File[]) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ToolLandingView: React.FC<ToolLandingViewProps> = ({
  config,
  images,
  setImages,
  onFilesSelected,
  setActiveTab,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleNav = (route: string) => {
    const tab = route.replace(/^\//, '') as ActiveTab;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <article className="space-y-12 py-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
        <button 
          onClick={() => handleNav('/')}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Home
        </button>
        <span>/</span>
        <button 
          onClick={() => handleNav('/converter')}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Tools
        </button>
        <span>/</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200" aria-current="page">
          {config.h1}
        </span>
      </nav>

      {/* Hero Header */}
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>{config.badge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {config.h1}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {config.intro}
        </p>

        {/* Trust & Performance Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold">100% In-Browser Privacy</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">Instant Local Processing</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
            <Lock className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">Zero Server Uploads</span>
          </div>
        </div>
      </header>

      {/* Embedded Active Tool Interface */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-2 sm:p-6">
        {config.toolType === 'converter' && (
          <ConverterView
            images={images}
            setImages={setImages}
            onFilesSelected={onFilesSelected}
            defaultFormat={config.targetFormat || 'webp'}
            hideHeader={true}
          />
        )}
        {config.toolType === 'compressor' && (
          <CompressorView
            images={images}
            setImages={setImages}
            onFilesSelected={onFilesSelected}
          />
        )}
        {config.toolType === 'resizer' && (
          <ResizerView
            images={images}
            setImages={setImages}
            onFilesSelected={onFilesSelected}
          />
        )}
      </section>

      {/* Step-by-Step Instructions */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            How to Use This Tool in 3 Easy Steps
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fast, intuitive workflow designed for speed, privacy, and maximum quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {config.howToSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold text-sm flex items-center justify-center">
                {idx + 1}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Benefits Grid */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Why Choose ImageKit for Your Images?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Built for developers, designers, and privacy-conscious users worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {benefit.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      {config.faqs.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <span>Frequently Asked Questions</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear answers to common questions about formats, compression, and security.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden shadow-xs">
            {config.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="transition-colors">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Related Tools Internal Linking Grid */}
      {config.relatedTools.length > 0 && (
        <section className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Related Image Optimization Tools
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explore complementary conversion, compression, and scaling tools.
              </p>
            </div>
            <button
              onClick={() => handleNav('/converter')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>View All Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.relatedTools.map((tool, idx) => (
              <button
                key={idx}
                onClick={() => handleNav(tool.slug)}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-left transition-all group flex flex-col justify-between space-y-2 shadow-xs"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>{tool.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tool.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
