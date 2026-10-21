import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../i18n';

interface LanguageSwitcherProps {
  direction?: 'up' | 'down';
  align?: 'left' | 'right';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  direction = 'down',
  align = 'right',
  className = '',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language || i18n.language.startsWith(l.code)) ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleSelect = (lang: LanguageOption) => {
    i18n.changeLanguage(lang.code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <span className="text-xs font-semibold max-w-[90px] sm:max-w-none truncate">{currentLang.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
          direction === 'up'
            ? isOpen ? '' : 'rotate-180'
            : isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} ${
          direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
        } w-48 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100`}>
          <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/60 mb-1">
            Languages
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar overscroll-contain pr-0.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70'
                  }`}
                >
                  <span className="truncate">{lang.nativeName}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
