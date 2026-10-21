import React from 'react';
import { ExternalLink } from 'lucide-react';

export const PrivacyView: React.FC = () => {
  return (
    <div className="py-8 sm:py-12 max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy & Terms
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Conditions, rules, and privacy disclosure.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg">
        
        {/* Preamble */}
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          This agreement describes the conditions and rules under which the operator of imagetooltip.com ("we") offers you its services at imagetooltip.
        </p>

        {/* Terms Section */}
        <section className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Terms
          </h2>
          <ol className="space-y-3 list-decimal list-outside ml-5 marker:font-semibold marker:text-slate-400 dark:marker:text-slate-500">
            <li className="pl-1">
              Use of the imagetooltip.com service is at your own risk.
            </li>
            <li className="pl-1">
              All processing is performed in your browser. See Privacy section below.
            </li>
            <li className="pl-1">
              You may use the imagetooltip.com service for any purpose, personal or commercial.
            </li>
            <li className="pl-1">
              We reserve the right to change or cease any services at imagetooltip.com at any time.
            </li>
            <li className="pl-1">
              We reserve the right to change the terms of this agreement without notice.
            </li>
            <li className="pl-1">
              The imagetooltip.com service does not provide any guarantees.
            </li>
          </ol>
        </section>

        {/* Privacy Section */}
        <section className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Privacy
          </h2>
          <ol start={7} className="space-y-4 list-decimal list-outside ml-5 marker:font-semibold marker:text-slate-400 dark:marker:text-slate-500">
            <li className="pl-1">
              Your files never leave your device. All processing is performed locally in your browser using WebAssembly. No server-side processing is involved.
            </li>
            <li className="pl-1">
              We do not collect, store, or have access to any files you process using this service. This is technically impossible since your files stay on your device.
            </li>
            <li className="pl-1">
              Google collects data and uses cookies for ad personalization and measurement for this site.{' '}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Learn how Google collects and uses data.</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>{' '}
              You can turn off ad personalization at any time in your Google account settings. We also use cookies for statistical purposes. By using this site, you consent to our use of cookies.
            </li>
          </ol>
        </section>

      </div>
    </div>
  );
};
