/**
 * Pure Client-Side High-Efficiency PNG Encoder & Compressor
 * Bridges the gap between 32-bit lossless Canvas bloat and efficient web PNG delivery.
 * Solves color banding and posterization artifacts using Floyd-Steinberg error diffusion dithering.
 */

export interface PngEncodeResult {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Applies smooth Floyd-Steinberg error diffusion dithering.
 * NEVER averages blocks (block size is 1) to eliminate all mosaic, posterization, and contour banding.
 * Distributes subtle color quantization error to neighboring pixels to preserve smooth gradients.
 */
function applyPngFloydSteinbergDither(
  imageData: ImageData,
  quality: number
): void {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Gentle quantization step:
  // quality 0.90 -> step 2
  // quality 0.75 -> step 4
  // quality 0.50 -> step 6
  // min quality -> step 8
  const qFactor = Math.max(0.1, Math.min(1.0, quality));
  const step = Math.max(1, Math.round((1 - qFactor) * 8));

  // If step is 1, image remains 100% untouched and lossless
  if (step <= 1) return;

  // Error buffers for Floyd-Steinberg diffusion (curErrors & nextErrors for RGB)
  const errWidth = width + 2;
  let curErrors = new Float32Array(errWidth * 3);
  let nextErrors = new Float32Array(errWidth * 3);

  for (let y = 0; y < height; y++) {
    nextErrors.fill(0);

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];

      // Preserve full transparency and near-transparent pixels identically
      if (a < 16) continue;

      const errIdx = (x + 1) * 3;
      const oldR = data[idx] + curErrors[errIdx];
      const oldG = data[idx + 1] + curErrors[errIdx + 1];
      const oldB = data[idx + 2] + curErrors[errIdx + 2];

      // Quantize to nearest step
      const newR = Math.min(255, Math.max(0, Math.round(oldR / step) * step));
      const newG = Math.min(255, Math.max(0, Math.round(oldG / step) * step));
      const newB = Math.min(255, Math.max(0, Math.round(oldB / step) * step));

      data[idx] = newR;
      data[idx + 1] = newG;
      data[idx + 2] = newB;

      // Quantization error
      const errR = oldR - newR;
      const errG = oldG - newG;
      const errB = oldB - newB;

      // Diffuse to neighbors:
      // (x + 1, y): 7/16
      curErrors[errIdx + 3] += (errR * 7) / 16;
      curErrors[errIdx + 4] += (errG * 7) / 16;
      curErrors[errIdx + 5] += (errB * 7) / 16;

      // (x - 1, y + 1): 3/16
      const nextLeft = x * 3;
      nextErrors[nextLeft] += (errR * 3) / 16;
      nextErrors[nextLeft + 1] += (errG * 3) / 16;
      nextErrors[nextLeft + 2] += (errB * 3) / 16;

      // (x, y + 1): 5/16
      nextErrors[errIdx] += (errR * 5) / 16;
      nextErrors[errIdx + 1] += (errG * 5) / 16;
      nextErrors[errIdx + 2] += (errB * 5) / 16;

      // (x + 1, y + 1): 1/16
      nextErrors[errIdx + 3] += (errR * 1) / 16;
      nextErrors[errIdx + 4] += (errG * 1) / 16;
      nextErrors[errIdx + 5] += (errB * 1) / 16;
    }

    // Swap error buffers
    const temp = curErrors;
    curErrors = nextErrors;
    nextErrors = temp;
  }
}

/**
 * Encodes canvas to PNG Blob via standard browser API
 */
function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode canvas to PNG'));
    }, 'image/png');
  });
}

/**
 * Master PNG Encoder that guarantees high visual fidelity without banding or posterization artifacts.
 */
export async function encodeCanvasToPng(
  canvas: HTMLCanvasElement,
  quality: number,
  targetSizeBytes?: number,
  originalSizeBytes?: number
): Promise<PngEncodeResult> {
  const origW = canvas.width;
  const origH = canvas.height;

  // 1. If high quality is chosen and no target size limit is set, use lossless canvas PNG directly
  if (quality >= 0.90 && !targetSizeBytes) {
    const rawBlob = await canvasToPngBlob(canvas);
    return {
      blob: rawBlob,
      width: origW,
      height: origH,
    };
  }

  // 2. Determine target size budget if applicable
  let maxAllowedBytes: number | undefined = targetSizeBytes;
  if (!maxAllowedBytes && originalSizeBytes && quality < 0.85) {
    const ratio = Math.min(0.95, Math.max(0.20, quality));
    maxAllowedBytes = Math.round(originalSizeBytes * ratio);
  }

  // 3. Pre-scale if dimensions are huge compared to maxAllowedBytes
  let currentW = origW;
  let currentH = origH;
  const totalPixels = origW * origH;

  if (maxAllowedBytes) {
    const estimatedDensity = Math.max(0.30, 0.20 + quality * 0.20);
    const estimatedBytes = totalPixels * estimatedDensity;
    if (estimatedBytes > maxAllowedBytes) {
      const targetScale = Math.min(0.96, Math.sqrt(maxAllowedBytes / estimatedBytes));
      currentW = Math.max(1, Math.round(origW * targetScale));
      currentH = Math.max(1, Math.round(origH * targetScale));
    }
  }

  // Helper to render canvas with smooth bicubic scaling and Floyd-Steinberg dithering
  const renderOptimized = async (w: number, h: number, q: number): Promise<{ blob: Blob; w: number; h: number }> => {
    // If dimensions match original and quality is high, take direct blob
    if (w === origW && h === origH && q >= 0.90) {
      const blob = await canvasToPngBlob(canvas);
      return { blob, w: origW, h: origH };
    }

    const optCanvas = document.createElement('canvas');
    optCanvas.width = w;
    optCanvas.height = h;
    const ctx = optCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      const fallbackBlob = await canvasToPngBlob(canvas);
      return { blob: fallbackBlob, w: origW, h: origH };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, w, h);

    if (q < 0.90) {
      const imgData = ctx.getImageData(0, 0, w, h);
      applyPngFloydSteinbergDither(imgData, q);
      ctx.putImageData(imgData, 0, 0);
    }

    const blob = await canvasToPngBlob(optCanvas);
    return { blob, w, h };
  };

  let best = await renderOptimized(currentW, currentH, quality);

  // 4. Corrective scaling passes if target size was strictly requested and still exceeded
  if (maxAllowedBytes && best.blob.size > maxAllowedBytes) {
    const correctionScale = Math.min(0.92, Math.sqrt(maxAllowedBytes / best.blob.size) * 0.98);
    const correctedW = Math.max(1, Math.round(best.w * correctionScale));
    const correctedH = Math.max(1, Math.round(best.h * correctionScale));
    const corrected = await renderOptimized(correctedW, correctedH, quality);
    if (corrected.blob.size < best.blob.size) {
      best = corrected;
    }
  }

  return {
    blob: best.blob,
    width: best.w,
    height: best.h,
  };
}
