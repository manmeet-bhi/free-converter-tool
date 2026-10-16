import React from 'react';
import { Cookie, ShieldCheck, Settings, ExternalLink, Info } from 'lucide-react';

export const CookiePolicyView: React.FC = () => {
  return (
    <div className="space-y-12 py-8 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 shadow-xs">
          <Cookie className="w-3.5 h-3.5" />
          <span>Tracking & Storage Disclosure</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cookie & Storage Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last Updated: October 2026 • Compliant with GDPR & ePrivacy Directive
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            1. What Are Cookies and Local Storage?
          </h2>
          <p>
            Cookies are small text files placed on your device by websites you visit. Similar technologies like HTML5 Local Storage allow web applications to store key-value data directly inside your web browser. This policy explains how <strong>ImageKit / Free Converter Tool</strong> utilizes these technologies.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            2. Categories of Storage We Use
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Strictly Necessary / Functional Local Storage</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We store your visual preference (Light or Dark theme mode) under the local key <code className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">imagekit_theme</code>. This ensures that when you reload or navigate the page, your chosen aesthetic remains intact. No personally identifiable information is stored.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Analytics Cookies (Google Analytics 4)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To understand how visitors discover and use our free image conversion tools, we use Google Analytics. These cookies collect anonymous aggregate traffic data such as browser type, device screen size, referring URLs, and general geographic region. We do not transmit or correlate image contents with analytics data.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Advertising Cookies (Google AdSense)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To keep our high-performance converter 100% free for everyone without subscriptions, we may display non-intrusive advertisements served by Google AdSense. Google and its ad partners use cookies (such as the DoubleClick cookie) to serve ads based on your prior visits to our site or other websites on the internet.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Cookie Table */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            3. Summary of Storage Elements
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Identifier</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                <tr>
                  <td className="p-3 font-bold text-blue-600 dark:text-blue-400">imagekit_theme</td>
                  <td className="p-3">First-Party</td>
                  <td className="p-3">Local Storage</td>
                  <td className="p-3 font-sans">Persists user Dark or Light mode UI preference</td>
                  <td className="p-3">Persistent</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-blue-600 dark:text-blue-400">_ga, _ga_*</td>
                  <td className="p-3">Google Analytics</td>
                  <td className="p-3">HTTP Cookie</td>
                  <td className="p-3 font-sans">Distinguishes anonymous visitors and sessions</td>
                  <td className="p-3">Up to 2 years</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-blue-600 dark:text-blue-400">__gads, IDE</td>
                  <td className="p-3">Google AdSense</td>
                  <td className="p-3">HTTP Cookie</td>
                  <td className="p-3 font-sans">Serves contextual or personalized advertisements</td>
                  <td className="p-3">Up to 13 months</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Opting Out */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            4. Managing and Disabling Cookies
          </h2>
          <p>
            You have full control over cookie usage. You can configure your browser to reject all cookies, alert you when a cookie is placed, or clear all storage upon exiting your browser.
          </p>
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                To opt out of personalized advertising by Google, visit{' '}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Google Ads Settings (adssettings.google.com)
                </a>.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                To opt out of Google Analytics measurement across all websites, install the{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
