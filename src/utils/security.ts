/**
 * Security & File Integrity Utilities
 * Enforces pure client-side security:
 * - Magic byte / file header signature verification (MIME spoofing defense)
 * - Strict SVG XSS sanitization (scripts, event handlers, foreignObject, javascript: URIs)
 * - Safe filename sanitization (Zip Slip / path traversal defense)
 * - Decompression bomb & Canvas memory limit validation
 */

// Max single image file size: 50 MB (prevents browser memory crash)
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

// Max image dimension: 16,384 x 16,384 px (GPU/Browser canvas limit)
export const MAX_CANVAS_DIMENSION = 16384;

// Max total pixels: ~64 million pixels (~256 MB raw uncompressed RGBA)
export const MAX_TOTAL_PIXELS = 64 * 1024 * 1024;

export interface FileSecurityValidation {
  safe: boolean;
  detectedFormat?: string;
  error?: string;
}

/**
 * Validates the file using binary header magic bytes to prevent MIME spoofing,
 * polyglot payloads, and malicious executable uploads disguised as images.
 */
export async function validateImageFileSecurity(file: File): Promise<FileSecurityValidation> {
  // 1. Check file size limits
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      safe: false,
      error: `File size exceeds the safe limit of 50 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  if (file.size < 4) {
    return {
      safe: false,
      error: 'File is too small or empty to be a valid image.',
    };
  }

  // 2. Read first 32 bytes for binary signature verification
  const headerSlice = file.slice(0, 32);
  const buffer = await headerSlice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { safe: true, detectedFormat: 'jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { safe: true, detectedFormat: 'png' };
  }

  // GIF: GIF87a (47 49 46 38 37 61) or GIF89a (47 49 46 38 39 61)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { safe: true, detectedFormat: 'gif' };
  }

  // WebP: RIFF .... WEBP
  // Bytes 0-3: "RIFF" (52 49 46 46), Bytes 8-11: "WEBP" (57 45 42 50)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { safe: true, detectedFormat: 'webp' };
  }

  // BMP: "BM" (42 4D)
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return { safe: true, detectedFormat: 'bmp' };
  }

  // ICO: 00 00 01 00
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
    return { safe: true, detectedFormat: 'ico' };
  }

  // AVIF: ISOBMFF box starting with 'ftyp' at offset 4 and major/compatible brand 'avif' or 'avis'
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && // 'f'
    bytes[5] === 0x74 && // 't'
    bytes[6] === 0x79 && // 'y'
    bytes[7] === 0x70    // 'p'
  ) {
    const majorBrand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (majorBrand === 'avif' || majorBrand === 'avis' || majorBrand === 'mif1' || majorBrand === 'miaf') {
      return { safe: true, detectedFormat: 'avif' };
    }
    const brandsString = String.fromCharCode(...bytes.slice(8, 32)).toLowerCase();
    if (brandsString.includes('avif') || brandsString.includes('avis')) {
      return { safe: true, detectedFormat: 'avif' };
    }
  }

  // Check for SVG (text-based vector)
  const isSvgExtension = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml';
  if (isSvgExtension) {
    try {
      const textSample = await file.slice(0, 1024).text();
      const trimmed = textSample.trim().toLowerCase();
      if (trimmed.includes('<svg') || (trimmed.startsWith('<?xml') && trimmed.includes('<svg'))) {
        return { safe: true, detectedFormat: 'svg' };
      }
    } catch {
      return { safe: false, error: 'Failed to inspect SVG text contents.' };
    }
  }

  return {
    safe: false,
    error: `Security verification failed: File signature (magic bytes) does not match any valid image standard (JPEG, PNG, WebP, AVIF, GIF, BMP, ICO, SVG). File may be corrupted, renamed, or untrusted.`,
  };
}

/**
 * Hardened SVG Sanitizer.
 * Strips executable scripts, foreignObjects, iframes, inline event handlers,
 * dangerous URI schemes, and XML entities to block XSS and XXE attacks.
 */
export function sanitizeSvgContent(rawSvg: string): string {
  // Check for potential XXE / billion laughs entity declarations
  if (/<!ENTITY/i.test(rawSvg) || /<!DOCTYPE[^>]*\[/i.test(rawSvg)) {
    throw new Error('Security Alert: XML entity expansion (XXE/Billion Laughs) detected and blocked.');
  }

  // Fallback for non-browser / Node.js environments where DOMParser is not natively defined
  if (typeof DOMParser === 'undefined') {
    return rawSvg
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/(?:href|xlink:href)\s*=\s*['"]\s*(?:javascript|data):[^'"]*['"]/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid SVG syntax or corrupt file.');
  }

  // List of forbidden element tags in an image vector
  const dangerousTags = [
    'script',
    'foreignobject',
    'iframe',
    'embed',
    'object',
    'applet',
    'meta',
    'link',
    'base',
    'audio',
    'video',
    'track',
    'form',
    'input',
    'button',
    'select',
  ];

  dangerousTags.forEach((tag) => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });

  // Strip dangerous attributes and protocols on all remaining elements
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const val = attr.value.toLowerCase().trim();

      // Block all event handlers (onclick, onload, onerror, etc.)
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }

      // Block javascript:, vbscript:, data:text/html, and file: URIs
      if (
        val.includes('javascript:') ||
        val.includes('vbscript:') ||
        val.includes('data:text/html') ||
        val.includes('data:application/') ||
        val.includes('file:')
      ) {
        el.removeAttribute(attr.name);
        continue;
      }

      // If style attribute contains javascript or expression, strip it
      if (name === 'style' && (val.includes('javascript:') || val.includes('expression(') || val.includes('behavior:'))) {
        el.removeAttribute(attr.name);
        continue;
      }

      // Prevent <use> from loading external resources
      if (el.tagName.toLowerCase() === 'use' && (name === 'href' || name === 'xlink:href')) {
        if (!attr.value.startsWith('#')) {
          el.removeAttribute(attr.name);
        }
      }
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

/**
 * Strips path traversal sequences, null bytes, and dangerous characters from filenames.
 * Protects against Zip Slip and directory traversal vulnerability when saving or exporting.
 */
export function sanitizeSafeFilename(rawName: string, fallback = 'image'): string {
  if (!rawName || typeof rawName !== 'string') return fallback;

  // 1. Remove null bytes and non-printable control characters
  let clean = rawName.replace(/[\0\x00-\x1f\x7f-\x9f]/g, '');

  // 2. Strip directory traversal tokens (../, ..\, /..\ etc)
  clean = clean.replace(/(\.\.[\/\\])+/g, '');
  clean = clean.replace(/[/\\]+/g, '_');

  // 3. Remove leading dots and spaces
  clean = clean.replace(/^[. ]+/, '').trim();

  // 4. Strip Windows/Unix filesystem reserved characters: < > : " / \ | ? *
  clean = clean.replace(/[<>:"/\\|?*]/g, '_');

  // 5. Enforce safe length limit (max 180 chars)
  if (clean.length > 180) {
    const lastDot = clean.lastIndexOf('.');
    if (lastDot > 0) {
      const ext = clean.slice(lastDot);
      clean = clean.slice(0, 180 - ext.length) + ext;
    } else {
      clean = clean.slice(0, 180);
    }
  }

  return clean || fallback;
}

/**
 * Validates that requested canvas dimensions do not exceed safe GPU texture limits
 * or cause memory exhaustion bombs.
 */
export function validateCanvasDimensions(width: number, height: number): void {
  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`Invalid dimensions (${width}x${height}). Width and height must be positive numbers.`);
  }

  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
    throw new Error(
      `Dimension limit exceeded: ${width}x${height} px exceeds the browser safe maximum of ${MAX_CANVAS_DIMENSION}x${MAX_CANVAS_DIMENSION} px.`
    );
  }

  const totalPixels = width * height;
  if (totalPixels > MAX_TOTAL_PIXELS) {
    throw new Error(
      `Total pixel allocation (${Math.round(totalPixels / 1_000_000)} megapixels) exceeds safe browser memory threshold (${Math.round(MAX_TOTAL_PIXELS / 1_000_000)} MP).`
    );
  }
}
