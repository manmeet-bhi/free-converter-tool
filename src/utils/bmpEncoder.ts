/**
 * High-performance pure JavaScript/TypeScript BMP 24/32-bit encoder.
 * Works natively in any browser to create standard Windows Bitmap files (.bmp).
 */

export function encodeBmp(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // 24-bit BMP: 3 bytes per pixel (BGR)
  // Each row must be padded to a multiple of 4 bytes
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileHeaderSize = 14;
  const infoHeaderSize = 40;
  const fileSize = fileHeaderSize + infoHeaderSize + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // --- BITMAPFILEHEADER (14 bytes) ---
  // Type: "BM" (0x4D42)
  view.setUint16(0, 0x424d, false); // 'B', 'M'
  // File size
  view.setUint32(2, fileSize, true);
  // Reserved 1 & 2
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  // Pixel data offset
  view.setUint32(10, fileHeaderSize + infoHeaderSize, true);

  // --- BITMAPINFOHEADER (40 bytes) ---
  // Header size
  view.setUint32(14, infoHeaderSize, true);
  // Image width
  view.setInt32(18, width, true);
  // Image height (positive = bottom-to-top, negative = top-to-bottom)
  // Standard BMP is bottom-to-top
  view.setInt32(22, height, true);
  // Planes (always 1)
  view.setUint16(26, 1, true);
  // Bits per pixel: 24 (RGB)
  view.setUint16(28, 24, true);
  // Compression: BI_RGB (0 = uncompressed)
  view.setUint32(30, 0, true);
  // Image size (can be 0 for BI_RGB)
  view.setUint32(34, pixelArraySize, true);
  // X pixels per meter (2835 = ~72 DPI)
  view.setInt32(38, 2835, true);
  // Y pixels per meter
  view.setInt32(42, 2835, true);
  // Colors used
  view.setUint32(46, 0, true);
  // Important colors
  view.setUint32(50, 0, true);

  // --- PIXEL DATA ---
  const bytes = new Uint8Array(buffer);
  let offset = fileHeaderSize + infoHeaderSize;

  // BMP stores scanlines from bottom to top
  for (let y = height - 1; y >= 0; y--) {
    const rowStartOffset = offset;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      // BMP 24-bit is BGR order
      bytes[offset++] = b;
      bytes[offset++] = g;
      bytes[offset++] = r;
    }

    // Pad row to multiple of 4 bytes with 0s
    while ((offset - rowStartOffset) % 4 !== 0) {
      bytes[offset++] = 0;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}
