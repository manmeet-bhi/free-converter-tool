/**
 * Browser-based EXIF Remover Utility
 * - Reads EXIF metadata from JPEG/TIFF files via binary segment parsing
 * - Strips all metadata by re-encoding through Canvas API
 * - 100% client-side, zero server uploads
 */

export interface ExifTag {
  tag: string;
  label: string;
  value: string;
  category: 'camera' | 'location' | 'datetime' | 'settings' | 'software' | 'other';
}

export interface ExifData {
  tags: ExifTag[];
  hasGps: boolean;
  hasCamera: boolean;
  hasSoftware: boolean;
  rawSize: number;
}

export interface ExifRemovalResult {
  blob: Blob;
  previewUrl: string;
  originalSizeBytes: number;
  cleanedSizeBytes: number;
  format: string;
}

// EXIF tag ID → human-readable label + category
const EXIF_TAG_MAP: Record<number, { label: string; category: ExifTag['category'] }> = {
  0x010e: { label: 'Image Description', category: 'other' },
  0x010f: { label: 'Camera Make', category: 'camera' },
  0x0110: { label: 'Camera Model', category: 'camera' },
  0x0112: { label: 'Orientation', category: 'settings' },
  0x011a: { label: 'X Resolution', category: 'settings' },
  0x011b: { label: 'Y Resolution', category: 'settings' },
  0x0128: { label: 'Resolution Unit', category: 'settings' },
  0x013b: { label: 'Artist', category: 'other' },
  0x0131: { label: 'Software', category: 'software' },
  0x0132: { label: 'Date/Time Modified', category: 'datetime' },
  0x013c: { label: 'Host Computer', category: 'software' },
  0x8298: { label: 'Copyright', category: 'other' },
  0x829a: { label: 'Exposure Time', category: 'settings' },
  0x829d: { label: 'F-Number', category: 'settings' },
  0x8822: { label: 'Exposure Program', category: 'settings' },
  0x8827: { label: 'ISO Speed', category: 'settings' },
  0x9000: { label: 'EXIF Version', category: 'camera' },
  0x9003: { label: 'Date/Time Original', category: 'datetime' },
  0x9004: { label: 'Date/Time Digitized', category: 'datetime' },
  0x9201: { label: 'Shutter Speed', category: 'settings' },
  0x9202: { label: 'Aperture', category: 'settings' },
  0x9204: { label: 'Exposure Bias', category: 'settings' },
  0x9207: { label: 'Metering Mode', category: 'settings' },
  0x9208: { label: 'Light Source', category: 'settings' },
  0x9209: { label: 'Flash', category: 'settings' },
  0x920a: { label: 'Focal Length', category: 'settings' },
  0xa001: { label: 'Color Space', category: 'settings' },
  0xa002: { label: 'Pixel X Dimension', category: 'settings' },
  0xa003: { label: 'Pixel Y Dimension', category: 'settings' },
  0xa217: { label: 'Sensing Method', category: 'camera' },
  0xa401: { label: 'Custom Rendered', category: 'settings' },
  0xa402: { label: 'Exposure Mode', category: 'settings' },
  0xa403: { label: 'White Balance', category: 'settings' },
  0xa404: { label: 'Digital Zoom Ratio', category: 'settings' },
  0xa405: { label: 'Focal Length (35mm)', category: 'settings' },
  0xa406: { label: 'Scene Capture Type', category: 'settings' },
  0xa408: { label: 'Contrast', category: 'settings' },
  0xa409: { label: 'Saturation', category: 'settings' },
  0xa40a: { label: 'Sharpness', category: 'settings' },
  0xa430: { label: 'Camera Owner', category: 'other' },
  0xa431: { label: 'Body Serial Number', category: 'camera' },
  0xa432: { label: 'Lens Spec', category: 'camera' },
  0xa433: { label: 'Lens Make', category: 'camera' },
  0xa434: { label: 'Lens Model', category: 'camera' },
  0x8825: { label: 'GPS Info', category: 'location' },
  0x0001: { label: 'GPS Latitude Ref', category: 'location' },
  0x0002: { label: 'GPS Latitude', category: 'location' },
  0x0003: { label: 'GPS Longitude Ref', category: 'location' },
  0x0004: { label: 'GPS Longitude', category: 'location' },
  0x0005: { label: 'GPS Altitude Ref', category: 'location' },
  0x0006: { label: 'GPS Altitude', category: 'location' },
  0x0007: { label: 'GPS Timestamp', category: 'location' },
  0x001d: { label: 'GPS Datestamp', category: 'location' },
};

function readUint16(view: DataView, offset: number, le: boolean): number {
  return view.getUint16(offset, le);
}

function readUint32(view: DataView, offset: number, le: boolean): number {
  return view.getUint32(offset, le);
}

function readString(view: DataView, offset: number, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const byte = view.getUint8(offset + i);
    if (byte === 0) break;
    result += String.fromCharCode(byte);
  }
  return result.trim();
}

function readTagValue(
  view: DataView,
  type: number,
  count: number,
  valueOrOffset: number,
  entryBase: number,
  le: boolean
): string {
  try {
    if (type === 2) {
      // ASCII
      const isInline = count <= 4;
      const offset = isInline ? entryBase : valueOrOffset;
      return readString(view, offset, count);
    }
    if (type === 3) {
      // SHORT
      const isInline = count <= 2;
      const offset = isInline ? entryBase : valueOrOffset;
      return String(readUint16(view, offset, le));
    }
    if (type === 4) {
      // LONG
      const isInline = count <= 1;
      const offset = isInline ? entryBase : valueOrOffset;
      return String(readUint32(view, offset, le));
    }
    if (type === 5) {
      // RATIONAL
      const num = readUint32(view, valueOrOffset, le);
      const den = readUint32(view, valueOrOffset + 4, le);
      if (den === 0) return '0';
      return `${(num / den).toFixed(4).replace(/\.?0+$/, '')}`;
    }
    if (type === 10) {
      // SRATIONAL
      const num = view.getInt32(valueOrOffset, le);
      const den = view.getInt32(valueOrOffset + 4, le);
      if (den === 0) return '0';
      return `${(num / den).toFixed(4).replace(/\.?0+$/, '')}`;
    }
    if (type === 1) {
      return String(view.getUint8(entryBase));
    }
  } catch {
    return '';
  }
  return '';
}

function parseIfd(
  view: DataView,
  ifdOffset: number,
  tiffBase: number,
  le: boolean,
  tags: ExifTag[],
  seenTags: Set<number>,
  isGps = false
): void {
  try {
    if (ifdOffset + 2 > view.byteLength) return;
    const count = readUint16(view, ifdOffset, le);
    if (count > 512 || count < 0) return;

    for (let i = 0; i < count; i++) {
      const entry = ifdOffset + 2 + i * 12;
      if (entry + 12 > view.byteLength) break;

      const tagId = readUint16(view, entry, le);
      const type = readUint16(view, entry + 2, le);
      const cnt = readUint32(view, entry + 4, le);
      const rawValue = readUint32(view, entry + 8, le);
      const valueOrOffset = tiffBase + rawValue;
      const entryBase = entry + 8;

      const tagMeta = EXIF_TAG_MAP[tagId];
      if (!tagMeta) continue;
      if (seenTags.has(tagId)) continue;
      seenTags.add(tagId);

      const value = readTagValue(view, type, cnt, valueOrOffset, entryBase, le);
      if (value) {
        tags.push({
          tag: `0x${tagId.toString(16).toUpperCase().padStart(4, '0')}`,
          label: tagMeta.label,
          value,
          category: isGps ? 'location' : tagMeta.category,
        });
      }
    }
  } catch {
    // silently skip corrupt IFD
  }
}

/**
 * Reads EXIF metadata from a JPEG file by parsing APP1 segments.
 */
export async function readExifData(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const seenTags = new Set<number>();

  try {
    const isJpegOrRaster =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.name.toLowerCase().match(/\.(jpg|jpeg|tiff?|webp)$/) !== null;

    if (!isJpegOrRaster) {
      return { tags: [], hasGps: false, hasCamera: false, hasSoftware: false, rawSize: 0 };
    }

    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    const isJpeg = view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8;
    if (!isJpeg) {
      return { tags: [], hasGps: false, hasCamera: false, hasSoftware: false, rawSize: 0 };
    }

    let offset = 2;
    let totalExifSize = 0;

    while (offset < view.byteLength - 4) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint16(offset);
      offset += 2;

      if (marker === 0xffd8 || marker === 0xffd9) continue;
      if (offset + 2 > view.byteLength) break;

      const segmentLength = view.getUint16(offset, false);
      const segmentData = offset + 2;
      offset += segmentLength;
      if (segmentLength < 2) break;

      // APP1 = EXIF or XMP
      if (marker === 0xffe1 && segmentLength > 6) {
        const sig = readString(view, segmentData, 4);
        if (sig === 'Exif') {
          totalExifSize += segmentLength;
          const tiffBase = segmentData + 6;
          const byteOrder = view.getUint16(tiffBase, false);
          const le = byteOrder === 0x4949;

          const ifd0Rel = readUint32(view, tiffBase + 4, le);
          const ifd0 = tiffBase + ifd0Rel;
          parseIfd(view, ifd0, tiffBase, le, tags, seenTags);

          // Scan for SubIFD and GPS IFD pointer tags
          const ifd0Count = readUint16(view, ifd0, le);
          for (let i = 0; i < Math.min(ifd0Count, 512); i++) {
            const entry = ifd0 + 2 + i * 12;
            if (entry + 12 > view.byteLength) break;
            const tagId = readUint16(view, entry, le);
            const rawPtr = readUint32(view, entry + 8, le);

            if (tagId === 0x8769) {
              parseIfd(view, tiffBase + rawPtr, tiffBase, le, tags, seenTags);
            }
            if (tagId === 0x8825) {
              parseIfd(view, tiffBase + rawPtr, tiffBase, le, tags, seenTags, true);
            }
          }
        } else {
          // Check for XMP
          try {
            const xmpStart = readString(view, segmentData, 7);
            if (xmpStart === 'http://') {
              totalExifSize += segmentLength;
              if (!tags.some(t => t.tag === 'XMP')) {
                tags.push({ tag: 'XMP', label: 'XMP Metadata Block', value: 'Present', category: 'software' });
              }
            }
          } catch { /* skip */ }
        }
      }

      // APP13 = Photoshop/IPTC
      if (marker === 0xffed) {
        totalExifSize += segmentLength;
        if (!seenTags.has(0xffed)) {
          seenTags.add(0xffed);
          tags.push({ tag: 'IPTC', label: 'Photoshop/IPTC Metadata', value: 'Present', category: 'software' });
        }
      }

      // APP2 = ICC Profile
      if (marker === 0xffe2) {
        totalExifSize += segmentLength;
        if (!seenTags.has(0xffe2)) {
          seenTags.add(0xffe2);
          tags.push({ tag: 'ICC', label: 'ICC Color Profile', value: 'Present', category: 'settings' });
        }
      }

      if (marker === 0xffda) break; // SOS — start of image scan data, stop
    }

    return {
      tags,
      hasGps: tags.some(t => t.category === 'location'),
      hasCamera: tags.some(t => t.category === 'camera'),
      hasSoftware: tags.some(t => t.category === 'software'),
      rawSize: totalExifSize,
    };
  } catch {
    return { tags: [], hasGps: false, hasCamera: false, hasSoftware: false, rawSize: 0 };
  }
}

/**
 * Strips all EXIF/metadata by re-drawing the image on a canvas.
 * Canvas.toBlob() never embeds original metadata, achieving clean output.
 */
export async function stripExifFromFile(
  file: File,
  outputQuality = 0.92
): Promise<ExifRemovalResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);

        const name = file.name.toLowerCase();
        const isJpeg = file.type === 'image/jpeg' || name.match(/\.(jpg|jpeg)$/) !== null;
        const isWebp = file.type === 'image/webp' || name.endsWith('.webp');
        const isPng = file.type === 'image/png' || name.endsWith('.png');

        const mime = isJpeg ? 'image/jpeg' : isWebp ? 'image/webp' : isPng ? 'image/png' : 'image/jpeg';
        const quality = mime === 'image/png' ? undefined : outputQuality;
        const format = isJpeg ? 'jpg' : isWebp ? 'webp' : isPng ? 'png' : 'jpg';

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Failed to encode clean image')); return; }
            resolve({
              blob,
              previewUrl: URL.createObjectURL(blob),
              originalSizeBytes: file.size,
              cleanedSizeBytes: blob.size,
              format,
            });
          },
          mime,
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load "${file.name}"`));
    };

    img.src = objectUrl;
  });
}
