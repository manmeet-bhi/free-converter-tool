import React from 'react';
import { FileText, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export const TermsView: React.FC = () => {
  return (
    <div className="space-y-12 py-8 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 shadow-xs">
          <FileText className="w-4 h-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last Updated: October 2026 • Effective Immediately
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using <strong>ImageKit / Free Converter Tool</strong> (accessible via our hosted web application or local distributions), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this utility.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            2. Description of Service
          </h2>
          <p>
            ImageKit provides a free, browser-based graphical utility enabling users to convert, compress, and resize digital image files directly within their web browser. All file processing operations are executed locally on the client device through HTML5 Canvas, <code className="font-mono text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">createImageBitmap</code>, and client-side binary encoders without transmitting your images to our servers.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            3. Intellectual Property Rights & Ownership
          </h2>
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 space-y-2">
            <div className="text-base font-bold flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>You retain 100% ownership of your images.</span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              We do not claim any copyright, license, or intellectual property rights over any images, vectors, photographs, or graphics you process using our tool. Because files are never sent to our servers, we never store, duplicate, or inspect your creations.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            4. User Representations & Acceptable Use
          </h2>
          <p>By using the Service, you represent and warrant that:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>You own or possess the legal authority to convert, compress, and modify the image files you submit.</li>
            <li>Your use of the Service does not infringe upon any third-party intellectual property rights, trademarks, or privacy rights.</li>
            <li>You will not attempt to exploit, reverse engineer, or inject malicious payload vectors through automated exploits against the application scripts.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            5. Disclaimer of Warranties
          </h2>
          <p>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT CONVERSION QUALITY WILL MEET EVERY PRECISION NEED, OR THAT FILE LOSS/CORRUPTION DUE TO UNUSUAL SYSTEM CRASHES OR MEMORY CONSTRAINTS ON CLIENT DEVICES CANNOT OCCUR. YOU ARE STRONGLY ADVISED TO MAINTAIN INDEPENDENT BACKUPS OF ALL ORIGINAL ASSETS.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            6. Limitation of Liability
          </h2>
          <p>
            IN NO EVENT SHALL THE AUTHORS, MAINTAINERS, OR CONTRIBUTORS OF THIS OPEN-SOURCE UTILITY BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES (INCLUDING LOSS OF DATA, REVENUE, OR HARDWARE MEMORY ISSUES) ARISING OUT OF THE USE OR INABILITY TO USE THIS SERVICE.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            7. Open Source & Third-Party Libraries
          </h2>
          <p>
            Free Converter Tool incorporates established open-source libraries (including React, Lucide Icons, and JSZip). The application source code is maintained transparently at{' '}
            <a
              href="https://github.com/manmeet-bhi/free-converter-tool"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              github.com/manmeet-bhi/free-converter-tool
            </a>.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            8. Modifications to Terms
          </h2>
          <p>
            We reserve the right to revise these Terms of Service at any time without prior notice. By continuing to use the service after modifications are published, you agree to be bound by the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
};
