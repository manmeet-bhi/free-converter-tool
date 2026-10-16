import React, { useEffect } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = '1234567890',
  format = 'auto',
  className = '',
}) => {
  useEffect(() => {
    try {
      // @ts-expect-error - adsbygoogle is injected by Google AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore if ad blocker is active or ads script is blocked
    }
  }, []);

  return (
    <div className={`my-8 flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <div className="w-full max-w-4xl p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
          Advertisement
        </span>
        <div className="min-h-[90px] flex items-center justify-center overflow-hidden">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', minHeight: '90px' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
};
