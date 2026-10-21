import React from 'react';
import { ActiveTab } from '../types';
import { ArrowRight } from 'lucide-react';

interface AboutViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ setActiveTab }) => {
  return (
    <div className="py-8 sm:py-12 max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          About
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          The story behind a free, independent image utility for everyone.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg">

        {/* Story Section */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            An Independent Story
          </h2>
          <p>
            Like many creators and developers, I found myself repeatedly needing to convert photos, compress large PNGs, resize screenshots, or create favicons. Almost every tool online had the same frustrating catches: aggressive upload limits, forced account signups, slow cloud queues, watermarks on downloaded files, or expensive monthly subscriptions.
          </p>
          <p>
            Worst of all, most services require uploading your personal images to a remote cloud server. Whether it is personal family photos, business assets, or sensitive documents, there was never a good reason to hand those files over to unknown servers just to change their format or dimensions.
          </p>
          <p>
            imagetooltip was built independently to change that. Modern web browsers are powerful enough to handle image compression and conversion directly on your own device. Every image you drop here stays right inside your browser window. Nothing is uploaded, nothing is stored, and no one else ever sees your work.
          </p>
        </section>

        {/* Why Ads Section */}
        <section className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Why We Show Ads
          </h2>
          <p>
            You might wonder why there are advertisements displayed on this website. The answer is simple: keeping this tool completely free requires covering ongoing expenses.
          </p>
          <p>
            Domain renewals, hosting infrastructure, SSL security, bandwidth, and regular maintenance all carry real recurring costs. Instead of hiding features behind a paywall, charging monthly subscriptions, or selling your personal data to third parties, we use non-intrusive advertisements to fund the platform.
          </p>
          <p>
            Ad revenue allows imagetooltip to remain 100% free, unlimited, and accessible to students, creators, developers, and small businesses worldwide without requiring a credit card or login.
          </p>
        </section>

        {/* Our Simple Promise */}
        <section className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Our Promise to You
          </h2>
          <p>
            We believe the web should be full of simple, useful, and privacy-respecting utilities. We promise to never add hidden fees, never restrict how many images you can convert, and never compromise your privacy by storing or processing your photos on remote servers.
          </p>
          <p>
            Thank you for using and supporting independent software on the web!
          </p>
        </section>

        {/* Simple CTA */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => {
              setActiveTab('converter');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <span>Start Converting Images</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
