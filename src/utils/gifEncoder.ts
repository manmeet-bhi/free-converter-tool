/**
 * Pure TypeScript Single-Frame GIF89a Encoder
 * Encodes Canvas ImageData into standard GIF89a format with transparency support.
 * Works natively in all browsers without external dependencies.
 */

export function encodeGif(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const totalPixels = width * height;

  // 1. Analyze transparency & sample colors
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 128) {
      hasAlpha = true;
      break;
    }
  }

  // 2. Build color palette (up to 256 colors)
  // Check unique colors first for exact fidelity
  const colorMap = new Map<number, number>(); // rgbaKey -> paletteIndex
  const palette: [number, number, number][] = [];
  let transparentIndex = -1;

  if (hasAlpha) {
    transparentIndex = 0;
    palette.push([0, 0, 0]); // Transparent color dummy
  }

  // Sample unique colors (sampling if large to maintain speed)
  const step = totalPixels > 100000 ? Math.ceil(totalPixels / 50000) : 1;
  for (let i = 0; i < data.length; i += 4 * step) {
    const a = data[i + 3];
    if (a < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = (r << 16) | (g << 8) | b;

    if (!colorMap.has(key)) {
      if (palette.length < 256) {
        const idx = palette.length;
        colorMap.set(key, idx);
        palette.push([r, g, b]);
      } else {
        break; // Exceeded 256 unique colors, fallback to color quantization
      }
    }
  }

  const isExactPalette = colorMap.size + (hasAlpha ? 1 : 0) <= 256;

  // Fallback palette (6x7x6 color cube = 252 colors + gray ramp) if unique colors > 256
  if (!isExactPalette) {
    palette.length = 0;
    colorMap.clear();

    if (hasAlpha) {
      transparentIndex = 0;
      palette.push([0, 0, 0]);
    }

    // Standard 6x7x6 uniform color cube
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 7; g++) {
        for (let b = 0; b < 6; b++) {
          if (palette.length < 256) {
            palette.push([
              Math.round((r * 255) / 5),
              Math.round((g * 255) / 6),
              Math.round((b * 255) / 5),
            ]);
          }
        }
      }
    }

    // Fill remaining up to 256 with grayscale
    while (palette.length < 256) {
      const v = Math.round(((palette.length - 252) * 255) / 4);
      palette.push([v, v, v]);
    }
  } else {
    // Pad palette to power of 2 (256 entries)
    while (palette.length < 256) {
      palette.push([0, 0, 0]);
    }
  }

  // 3. Map pixels to palette indices
  const indexedPixels = new Uint8Array(totalPixels);

  if (isExactPalette) {
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      if (hasAlpha && data[i + 3] < 128) {
        indexedPixels[p] = transparentIndex;
      } else {
        const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
        let idx = colorMap.get(key);
        if (idx === undefined) {
          idx = findClosestColor(data[i], data[i + 1], data[i + 2], palette, transparentIndex);
        }
        indexedPixels[p] = idx;
      }
    }
  } else {
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      if (hasAlpha && data[i + 3] < 128) {
        indexedPixels[p] = transparentIndex;
      } else {
        indexedPixels[p] = findClosestColor(data[i], data[i + 1], data[i + 2], palette, transparentIndex);
      }
    }
  }

  // 4. Encode GIF binary structure
  const out: number[] = [];

  // Header: "GIF89a"
  out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);

  // Logical Screen Descriptor
  // Width (2 bytes), Height (2 bytes)
  out.push(width & 0xff, (width >> 8) & 0xff);
  out.push(height & 0xff, (height >> 8) & 0xff);
  // Packed: Global Color Table Flag = 1, Color Res = 7 (8 bits), Sort = 0, Size = 7 (256 colors)
  out.push(0xf7);
  // Background color index
  out.push(hasAlpha ? transparentIndex : 0);
  // Pixel aspect ratio
  out.push(0);

  // Global Color Table (256 * 3 = 768 bytes)
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = palette[i] || [0, 0, 0];
    out.push(r, g, b);
  }

  // Graphic Control Extension (if transparency is used)
  if (hasAlpha) {
    out.push(0x21, 0xf9, 0x04);
    // Packed byte: reserved(3)|disposal(3)=1|user input(1)=0|transparent(1)=1 -> 0x05
    out.push(0x05);
    out.push(0x00, 0x00); // Delay time
    out.push(transparentIndex); // Transparent color index
    out.push(0x00); // Block terminator
  }

  // Image Descriptor
  out.push(0x2c); // Separator
  out.push(0x00, 0x00); // Left
  out.push(0x00, 0x00); // Top
  out.push(width & 0xff, (width >> 8) & 0xff);
  out.push(height & 0xff, (height >> 8) & 0xff);
  out.push(0x00); // Packed: no local table, not interlaced

  // LZW Image Data
  const lzwData = lzwEncode(indexedPixels, 8);
  for (let i = 0; i < lzwData.length; i++) {
    out.push(lzwData[i]);
  }

  // Trailer
  out.push(0x3b);

  return new Blob([new Uint8Array(out)], { type: 'image/gif' });
}

function findClosestColor(
  r: number,
  g: number,
  b: number,
  palette: [number, number, number][],
  transparentIndex: number
): number {
  let minDiff = Infinity;
  let bestIdx = 0;
  const startIndex = transparentIndex === 0 ? 1 : 0;

  for (let i = startIndex; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    // Perceptual color distance
    const diff = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = i;
      if (diff === 0) break;
    }
  }

  return bestIdx;
}

/**
 * Standard GIF LZW compressor
 */
function lzwEncode(pixels: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize; // 256
  const endCode = clearCode + 1; // 257

  let codeSize = minCodeSize + 1; // 9 bits
  let nextCode = endCode + 1; // 258

  // Output bit stream
  const out: number[] = [minCodeSize]; // First byte is minCodeSize
  let curBits = 0;
  let curAccum = 0;

  const subBlock: number[] = [];

  function flushSubBlock() {
    if (subBlock.length > 0) {
      out.push(subBlock.length);
      for (let i = 0; i < subBlock.length; i++) {
        out.push(subBlock[i]);
      }
      subBlock.length = 0;
    }
  }

  function emitCode(code: number) {
    curAccum |= code << curBits;
    curBits += codeSize;

    while (curBits >= 8) {
      subBlock.push(curAccum & 0xff);
      curAccum >>= 8;
      curBits -= 8;

      if (subBlock.length === 254) {
        flushSubBlock();
      }
    }
  }

  // Dictionary: key = (prefix << 8) | nextByte
  const dict = new Map<number, number>();

  function resetDict() {
    dict.clear();
    codeSize = minCodeSize + 1;
    nextCode = endCode + 1;
  }

  emitCode(clearCode);

  if (pixels.length > 0) {
    let prefix = pixels[0];

    for (let i = 1; i < pixels.length; i++) {
      const k = pixels[i];
      const key = (prefix << 8) | k;

      if (dict.has(key)) {
        prefix = dict.get(key)!;
      } else {
        emitCode(prefix);

        if (nextCode < 4096) {
          dict.set(key, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          emitCode(clearCode);
          resetDict();
        }

        prefix = k;
      }
    }

    emitCode(prefix);
  }

  emitCode(endCode);

  // Flush remaining bits
  if (curBits > 0) {
    subBlock.push(curAccum & 0xff);
  }
  flushSubBlock();

  // Terminating block size 0
  out.push(0x00);

  return new Uint8Array(out);
}
