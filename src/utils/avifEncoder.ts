/**
 * AVIF Encoder Engine
 * Provides dual-mode AVIF encoding:
 * 1. Hardware-accelerated native browser canvas export when available.
 * 2. WebAssembly libavif (@jsquash/avif) fallback for 100% universal browser compatibility (Firefox, Safari, Chromium).
 */

import { checkBrowserMimeEncoding } from './formatSupport';

type JsquashEncodeFn = (
  data: ImageData,
  options?: {
    quality?: number;
    speed?: number;
    lossless?: boolean;
    bitDepth?: 8 | 10 | 12;
    qualityAlpha?: number;
  }
) => Promise<ArrayBuffer>;

let jsquashEncodePromise: Promise<JsquashEncodeFn> | null = null;

async function getJsquashEncode(): Promise<JsquashEncodeFn> {
  if (!jsquashEncodePromise) {
    jsquashEncodePromise = (async () => {
      // Dynamic import to keep initial bundle size lean
      const mod = await import('@jsquash/avif');
      const fn = mod.encode as JsquashEncodeFn;
      if (typeof fn !== 'function') {
        throw new Error('Failed to load @jsquash/avif WebAssembly encoder function.');
      }
      return fn;
    })();
  }
  return jsquashEncodePromise;
}

/**
 * Encodes an HTML Canvas element into an authentic AVIF image Blob.
 */
export async function encodeCanvasToAvif(
  canvas: HTMLCanvasElement,
  quality: number = 0.8
): Promise<Blob> {
  // Mode 1: Check if browser supports native canvas.toBlob('image/avif')
  if (checkBrowserMimeEncoding('image/avif')) {
    try {
      const nativeBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/avif', quality);
      });
      if (nativeBlob && nativeBlob.type === 'image/avif') {
        return nativeBlob;
      }
    } catch {
      // Fallback to WebAssembly mode below
    }
  }

  // Mode 2: Client-side WebAssembly libavif encoder (universal across all browsers)
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available for AVIF encoding.');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const encode = await getJsquashEncode();

  // @jsquash/avif accepts quality 0..100
  const avifQuality = Math.min(100, Math.max(1, Math.round(quality * 100)));

  const arrayBuffer = await encode(imageData, {
    quality: avifQuality,
    speed: 6, // balanced speed / compression ratio
  });

  return new Blob([arrayBuffer], { type: 'image/avif' });
}
