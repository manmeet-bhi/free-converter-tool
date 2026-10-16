/**
 * Core Browser-Based Image Processing Engine
 * Powered by Canvas API, createImageBitmap, BMP Encoder, and ICO Encoder.
 * Supports WebP, PNG, JPEG, BMP, and ICO.
 */

import { encodeBmp } from './bmpEncoder';
import { encodeIco } from './icoEncoder';
import { 
  ImageFormat, 
  isWebpEncodingSupported, 
  sanitizeSvg 
} from './formatSupport';

export interface LoadedImageInfo {
  source: CanvasImageSource;
  width: number;
  height: number;
  hasTransparency: boolean;
  aspectRatio: number;
  cleanedSvgUrl?: string;
  originalFormat?: string;
}

export interface ProcessOptions {
  format: ImageFormat;
  quality: number; // 0.1 to 1.0
  width?: number;
  height?: number;
  backgroundColor?: string; // hex string, e.g. '#ffffff' for filling transparency in JPEG/BMP
  forceSolidBackground?: boolean; // whether to flatten transparency for formats that support alpha
  targetSizeBytes?: number; // target file size in bytes for binary search compression
  lossless?: boolean; // optional lossless mode for WebP
}

export interface ProcessResult {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  format: ImageFormat;
}

/**
 * Loads an image file into memory with transparency detection and safe SVG support.
 */
export async function loadImageFromFile(file: File): Promise<LoadedImageInfo> {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');

  if (isSvg) {
    const text = await file.text();
    const sanitized = sanitizeSvg(text);
    const svgBlob = new Blob([sanitized], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || 800;
        const height = img.naturalHeight || 800;
        const hasTransparency = true;
        resolve({
          source: img,
          width,
          height,
          hasTransparency,
          aspectRatio: width / height,
          cleanedSvgUrl: blobUrl,
          originalFormat: 'svg',
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        reject(new Error('Failed to render SVG image. Please check if the file syntax is valid.'));
      };
      img.src = blobUrl;
    });
  }

  // Attempt createImageBitmap for maximum decoding performance
  if (typeof createImageBitmap === 'function' && file.type !== 'image/x-icon') {
    try {
      const bitmap = await createImageBitmap(file);
      const { hasTransparency } = checkBitmapTransparency(bitmap);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        hasTransparency,
        aspectRatio: bitmap.width / bitmap.height,
        originalFormat: isWebp ? 'webp' : undefined,
      };
    } catch {
      // Fallback to Image element if createImageBitmap is not supported for this format
    }
  }

  // Standard Image element decode
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const { hasTransparency } = checkImageElementTransparency(img, width, height);
      resolve({
        source: img,
        width,
        height,
        hasTransparency,
        aspectRatio: width / height,
        cleanedSvgUrl: blobUrl,
        originalFormat: isWebp ? 'webp' : undefined,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);

      if (isWebp) {
        reject(
          new Error(
            `Failed to decode WebP image "${file.name}". The file may be corrupt or encoded with an unsupported profile.`
          )
        );
        return;
      }

      reject(new Error(`Failed to decode image file "${file.name}". Format may be unsupported or corrupted.`));
    };

    img.src = blobUrl;
  });
}

function checkBitmapTransparency(bitmap: ImageBitmap): { hasTransparency: boolean } {
  try {
    const testCanvas = document.createElement('canvas');
    const sampleW = Math.min(100, bitmap.width);
    const sampleH = Math.min(100, bitmap.height);
    testCanvas.width = sampleW;
    testCanvas.height = sampleH;
    const ctx = testCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { hasTransparency: false };

    ctx.drawImage(bitmap, 0, 0, sampleW, sampleH);
    const data = ctx.getImageData(0, 0, sampleW, sampleH).data;

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) {
        return { hasTransparency: true };
      }
    }
  } catch {
    // Default to false
  }
  return { hasTransparency: false };
}

function checkImageElementTransparency(img: HTMLImageElement, width: number, height: number): { hasTransparency: boolean } {
  try {
    const testCanvas = document.createElement('canvas');
    const sampleW = Math.min(100, width);
    const sampleH = Math.min(100, height);
    testCanvas.width = sampleW;
    testCanvas.height = sampleH;
    const ctx = testCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { hasTransparency: false };

    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const data = ctx.getImageData(0, 0, sampleW, sampleH).data;

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) {
        return { hasTransparency: true };
      }
    }
  } catch {
    // Default to false
  }
  return { hasTransparency: false };
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          if (mimeType !== 'image/png' && blob.type === 'image/png') {
            reject(new Error(`Browser does not support encoding to ${mimeType}. Returned fallback PNG.`));
            return;
          }
          resolve(blob);
        } else {
          reject(new Error(`Failed to encode canvas to ${mimeType}`));
        }
      },
      mimeType,
      quality
    );
  });
}

export async function processImage(
  imageInfo: LoadedImageInfo,
  options: ProcessOptions
): Promise<ProcessResult> {
  const targetWidth = Math.max(1, Math.round(options.width || imageInfo.width));
  const targetHeight = Math.max(1, Math.round(options.height || imageInfo.height));
  const quality = Math.min(1, Math.max(0.1, options.quality));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  const requiresSolidBackground = options.format === 'jpeg' || options.format === 'bmp';
  if (requiresSolidBackground || (options.forceSolidBackground && options.backgroundColor)) {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageInfo.source, 0, 0, targetWidth, targetHeight);

  let blob: Blob;

  switch (options.format) {
    case 'webp': {
      if (!isWebpEncodingSupported()) {
        throw new Error(
          'WebP output encoding is not supported in this browser version. Please update your browser or use JPEG/PNG.'
        );
      }
      blob = await canvasToBlob(canvas, 'image/webp', quality);
      break;
    }

    case 'jpeg': {
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      break;
    }

    case 'png': {
      blob = await canvasToBlob(canvas, 'image/png');
      break;
    }

    case 'bmp': {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      blob = encodeBmp(imageData);
      break;
    }

    case 'ico': {
      const iconBlob = await canvasToBlob(canvas, 'image/png');
      blob = await encodeIco([
        {
          width: targetWidth,
          height: targetHeight,
          pngBlob: iconBlob,
        },
      ]);
      break;
    }

    default: {
      blob = await canvasToBlob(canvas, 'image/png');
      break;
    }
  }

  if (options.targetSizeBytes && (options.format === 'jpeg' || options.format === 'webp')) {
    blob = await optimizeForTargetSize(canvas, options.format, options.targetSizeBytes, blob);
  }

  const previewUrl = URL.createObjectURL(blob);

  return {
    blob,
    previewUrl,
    width: targetWidth,
    height: targetHeight,
    fileSizeBytes: blob.size,
    format: options.format,
  };
}

async function optimizeForTargetSize(
  canvas: HTMLCanvasElement,
  format: 'jpeg' | 'webp',
  targetSizeBytes: number,
  initialBlob: Blob
): Promise<Blob> {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/webp';

  if (initialBlob.size <= targetSizeBytes) {
    return initialBlob;
  }

  let minQ = 0.05;
  let maxQ = 0.98;
  let bestBlob = initialBlob;
  const iterations = 6;

  for (let i = 0; i < iterations; i++) {
    const midQ = (minQ + maxQ) / 2;
    try {
      const testBlob = await canvasToBlob(canvas, mimeType, midQ);
      if (testBlob.size <= targetSizeBytes) {
        bestBlob = testBlob;
        minQ = midQ;
      } else {
        maxQ = midQ;
        if (testBlob.size < bestBlob.size) {
          bestBlob = testBlob;
        }
      }
    } catch {
      break;
    }
  }

  return bestBlob;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateSavings(originalBytes: number, compressedBytes: number): {
  bytesSaved: number;
  percent: number;
  isSmaller: boolean;
} {
  const bytesSaved = originalBytes - compressedBytes;
  const isSmaller = bytesSaved > 0;
  const percent = originalBytes > 0 ? Math.abs((bytesSaved / originalBytes) * 100) : 0;
  return {
    bytesSaved,
    percent: parseFloat(percent.toFixed(1)),
    isSmaller,
  };
}

export function revokeUrl(url?: string): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }
}
