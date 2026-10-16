import React from 'react';
import { ShieldCheck, Lock, Cpu, EyeOff, Trash2, CheckCircle2, FileText, ExternalLink } from 'lucide-react';

export const PrivacyView: React.FC = () => {
  return (
    <div className="space-y-12 py-8 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy & Security Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last Updated: October 2026 • Compliant with GDPR, CCPA, and Global Privacy Standards
        </p>
      </div>

      {/* Main Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Zero Server Uploads</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Unlike traditional file conversion websites that upload your personal or confidential photos to external servers, ImageKit executes 100% of conversion, compression, and scaling directly inside your browser window.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Zero Graphic Telemetry</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            We never view, intercept, or record image filenames, EXIF metadata, facial biometric profiles, or image contents. All buffers remain locked within your browser's private memory space.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Proactive RAM Reclamation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All preview and download links use ephemeral browser Object URLs. When you remove a file, clear the queue, or download an image, <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">URL.revokeObjectURL()</code> is called to immediately release RAM.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Safe SVG Handling</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Vector SVG files can theoretically carry embedded JavaScript or malicious links. ImageKit parses and sanitizes every SVG document before painting it to an isolated HTML5 canvas, neutralizing any active scripts.
          </p>
        </div>
      </div>

      {/* Comprehensive Legal Clauses */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            1. Information We Do Not Collect
          </h2>
          <p>
            When utilizing our converter, compressor, or resizer tools, your digital image files are processed strictly within your local computer or phone's memory. No image data, pixel matrices, or file contents are ever transmitted across the internet to our web servers or any external cloud services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            2. Local Browser Storage
          </h2>
          <p>
            We use your browser's native LocalStorage solely to remember your appearance preference (Light mode or Dark mode) via the key <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">imagekit_theme</code>. This data remains on your machine and is never shared.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            3. Google Analytics & Anonymous Metrics
          </h2>
          <p>
            We use Google Analytics to collect aggregated, anonymized statistics (such as overall visitor count, bounce rates, browser families, and general referral sources) to help us optimize the performance and interface of the application. IP anonymization is enabled. No image files or user identifications are linked to analytics records.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            4. Google AdSense & Advertising Cookies
          </h2>
          <p>
            We may display advertisements served by Google AdSense to fund ongoing maintenance and server hosting. Google uses cookies (including the DoubleClick cookie) to serve ads based on user visits to this website and other websites across the web. You can manage or disable personalized advertising by visiting{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Google Ad Settings
            </a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            5. User Rights Under GDPR & CCPA
          </h2>
          <p>
            Under the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), individuals have the right to access, rectify, or erase personal data. Because we do not collect personal profiles or retain image assets on our servers, there is no database of personal information to search or delete.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            6. Contact for Privacy Inquiries
          </h2>
          <p>
            If you have questions about our zero-upload privacy architecture or security practices, you can submit an inquiry via our contact form or email us at <strong className="text-slate-900 dark:text-white">support@free-converter-tool.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
