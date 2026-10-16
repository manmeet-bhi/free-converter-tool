/**
 * Pure TypeScript ICO encoder.
 * Packages PNG compressed image data into the standard Microsoft ICO format container.
 * Supports single or multi-resolution icons (e.g., 16x16, 32x32, 48x48, 64x64, 128x128, 256x256).
 */

export interface IcoImageEntry {
  width: number;
  height: number;
  pngBlob: Blob;
}

export async function encodeIco(entries: IcoImageEntry[]): Promise<Blob> {
  if (entries.length === 0) {
    throw new Error('At least one image entry is required for ICO encoding.');
  }

  // Convert each PNG blob to Uint8Array
  const processedEntries: {
    width: number;
    height: number;
    data: Uint8Array;
  }[] = [];

  for (const entry of entries) {
    const arrayBuffer = await entry.pngBlob.arrayBuffer();
    processedEntries.push({
      width: Math.min(256, Math.max(1, entry.width)),
      height: Math.min(256, Math.max(1, entry.height)),
      data: new Uint8Array(arrayBuffer),
    });
  }

  const numImages = processedEntries.length;
  const headerSize = 6;
  const directoryEntrySize = 16;
  const totalDirectorySize = headerSize + numImages * directoryEntrySize;

  let totalDataSize = 0;
  for (const entry of processedEntries) {
    totalDataSize += entry.data.byteLength;
  }

  const totalFileSize = totalDirectorySize + totalDataSize;
  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);
  const fullBytes = new Uint8Array(buffer);

  // --- ICONDIR Header (6 bytes) ---
  view.setUint16(0, 0, true); // Reserved. Must always be 0.
  view.setUint16(2, 1, true); // Image type: 1 for icon (.ICO)
  view.setUint16(4, numImages, true); // Number of images

  // --- ICONDIRENTRY (16 bytes per image) ---
  let currentImageOffset = totalDirectorySize;
  let dirOffset = headerSize;

  for (let i = 0; i < numImages; i++) {
    const entry = processedEntries[i];
    const imgWidth = entry.width >= 256 ? 0 : entry.width;
    const imgHeight = entry.height >= 256 ? 0 : entry.height;
    const imageSize = entry.data.byteLength;

    view.setUint8(dirOffset + 0, imgWidth); // Width in pixels
    view.setUint8(dirOffset + 1, imgHeight); // Height in pixels
    view.setUint8(dirOffset + 2, 0); // Number of colors in color palette (0 if >= 8bpp)
    view.setUint8(dirOffset + 3, 0); // Reserved. Should be 0.
    view.setUint16(dirOffset + 4, 1, true); // Color planes: 1
    view.setUint16(dirOffset + 6, 32, true); // Bits per pixel: 32 (RGBA)
    view.setUint32(dirOffset + 8, imageSize, true); // Size of image data in bytes
    view.setUint32(dirOffset + 12, currentImageOffset, true); // Offset of image data from beginning of file

    // Write image data
    fullBytes.set(entry.data, currentImageOffset);
    currentImageOffset += imageSize;
    dirOffset += directoryEntrySize;
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}
