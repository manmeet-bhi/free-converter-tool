import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActiveTab } from '../types';
import {
  Layers,
  FileImage,
  Minimize2,
  Scaling,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { ExifIcon } from './icons/ExifIcon';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
}) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t('nav.home', 'Home'), icon: <Layers className="w-5 h-5" /> },
    { id: 'converter', label: t('nav.converter', 'Converter'), icon: <FileImage className="w-5 h-5" /> },
    { id: 'compressor', label: t('nav.compressor', 'Compressor'), icon: <Minimize2 className="w-5 h-5" /> },
    { id: 'resizer', label: t('nav.resizer', 'Resizer'), icon: <Scaling className="w-5 h-5" /> },
    { id: 'exif-remover', label: t('nav.exif', 'EXIF'), icon: <ExifIcon className="w-5 h-5" /> },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-3 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl py-1 px-1.5"
            aria-label="imagetooltip Home"
          >
            {/* Light Mode Logo (Blue & Black) */}
            <img
              src="/logo-default.svg"
              alt="imagetooltip logo"
              className="h-8 sm:h-9 w-auto dark:hidden transition-transform duration-200 group-hover:scale-105"
            />
            {/* Dark Mode Logo (White version for high contrast) */}
            <img
              src="/logo-white.svg"
              alt="imagetooltip logo"
              className="h-8 sm:h-9 w-auto hidden dark:block transition-transform duration-200 group-hover:scale-105"
            />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Language Switcher & Theme Toggle */}
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />

            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${isActive
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
