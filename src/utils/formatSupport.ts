/**
 * Image Format Support Detection & Sanitization Utilities
 * Pure client-side capabilities detection for WebP, PNG, JPEG, BMP, ICO.
 */

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'bmp' | 'ico';

export interface FormatInfo {
  id: ImageFormat;
  label: string;
  extensions: string[];
  mimeType: string;
  supportsTransparency: boolean;
  isLossy: boolean;
  canEncode: boolean;
  canDecode: boolean;
  description: string;
  notes?: string;
  unsupportedMessage?: string;
}

export interface InputFormatInfo {
  id: string;
  label: string;
  extensions: string[];
  mimeTypes: string[];
  supported: boolean;
  notes?: string;
}

let cachedWebpDecoding: boolean | null = null;
let cachedWebpEncoding: boolean | null = null;

export function checkBrowserMimeEncoding(mimeType: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL(mimeType);
    return dataUrl.startsWith(`data:${mimeType}`);
  } catch {
    return false;
  }
}

export function isWebpEncodingSupported(): boolean {
  if (cachedWebpEncoding === null) {
    cachedWebpEncoding = checkBrowserMimeEncoding('image/webp');
  }
  return cachedWebpEncoding;
}

export async function checkWebpDecodingSupport(): Promise<boolean> {
  if (cachedWebpDecoding !== null) return cachedWebpDecoding;
  if (typeof Image === 'undefined') return false;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    img.onload = () => {
      cachedWebpDecoding = img.width === 1 && img.height === 1;
      resolve(cachedWebpDecoding);
    };
    img.onerror = () => {
      cachedWebpDecoding = false;
      resolve(false);
    };
  });
}

export function getAvailableOutputFormats(): FormatInfo[] {
  const supportsWebpEnc = isWebpEncodingSupported();

  return [
    {
      id: 'webp',
      label: 'WebP',
      extensions: ['.webp'],
      mimeType: 'image/webp',
      supportsTransparency: true,
      isLossy: true,
      canEncode: supportsWebpEnc,
      canDecode: true,
      description: 'Modern web image standard. 25-35% smaller than JPEG with full alpha transparency.',
      notes: 'Fully accelerated in modern browsers.',
    },
    {
      id: 'jpeg',
      label: 'JPG / JPEG',
      extensions: ['.jpg', '.jpeg'],
      mimeType: 'image/jpeg',
      supportsTransparency: false,
      isLossy: true,
      canEncode: true,
      canDecode: true,
      description: 'Universal photographic format. High compatibility, but does not support transparency.',
      notes: 'Transparent areas will be filled with a solid background color.',
    },
    {
      id: 'png',
      label: 'PNG',
      extensions: ['.png'],
      mimeType: 'image/png',
      supportsTransparency: true,
      isLossy: false,
      canEncode: true,
      canDecode: true,
      description: 'Standard lossless raster format with full 8-bit alpha transparency support.',
      notes: 'Ideal for screenshots, digital art, icons, and diagrams where crisp edges are vital.',
    },
    {
      id: 'bmp',
      label: 'BMP (Bitmap)',
      extensions: ['.bmp'],
      mimeType: 'image/bmp',
      supportsTransparency: false,
      isLossy: false,
      canEncode: true,
      canDecode: true,
      description: 'Uncompressed Windows Bitmap image.',
      notes: 'Built-in client-side 24-bit RGB BMP encoder active.',
    },
    {
      id: 'ico',
      label: 'ICO (Favicon)',
      extensions: ['.ico'],
      mimeType: 'image/x-icon',
      supportsTransparency: true,
      isLossy: false,
      canEncode: true,
      canDecode: true,
      description: 'Multi-resolution Windows Icon & website favicon container.',
      notes: 'Built-in client-side 32-bit transparent ICO generator active.',
    },
  ];
}

export const INPUT_FORMATS: InputFormatInfo[] = [
  { id: 'webp', label: 'WebP', extensions: ['.webp'], mimeTypes: ['image/webp'], supported: true, notes: 'Full alpha transparency and lossy/lossless decode.' },
  { id: 'jpeg', label: 'JPG / JPEG', extensions: ['.jpg', '.jpeg'], mimeTypes: ['image/jpeg'], supported: true },
  { id: 'png', label: 'PNG', extensions: ['.png'], mimeTypes: ['image/png'], supported: true, notes: 'Full 8-bit alpha channel supported.' },
  { id: 'gif', label: 'GIF', extensions: ['.gif'], mimeTypes: ['image/gif'], supported: true, notes: 'Static frame decoded via Canvas.' },
  { id: 'bmp', label: 'BMP', extensions: ['.bmp'], mimeTypes: ['image/bmp', 'image/x-ms-bmp'], supported: true },
  { id: 'svg', label: 'SVG', extensions: ['.svg'], mimeTypes: ['image/svg+xml'], supported: true, notes: 'Sanitized safely to prevent script execution.' },
  { id: 'ico', label: 'ICO', extensions: ['.ico'], mimeTypes: ['image/x-icon', 'image/vnd.microsoft.icon'], supported: true },
];

export function sanitizeSvg(svgText: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid SVG syntax or corrupt file.');
  }

  const scripts = doc.querySelectorAll('script');
  scripts.forEach((el) => el.remove());

  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const val = attr.value.toLowerCase();
      if (name.startsWith('on') || val.includes('javascript:') || val.includes('data:text/html')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

export function detectInputFormat(file: File): string {
  const mime = file.type.toLowerCase();
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  for (const fmt of INPUT_FORMATS) {
    if (fmt.mimeTypes.includes(mime) || fmt.extensions.includes(ext)) {
      return fmt.id;
    }
  }

  if (ext === '.webp') return 'webp';
  if (ext === '.jpg' || ext === '.jpeg') return 'jpeg';
  if (ext === '.png') return 'png';
  if (ext === '.gif') return 'gif';
  if (ext === '.bmp') return 'bmp';
  if (ext === '.svg') return 'svg';
  if (ext === '.ico') return 'ico';

  return 'unknown';
}
