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
    : 'https://free-picture-converter.netlify.app'
).replace(/\/$/, '');

export const SITE_NAME = 'imagetooltip';
export const SITE_BRAND = 'imagetooltip – Free Online Image & Picture Converter';
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
    title: 'Free Online Picture & Image Converter, Compressor & Resizer | imagetooltip',
    description: 'Convert between JPG, PNG, WebP, BMP, and ICO with complete local privacy. Fast batch processing, target size compression, and custom resizing with zero server uploads.',
    keywords: [
      'free picture converter',
      'picture converter',
      'online picture converter',
      'photo converter',
      'convert pictures online',
      'image converter',
      'image compressor',
      'picture compressor',
      'picture resizer',
      'free online converter',
      'png to jpg',
      'jpg to png',
      'jpg to webp',
      'client-side image processing',
      'batch picture converter'
    ],
    h1: 'Fast, Private In-Browser Picture & Image Converter',
    canonical: `${SITE_URL}/`,
    changefreq: 'weekly',
    priority: 1.0,
    isIndexable: true,
  },
  '/converter': {
    slug: '/converter',
    title: 'Online Picture & Image Converter – Convert JPG, PNG, WebP, BMP, ICO | imagetooltip',
    description: 'Free batch picture and image converter running locally in your browser. Convert pictures between JPG, PNG, WebP, BMP, and ICO without file size limits or server storage.',
    keywords: [
      'online picture converter',
      'free picture converter',
      'picture format converter',
      'photo converter online',
      'batch picture conversion',
      'convert picture format',
      'png converter',
      'webp converter',
      'jpg converter',
      'image converter free'
    ],
    h1: 'Online Picture & Image Converter',
    canonical: `${SITE_URL}/converter`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/png-to-jpg': {
    slug: '/png-to-jpg',
    title: 'PNG to JPG Converter – Convert PNG to High-Quality JPG Online | imagetooltip',
    description: 'Convert transparent or opaque PNG images to optimized JPG format instantly in your browser. Choose background fill color, set quality from 1% to 100%, and batch download as ZIP.',
    keywords: [
      'png to jpg',
      'convert png to jpg',
      'picture to jpg',
      'convert picture to jpg',
      'png to jpeg online',
      'free png to jpg converter',
      'batch png to jpg',
      'transparent png to jpg',
      'photo to jpg converter'
    ],
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
    keywords: [
      'jpg to png',
      'convert jpg to png',
      'picture to png',
      'convert picture to png',
      'jpeg to png',
      'free jpg to png converter',
      'lossless png',
      'photo to png converter'
    ],
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
    keywords: [
      'png to webp',
      'convert png to webp',
      'convert picture to webp',
      'picture to webp',
      'png to webp with transparency',
      'webp conversion',
      'compress png to webp',
      'next gen picture format'
    ],
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
    keywords: [
      'webp to png',
      'convert webp to png',
      'webp picture to png',
      'extract webp',
      'webp transparent to png',
      'free webp to png converter',
      'convert webp photo'
    ],
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
    keywords: [
      'jpg to webp',
      'convert jpg to webp',
      'convert picture to webp',
      'jpeg to webp',
      'convert photo to webp',
      'web performance image converter',
      'next gen image format'
    ],
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
    keywords: [
      'webp to jpg',
      'convert webp to jpg',
      'webp picture to jpg',
      'convert webp to jpeg online',
      'universal picture format converter'
    ],
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
    keywords: [
      'png to ico',
      'favicon generator',
      'convert picture to ico',
      'convert png to ico',
      'ico favicon maker',
      'create ico online',
      'picture to icon'
    ],
    h1: 'PNG to ICO Favicon Generator',
    canonical: `${SITE_URL}/png-to-ico`,
    changefreq: 'weekly',
    priority: 0.85,
    isIndexable: true,
  },
  '/image-compressor': {
    slug: '/image-compressor',
    title: 'Online Image & Picture Compressor – Compress JPG, PNG & WebP to Exact Target Size | imagetooltip',
    description: 'Compress image and picture file sizes online without noticeable quality loss. Features Target Size mode (e.g. compress to 100KB, 50KB) and visual Before/After comparison slider.',
    keywords: [
      'picture compressor',
      'image compressor',
      'compress picture online',
      'compress photo size',
      'compress images online',
      'compress to 100kb',
      'target size picture compressor',
      'photo size reducer'
    ],
    h1: 'Online Picture & Image Compressor',
    canonical: `${SITE_URL}/image-compressor`,
    changefreq: 'weekly',
    priority: 0.9,
    isIndexable: true,
  },
  '/resize-image': {
    slug: '/resize-image',
    title: 'Online Image & Picture Resizer – Scale Pixels, Percentages & Social Presets | imagetooltip',
    description: 'Resize pictures and images by custom width and height, fixed percentage, or standard social media dimensions (Instagram, YouTube, Twitter). Maintain aspect ratio or smart crop.',
    keywords: [
      'picture resizer',
      'image resizer',
      'resize picture online',
      'resize photo pixels',
      'scale picture pixels',
      'social media picture resizer',
      'crop picture online'
    ],
    h1: 'Online Picture & Image Resizer',
    canonical: `${SITE_URL}/resize-image`,
    changefreq: 'weekly',
    priority: 0.85,
    isIndexable: true,
  },
  '/exif-remover': {
    slug: '/exif-remover',
    title: 'EXIF Metadata Remover – Strip Photo Location & Camera Details | imagetooltip',
    description: 'Remove hidden GPS location tags, camera serials, timestamps, and personal metadata from photos before sharing online. 100% private in-browser stripping.',
    keywords: [
      'exif remover',
      'remove photo metadata',
      'remove picture location data',
      'metadata cleaner',
      'photo privacy tool',
      'strip picture exif metadata'
    ],
    h1: 'Free Online EXIF Metadata Remover',
    canonical: `${SITE_URL}/exif-remover`,
    changefreq: 'weekly',
    priority: 0.85,
    isIndexable: true,
  },
  '/about': {
    slug: '/about',
    title: 'About Us – Private, Fast & Secure Picture Utilities | imagetooltip',
    description: 'Discover the mission behind imagetooltip: providing free, accessible, and completely private image manipulation tools that never upload personal photos to cloud servers.',
    keywords: [
      'about free picture converter',
      'about imagetooltip',
      'free picture converter',
      'private photo utility',
      'free converter tool'
    ],
    h1: 'About imagetooltip',
    canonical: `${SITE_URL}/about`,
    changefreq: 'monthly',
    priority: 0.5,
    isIndexable: true,
  },
  '/faq': {
    slug: '/faq',
    title: 'Frequently Asked Questions – Privacy, Formats & Usage | imagetooltip',
    description: 'Answers to common questions about imagetooltip picture converter, compressor, target mode, browser compatibility, and privacy policies.',
    keywords: [
      'picture converter faq',
      'is free picture converter safe',
      'how to compress picture',
      'online photo converter questions',
      'client side conversion questions'
    ],
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
    keywords: [
      'contact free picture converter',
      'contact imagetooltip',
      'customer support',
      'inquiry form',
      'feature request'
    ],
    h1: 'Contact Us & Support',
    canonical: `${SITE_URL}/contact`,
    changefreq: 'monthly',
    priority: 0.5,
    isIndexable: true,
  },
  '/privacy': {
    slug: '/privacy',
    title: 'Privacy Policy – Zero Server Upload Guarantee | imagetooltip',
    description: 'Our privacy commitment: zero picture or image files are ever uploaded, saved, or monitored on any server. 100% client-side local browser execution.',
    keywords: [
      'privacy policy',
      'zero upload guarantee',
      'client side privacy',
      'gdpr compliant picture converter',
      'private photo converter'
    ],
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
