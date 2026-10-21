import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How does imagetooltip process images without uploading to a server?',
    answer:
      'Modern web browsers are equipped with powerful native graphic rendering and memory APIs, including HTML5 Canvas, CanvasRenderingContext2D, createImageBitmap(), and Web Workers. imagetooltip uses these capabilities to decode, transform, compress, and re-encode pixel buffers locally inside your browser window. No network upload is ever performed.',
  },
  {
    question: 'What is the difference between lossy and lossless image compression?',
    answer:
      'Lossy compression (used in JPEG and WebP) strategically eliminates subtle pixel differences imperceptible to the human eye, enabling file size reductions of 50% to 90%. Lossless compression (used in PNG and BMP) preserves every single pixel identically, making it ideal for screenshots, logos, and crisp vector artwork, though file sizes remain larger.',
  },
  {
    question: 'Why does converting a transparent PNG to JPEG result in a background color?',
    answer:
      'The JPEG standard does not support an alpha (transparency) channel. When converting an image with transparent areas to JPEG, those empty pixels must be filled with a solid background color. imagetooltip allows you to configure this fill color (defaulting to clean white #FFFFFF or custom hex color) before conversion.',
  },
  {
    question: 'How does the Target File Size mode work in the Compressor?',
    answer:
      'When you request a target size (such as 250 KB), imagetooltip runs an automated binary search algorithm across canvas quality and dimension parameters. It repeatedly computes the compressed byte size until it finds the optimal quality setting that meets your specified ceiling without unnecessarily degrading visual quality.',
  },
  {
    question: 'Can I convert animated GIF files?',
    answer:
      'When an animated GIF is converted to formats like JPEG, PNG, or BMP, the static first frame of the animation is preserved and converted. WebP can support animation, but standard browser canvas export flattens to the current frame.',
  },
  {
    question: 'Is there a limit on how many images I can process at once?',
    answer:
      'You can add up to 20 images per batch. To process more, add another batch. All processing happens in your browser, so large images may still use significant memory. imagetooltip processes images sequentially to help prevent browser tab crashes.',
  },
  {
    question: 'Can I convert images to website Favicons (.ICO)?',
    answer:
      'Yes! imagetooltip includes a dedicated client-side ICO encoder that packages your images into valid Microsoft Icon (.ico) container files with 32-bit transparency, ready to be dropped into website root folders as favicon.ico.',
  },
];

export const FaqView: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-10 py-6 max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 shadow-xs">
          <HelpCircle className="w-4 h-4" />
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Everything you need to know about browser-based image conversion, compression algorithms, and privacy.
        </p>
      </div>

      {/* Accordion */}
      <div className="space-y-3.5">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full text-left px-6 py-4.5 flex items-center justify-between text-base sm:text-lg font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 ml-3 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
