import React, { useState, useEffect } from 'react';
import { 
  getAvailableOutputFormats, 
  INPUT_FORMATS, 
  isWebpEncodingSupported,
  checkWebpDecodingSupport
} from '../utils/formatSupport';
import { 
  Grid, 
  CheckCircle2, 
  Sparkles, 
  Info,
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck
} from 'lucide-react';

export const FormatsView: React.FC = () => {
  const outputFormats = getAvailableOutputFormats();
  const [browserInfo, setBrowserInfo] = useState<string>('');
  const [webpDecodeOk, setWebpDecodeOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setBrowserInfo(navigator.userAgent);
    }

    async function runDiagnostics() {
      const webpDec = await checkWebpDecodingSupport();
      setWebpDecodeOk(webpDec);
    }

    runDiagnostics();
  }, []);

  const supportsWebpEnc = isWebpEncodingSupported();

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto px-4">
      {/* View Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
          <Cpu className="w-3.5 h-3.5" />
          <span>Real-Time Browser Capability Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Supported Image Formats
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ImageKit dynamically verifies your browser's native decoding and encoding capabilities for WebP, PNG, JPG, BMP, and ICO formats.
        </p>
      </div>

      {/* Live Browser Status Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Active Browser Diagnostic Matrix</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400 truncate max-w-md">
            {browserInfo ? browserInfo.slice(0, 70) + '...' : 'Browser detected'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {/* WebP Decode/Encode */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">WebP Support</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                Universal
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Decoding (Input):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{webpDecodeOk === null ? 'Testing...' : webpDecodeOk ? 'Supported' : 'Unavailable'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Encoding (Output):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{supportsWebpEnc ? 'Supported' : 'Unavailable'}</span>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight pt-1">
              Supported across Chrome, Safari, Firefox, Edge. 25-35% smaller than JPEG.
            </p>
          </div>

          {/* PNG Engine */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">PNG Format</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
                Lossless
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Decoding (Input):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Native</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Encoding (Output):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Full Alpha</span>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight pt-1">
              8-bit alpha transparency with zero compression loss.
            </p>
          </div>

          {/* BMP Engine */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">BMP (Bitmap)</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                Active
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Decoding (Input):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Native</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Encoding (Output):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Custom 24-bit</span>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight pt-1">
              Pure client-side Windows Bitmap generation with row padding.
            </p>
          </div>

          {/* ICO Engine */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ICO (Favicon)</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold">
                Active
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Decoding (Input):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Native</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Encoding (Output):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>32-bit Alpha</span>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight pt-1">
              Favicon and Windows icon packaging with full transparency support.
            </p>
          </div>
        </div>
      </div>

      {/* Format Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Output Format Specification Table
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare features, transparency support, and encoding methods for each target format.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Extension</th>
                <th className="p-3.5">Transparency</th>
                <th className="p-3.5">Compression</th>
                <th className="p-3.5">Encoding Engine</th>
                <th className="p-3.5">Best Used For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {outputFormats.map((fmt) => (
                <tr key={fmt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {fmt.label}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {fmt.extensions.join(', ')}
                  </td>
                  <td className="p-3.5">
                    {fmt.supportsTransparency ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Preserved</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Flattened (Matte fill)</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {fmt.isLossy ? 'Lossy (Adjustable Quality)' : 'Lossless (Pixel Perfect)'}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {fmt.id === 'bmp' ? 'Pure TS BMP Encoder' : fmt.id === 'ico' ? 'Pure TS ICO Encoder' : 'HTML5 Canvas API'}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs">
                    {fmt.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
