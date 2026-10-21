/**
 * Centralized SEO & Metadata Configuration
 * 
 * Manages all global metadata, canonical domains, Open Graph tags,
 * Twitter cards, structured data, and route-specific SEO properties.
 */

// Production base URL - configure via VITE_SITE_URL in production / Netlify
export const SITE_URL = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? import.meta.env.VITE_SITE_URL
    : 'https://freeconvertertool.netlify.app'
).replace(/\/$/, '');

export const SITE_NAME = 'imagetooltip';
export const SITE_BRAND = 'imagetooltip – Free Online Image Converter & Compressor';
export const DEFAULT_AUTHOR = 'imagetooltip Team';
export const TWITTER_HANDLE = '@imagetooltip';
export const GOOGLE_VERIFICATION_TOKEN = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_SITE_VERIFICATION
    ? import.meta.env.VITE_GOOGLE_SITE_VERIFICATION
    : ''
);

export interface PageMetadata {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  canonical: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  isIndexable: boolean;
  ogType?: 'website' | 'article';
}

export const SEO_ROUTES: Record<string, PageMetadata> = {
  '/': {
    slug: '/',
    title: 'Free Online Image Converter, Compressor & Resizer | imagetooltip',
    description: 'Convert between JPG, PNG, WebP, BMP, and ICO with complete local privacy. Fast batch processing, target size compression, and custom resizing with zero server uploads.',
    keywords: ['image converter', 'image compressor', 'image resizer', 'free online converter', 'png to jpg', 'jpg to webp', 'client-side image processing'],
    h1: 'Fast, Private In-Browser Image Converter & Compressor',
    canonical: `${SITE_URL}/`,
    changefreq: 'weekly',
    priority: 1.0,
    isIndexable: true,
  },
  '/converter': {
    slug: '/converter',
    title: 'Online Image Converter – Convert JPG, PNG, WebP, BMP, ICO | imagetooltip',
    description: 'Free batch image converter running locally in your browser. Convert images between JPG, PNG, WebP, BMP, and ICO without file size limits or server storage.',
    keywords: ['online image converter', 'batch image conversion', 'convert images free', 'png converter', 'webp converter', 'jpg converter'],
    h1: 'Online Image Converter',
    canonical: `${SITE_URL}/converter`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/png-to-jpg': {
    slug: '/png-to-jpg',
    title: 'PNG to JPG Converter – Convert PNG to High-Quality JPG Online | imagetooltip',
    description: 'Convert transparent or opaque PNG images to optimized JPG format instantly in your browser. Choose background fill color, set quality from 1% to 100%, and batch download as ZIP.',
    keywords: ['png to jpg', 'convert png to jpg', 'png to jpeg online', 'free png to jpg converter', 'batch png to jpg'],
    h1: 'PNG to JPG Converter',
    canonical: `${SITE_URL}/png-to-jpg`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/jpg-to-png': {
    slug: '/jpg-to-png',
    title: 'JPG to PNG Converter – Convert JPG to Lossless PNG Online | imagetooltip',
    description: 'Convert JPG photos and images to lossless 32-bit PNG format. Pixel-perfect rendering, no compression artifacts, zero file uploads, and complete device privacy.',
    keywords: ['jpg to png', 'convert jpg to png', 'jpeg to png', 'free jpg to png converter', 'lossless png'],
    h1: 'JPG to PNG Converter',
    canonical: `${SITE_URL}/jpg-to-png`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/png-to-webp': {
    slug: '/png-to-webp',
    title: 'PNG to WebP Converter – Reduce Image Size by up to 80% with Transparency | imagetooltip',
    description: 'Convert PNG graphics to next-gen WebP format while preserving 8-bit alpha transparency. Speed up web pages, boost Core Web Vitals, and save bandwidth.',
    keywords: ['png to webp', 'convert png to webp', 'png to webp with transparency', 'webp conversion', 'compress png to webp'],
    h1: 'PNG to WebP Converter',
    canonical: `${SITE_URL}/png-to-webp`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/webp-to-png': {
    slug: '/webp-to-png',
    title: 'WebP to PNG Converter – Convert WebP to Transparent PNG Online | imagetooltip',
    description: 'Extract and convert WebP images into transparent, widely supported PNG format for Photoshop, Illustrator, and legacy graphic software. Free & client-side.',
    keywords: ['webp to png', 'convert webp to png', 'extract webp', 'webp transparent to png', 'free webp to png converter'],
    h1: 'WebP to PNG Converter',
    canonical: `${SITE_URL}/webp-to-png`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/jpg-to-webp': {
    slug: '/jpg-to-webp',
    title: 'JPG to WebP Converter – Next-Gen 30% Smaller Web Images | imagetooltip',
    description: 'Convert photographic JPG files to lightweight modern WebP format. Achieve 25% to 35% smaller file sizes than JPG at equivalent visual fidelity for better SEO rankings.',
    keywords: ['jpg to webp', 'convert jpg to webp', 'jpeg to webp', 'web performance image converter', 'next gen image format'],
    h1: 'JPG to WebP Converter',
    canonical: `${SITE_URL}/jpg-to-webp`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/webp-to-jpg': {
    slug: '/webp-to-jpg',
    title: 'WebP to JPG Converter – Convert WebP to Standard JPEG Online | imagetooltip',
    description: 'Convert WebP images to universally compatible JPG/JPEG format for older operating systems, printers, and office suites. Adjust quality slider and batch process.',
    keywords: ['webp to jpg', 'convert webp to jpg', 'webp to jpeg online', 'universal image format converter'],
    h1: 'WebP to JPG Converter',
    canonical: `${SITE_URL}/webp-to-jpg`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/png-to-ico': {
    slug: '/png-to-ico',
    title: 'PNG to ICO Favicon Converter – Create 16x16, 32x32 & 48x48 Favicons | imagetooltip',
    description: 'Turn square PNG images and logos into valid Windows ICO favicon files with full 32-bit alpha transparency. Built-in client-side binary icon encoder.',
    keywords: ['png to ico', 'favicon generator', 'convert png to ico', 'ico favicon maker', 'create ico online'],
    h1: 'PNG to ICO Favicon Generator',
    canonical: `${SITE_URL}/png-to-ico`,
    changefreq: 'weekly',
    priority: 0.85,
    isIndexable: true,
  },
  '/image-compressor': {
    slug: '/image-compressor',
    title: 'Online Image Compressor – Compress JPG, PNG & WebP to Exact Target Size | imagetooltip',
    description: 'Compress image file sizes online without noticeable quality loss. Features Target Size mode (e.g. compress to 100KB, 50KB) and visual Before/After comparison slider.',
    keywords: ['image compressor', 'compress images online', 'compress to 100kb', 'target size compressor', 'photo size reducer'],
    h1: 'Online Image Compressor',
    canonical: `${SITE_URL}/image-compressor`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/resize-image': {
    slug: '/resize-image',
    title: 'Online Image Resizer – Scale Pixels, Percentages & Social Presets | imagetooltip',
    description: 'Resize images by custom width and height, fixed percentage, or standard social media dimensions (Instagram, YouTube, Twitter). Maintain aspect ratio or smart crop.',
    keywords: ['image resizer', 'resize image online', 'scale image pixels', 'social media image resizer', 'crop image online'],
    h1: 'Online Image Resizer',
    canonical: `${SITE_URL}/resize-image`,
    changefreq: 'weekly',
    priority: 0.85,
    isIndexable: true,
  },
  '/about': {
    slug: '/about',
    title: 'About Us – Private, Fast & Secure Image Utilities | imagetooltip',
    description: 'Discover the mission behind imagetooltip: providing free, accessible, and completely private image manipulation tools that never upload personal photos to cloud servers.',
    keywords: ['about imagetooltip', 'free image converter', 'private photo utility', 'free converter tool'],
    h1: 'About imagetooltip',
    canonical: `${SITE_URL}/about`,
    changefreq: 'monthly',
    priority: 0.5,
    isIndexable: true,
  },
  '/faq': {
    slug: '/faq',
    title: 'Frequently Asked Questions – Privacy, Formats & Usage | imagetooltip',
    description: 'Answers to common questions about imagetooltip image converter, compressor, target mode, browser compatibility, and privacy policies.',
    keywords: ['image converter faq', 'is imagetooltip safe', 'how to compress image', 'client side conversion questions'],
    h1: 'Frequently Asked Questions',
    canonical: `${SITE_URL}/faq`,
    changefreq: 'monthly',
    priority: 0.6,
    isIndexable: true,
  },
  '/contact': {
    slug: '/contact',
    title: 'Contact Us & Customer Support | imagetooltip',
    description: 'Have feedback, questions, or feature requests? Contact the imagetooltip team directly through our inquiry form.',
    keywords: ['contact imagetooltip', 'customer support', 'inquiry form', 'feature request'],
    h1: 'Contact Us & Support',
    canonical: `${SITE_URL}/contact`,
    changefreq: 'monthly',
    priority: 0.5,
    isIndexable: true,
  },
  '/privacy': {
    slug: '/privacy',
    title: 'Privacy Policy – Zero Server Upload Guarantee | imagetooltip',
    description: 'Our privacy commitment: zero image files are ever uploaded, saved, or monitored on any server. 100% client-side local browser execution.',
    keywords: ['privacy policy', 'zero upload guarantee', 'client side privacy', 'gdpr compliant image converter'],
    h1: 'Privacy Policy',
    canonical: `${SITE_URL}/privacy`,
    changefreq: 'yearly',
    priority: 0.3,
    isIndexable: true,
  },
};

/**
 * Returns metadata for a given path with intelligent fallback.
 */
export function getPageMetadata(path: string): PageMetadata {
  const normalized = path.toLowerCase().replace(/\/$/, '') || '/';
  
  // Direct match
  if (SEO_ROUTES[normalized]) {
    return SEO_ROUTES[normalized];
  }

  // Aliases
  if (normalized === '/compressor') return SEO_ROUTES['/image-compressor'];
  if (normalized === '/resizer') return SEO_ROUTES['/resize-image'];
  if (normalized === '/image-converter') return SEO_ROUTES['/converter'];

  // Default fallback
  return {
    slug: normalized,
    title: `${SITE_NAME} – Image Converter & Compressor`,
    description: SEO_ROUTES['/'].description,
    keywords: SEO_ROUTES['/'].keywords,
    h1: SITE_NAME,
    canonical: `${SITE_URL}${normalized}`,
    changefreq: 'monthly',
    priority: 0.5,
    isIndexable: true,
  };
}
