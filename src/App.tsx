/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, ImageItem } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { ConverterView } from './views/ConverterView';
import { CompressorView } from './views/CompressorView';
import { ResizerView } from './views/ResizerView';
import { FormatsView } from './views/FormatsView';
import { PrivacyView } from './views/PrivacyView';
import { FaqView } from './views/FaqView';
import { FeaturesView } from './views/FeaturesView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { TermsView } from './views/TermsView';
import { CookiePolicyView } from './views/CookiePolicyView';
import { loadImageFromFile, revokeUrl } from './utils/imageProcessor';
import { detectInputFormat } from './utils/formatSupport';

const SLUG_TO_TAB: Record<string, ActiveTab> = {
  '/': 'home',
  '/home': 'home',
  '/converter': 'converter',
  '/compressor': 'compressor',
  '/resizer': 'resizer',
  '/format': 'formats',
  '/formats': 'formats',
  '/features': 'features',
  '/faq': 'faq',
  '/about': 'about',
  '/contact': 'contact',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/cookie': 'cookies',
  '/cookies': 'cookies',
};

const TAB_TO_SLUG: Record<ActiveTab, string> = {
  home: '/',
  converter: '/converter',
  compressor: '/compressor',
  resizer: '/resizer',
  formats: '/format',
  features: '/features',
  faq: '/faq',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookie',
};

function getTabFromPath(): ActiveTab {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  return SLUG_TO_TAB[path] || 'home';
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getTabFromPath);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('imagekit_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Navigate to tab and update URL slug via HTML5 History API
  const setActiveTab = useCallback((tab: ActiveTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetSlug = TAB_TO_SLUG[tab] || '/';
      if (window.location.pathname !== targetSlug) {
        window.history.pushState(null, '', targetSlug);
      }
    }
  }, []);

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath();
      setActiveTabState(tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Apply dark class to document root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('imagekit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('imagekit_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Sync document title dynamically based on active tab
  useEffect(() => {
    const titles: Record<ActiveTab, string> = {
      home: 'ImageKit – Free Browser-Based Image Converter & Compressor',
      converter: 'Image Converter – Convert JPG, PNG, WebP, BMP, ICO | ImageKit',
      compressor: 'Image Compressor – Reduce Image File Size with Target Mode | ImageKit',
      resizer: 'Image Resizer – Scale by Pixels, Ratio & Social Presets | ImageKit',
      features: 'Features & Architecture | ImageKit',
      formats: 'Supported Image Formats & Browser Matrix | ImageKit',
      privacy: 'Privacy Policy | ImageKit (Free Converter Tool)',
      faq: 'Frequently Asked Questions | ImageKit',
      about: 'About Us | ImageKit (Free Converter Tool)',
      contact: 'Contact Us & Support | ImageKit',
      terms: 'Terms of Service | ImageKit',
      cookies: 'Cookie & Storage Policy | ImageKit',
    };
    document.title = titles[activeTab] || 'ImageKit';
  }, [activeTab]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach((item) => {
        if (item.result?.previewUrl) revokeUrl(item.result.previewUrl);
        if (item.originalInfo.cleanedSvgUrl) revokeUrl(item.originalInfo.cleanedSvgUrl);
      });
    };
  }, []);

  // Handle incoming files from Dropzone, clipboard paste, or file pickers
  const handleFilesSelected = useCallback(
    async (files: File[], defaultTool?: ActiveTab) => {
      const newItems: ImageItem[] = [];

      for (const file of files) {
        try {
          const originalInfo = await loadImageFromFile(file);
          const inputFormat = detectInputFormat(file);

          const targetFormat = inputFormat === 'webp' ? 'jpeg' : 'webp';
          const lastDot = file.name.lastIndexOf('.');
          const baseName = lastDot !== -1 ? file.name.slice(0, lastDot) : file.name;
          const targetExt = targetFormat === 'jpeg' ? '.jpg' : `.${targetFormat}`;

          const item: ImageItem = {
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            file,
            originalInfo,
            originalSize: file.size,
            originalDimensions: {
              width: originalInfo.width,
              height: originalInfo.height,
            },
            customFilename: `${baseName}${targetExt}`,
            targetFormat,
            targetQuality: 0.85,
            targetWidth: originalInfo.width,
            targetHeight: originalInfo.height,
            maintainAspectRatio: true,
            backgroundColor: '#ffffff',
            status: 'idle',
          };

          newItems.push(item);
        } catch (err: unknown) {
          console.error(`Failed to load file ${file.name}:`, err);
        }
      }

      if (newItems.length > 0) {
        setImages((prev) => [...prev, ...newItems]);
        if (activeTab === 'home') {
          setActiveTab(defaultTool || 'converter');
        }
      }
    },
    [activeTab, setActiveTab]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView
            setActiveTab={setActiveTab}
            onFilesSelected={handleFilesSelected}
          />
        )}

        {activeTab === 'converter' && (
          <ConverterView
            images={images}
            setImages={setImages}
            onFilesSelected={handleFilesSelected}
          />
        )}

        {activeTab === 'compressor' && (
          <CompressorView
            images={images}
            setImages={setImages}
            onFilesSelected={handleFilesSelected}
          />
        )}

        {activeTab === 'resizer' && (
          <ResizerView
            images={images}
            setImages={setImages}
            onFilesSelected={handleFilesSelected}
          />
        )}

        {activeTab === 'formats' && <FormatsView setActiveTab={setActiveTab} />}

        {activeTab === 'features' && <FeaturesView setActiveTab={setActiveTab} />}

        {activeTab === 'faq' && <FaqView />}

        {activeTab === 'about' && <AboutView setActiveTab={setActiveTab} />}

        {activeTab === 'contact' && <ContactView />}

        {activeTab === 'privacy' && <PrivacyView />}

        {activeTab === 'terms' && <TermsView />}

        {activeTab === 'cookies' && <CookiePolicyView />}

      </main>

      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
