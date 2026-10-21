import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActiveTab } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { t } = useTranslation();
  const handleNav = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-2 space-y-3">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
              aria-label="imagetooltip Home"
            >
              <img
                src="/logo-default.svg"
                alt="imagetooltip logo"
                className="h-8 sm:h-9 w-auto dark:hidden transition-transform duration-200 group-hover:scale-105"
              />
              <img
                src="/logo-white.svg"
                alt="imagetooltip logo"
                className="h-8 sm:h-9 w-auto hidden dark:block transition-transform duration-200 group-hover:scale-105"
              />
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              {t('footer.tagline', 'Free, private in-browser image converter, compressor, resizer, and EXIF cleaner. High-speed client-side WebAssembly processing with zero server uploads and 100% privacy.')}
            </p>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3.5">
              {t('footer.tools', 'Tools')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleNav('converter')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  {t('nav.converter', 'Image Converter')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('compressor')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  {t('nav.compressor', 'Image Compressor')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('resizer')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  {t('nav.resizer', 'Image Resizer')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('exif-remover')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  {t('nav.exif', 'EXIF Remover')}
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Converters */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3.5">
              Popular Converters
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleNav('png-to-jpg')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  PNG to JPG
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('jpg-to-png')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  JPG to PNG
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('png-to-webp')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  PNG to WebP
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('webp-to-png')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  WebP to PNG
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('jpg-to-webp')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  JPG to WebP
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('webp-to-jpg')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  WebP to JPG
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('png-to-ico')}
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  PNG to ICO Favicon
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} imagetooltip.com</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-medium text-slate-500 dark:text-slate-400">
            <button
              onClick={() => handleNav('about')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('nav.about', 'About')}
            </button>
            <button
              onClick={() => handleNav('contact')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('nav.contact', 'Contact')}
            </button>
            <button
              onClick={() => handleNav('faq')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('nav.faq', 'FAQ')}
            </button>
            <button
              onClick={() => handleNav('privacy')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('nav.privacy', 'Privacy Policy')}
            </button>
          </div>
          <div className="flex items-center shrink-0">
            <LanguageSwitcher direction="up" />
          </div>
        </div>
      </div>
    </footer>
  );
};
