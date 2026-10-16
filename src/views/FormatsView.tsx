import React from 'react';
import { ActiveTab } from '../types';
import { 
  CheckCircle2, 
  ArrowRight, 
  Download,
  Upload
} from 'lucide-react';

interface FormatsViewProps {
  setActiveTab?: (tab: ActiveTab) => void;
}

export const FormatsView: React.FC<FormatsViewProps> = ({ setActiveTab }) => {
  const outputFormats = [
    {
      name: 'WebP',
      ext: '.webp',
      badge: 'Recommended',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
      transparency: true,
      type: 'Lossy & Lossless',
      desc: 'Modern web format. 25-35% smaller than JPG with full transparency support. Perfect for websites and fast loading.',
    },
    {
      name: 'JPG / JPEG',
      ext: '.jpg, .jpeg',
      badge: 'Universal',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
      transparency: false,
      type: 'Lossy (Adjustable)',
      desc: 'Standard photographic format. Works everywhere on all devices, phones, and computers.',
    },
    {
      name: 'PNG',
      ext: '.png',
      badge: 'Lossless',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
      transparency: true,
      type: 'Lossless (Pixel Perfect)',
      desc: 'Crisp image quality with transparent backgrounds. Best for logos, icons, graphics, and screenshots.',
    },
    {
      name: 'ICO (Favicon)',
      ext: '.ico',
      badge: 'Icon Spec',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
      transparency: true,
      type: 'Lossless (32-bit RGBA)',
      desc: 'Standard website favicon and Windows app icon with full alpha transparency.',
    },
    {
      name: 'BMP',
      ext: '.bmp',
      badge: 'Bitmap',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      transparency: false,
      type: 'Uncompressed',
      desc: 'Windows Bitmap image format. Raw uncompressed pixels for legacy systems and software.',
    },
  ];

  const inputFormats = [
    { name: 'JPG / JPEG', ext: '.jpg, .jpeg', desc: 'Photographs and digital images' },
    { name: 'PNG', ext: '.png', desc: 'Transparent graphics and screenshots' },
    { name: 'WebP', ext: '.webp', desc: 'Modern web images' },
    { name: 'SVG', ext: '.svg', desc: 'Vector illustrations (sanitized)' },
    { name: 'GIF', ext: '.gif', desc: 'Standard GIF images' },
    { name: 'BMP', ext: '.bmp', desc: 'Windows Bitmap files' },
    { name: 'ICO', ext: '.ico', desc: 'Website favicons and icons' },
  ];

  const handleOpenConverter = () => {
    if (setActiveTab) {
      setActiveTab('converter');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Supported Image Formats
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
          All conversions and compressions run 100% inside your browser. Fast, private, and unlimited.
        </p>
      </div>

      {/* Output Formats Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Output Formats (What You Can Convert To)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outputFormats.map((fmt) => (
            <div
              key={fmt.name}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                    {fmt.ext}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${fmt.badgeColor}`}>
                    {fmt.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {fmt.name}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {fmt.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transparency:</span>
                  <span className={fmt.transparency ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {fmt.transparency ? 'Supported' : 'No (White Fill)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Compression:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {fmt.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Formats Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Input Formats (Files You Can Upload)
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden shadow-xs">
          {inputFormats.map((fmt) => (
            <div
              key={fmt.name}
              className="p-4 sm:px-6 flex items-center justify-between flex-wrap gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                  {fmt.name.split(' ')[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {fmt.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {fmt.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {fmt.ext}
                </span>
                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Supported</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clean Call to Action */}
      <div className="text-center pt-2">
        <button
          onClick={handleOpenConverter}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
        >
          <span>Start Converting Images</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
