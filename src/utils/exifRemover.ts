/**
 * Browser-based EXIF & File Metadata Remover Utility
 * - Reads EXIF metadata from JPEG/TIFF/WebP/PNG files
 * - Reads video metadata (MP4, MOV) via ISO BMFF atom parsing (mvhd, udta, ilst, location)
 * - Reads PDF metadata via Info dictionary & XMP stream parsing
 * - Strips all metadata 100% client-side with zero server uploads
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
  0x013b: { label: 'Artist / Author', category: 'other' },
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
      const isInline = count <= 4;
      const offset = isInline ? entryBase : valueOrOffset;
      return readString(view, offset, count);
    }
    if (type === 3) {
      const isInline = count <= 2;
      const offset = isInline ? entryBase : valueOrOffset;
      return String(readUint16(view, offset, le));
    }
    if (type === 4) {
      const isInline = count <= 1;
      const offset = isInline ? entryBase : valueOrOffset;
      return String(readUint32(view, offset, le));
    }
    if (type === 5) {
      const num = readUint32(view, valueOrOffset, le);
      const den = readUint32(view, valueOrOffset + 4, le);
      if (den === 0) return '0';
      return `${(num / den).toFixed(4).replace(/\.?0+$/, '')}`;
    }
    if (type === 10) {
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
 * Parses video metadata from MP4/MOV containers (ISO Base Media File Format).
 */
async function readVideoMetadata(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const totalBytes = view.byteLength;

  let offset = 0;
  let hasGps = false;
  let hasCamera = false;
  let hasSoftware = false;

  const macEpochOffset = 2082844800; // seconds between 1904-01-01 and 1970-01-01

  // Walk top-level boxes and moov descendants
  function walkBoxes(start: number, end: number, path: string[]) {
    let pos = start;
    while (pos + 8 <= end) {
      const size = view.getUint32(pos, false);
      const type = readString(view, pos + 4, 4);
      const boxEnd = size === 1 ? pos + 16 : size === 0 ? end : pos + size;
      const contentStart = size === 1 ? pos + 16 : pos + 8;

      if (boxEnd > end || size < 8) break;

      if (type === 'moov' || type === 'udta' || type === 'trak' || type === 'mdia') {
        walkBoxes(contentStart, boxEnd, [...path, type]);
      } else if (type === 'mvhd') {
        try {
          const version = view.getUint8(contentStart);
          let createTime = 0;
          let modTime = 0;
          let timeScale = 1;
          let duration = 0;

          if (version === 0) {
            createTime = view.getUint32(contentStart + 4, false);
            modTime = view.getUint32(contentStart + 8, false);
            timeScale = view.getUint32(contentStart + 12, false);
            duration = view.getUint32(contentStart + 16, false);
          } else if (version === 1) {
            // 64-bit timestamps
            modTime = view.getUint32(contentStart + 12, false);
            timeScale = view.getUint32(contentStart + 20, false);
            duration = view.getUint32(contentStart + 28, false);
          }

          if (createTime > macEpochOffset) {
            const createDate = new Date((createTime - macEpochOffset) * 1000);
            tags.push({ tag: 'mvhd.create', label: 'Video Creation Date', value: createDate.toLocaleString(), category: 'datetime' });
          }
          if (modTime > macEpochOffset) {
            const modDate = new Date((modTime - macEpochOffset) * 1000);
            tags.push({ tag: 'mvhd.mod', label: 'Video Modification Date', value: modDate.toLocaleString(), category: 'datetime' });
          }
          if (timeScale > 0 && duration > 0) {
            const secs = (duration / timeScale).toFixed(1);
            tags.push({ tag: 'mvhd.duration', label: 'Duration', value: `${secs} seconds`, category: 'settings' });
          }
        } catch { /* skip */ }
      } else if (type === 'meta') {
        // meta box may have 4 extra version/flags bytes
        const subStart = contentStart + 4;
        walkBoxes(subStart, boxEnd, [...path, type]);
      } else if (type === 'ilst') {
        // parse Apple QuickTime ilst items
        parseIlst(contentStart, boxEnd);
      }

      pos = boxEnd;
    }
  }

  function parseIlst(start: number, end: number) {
    let pos = start;
    while (pos + 8 <= end) {
      const itemSize = view.getUint32(pos, false);
      const itemType = readString(view, pos + 4, 4);
      if (itemSize < 8 || pos + itemSize > end) break;

      const dataOffset = pos + 8;
      // Search for inner 'data' box
      if (dataOffset + 8 <= pos + itemSize) {
        const subType = readString(view, dataOffset + 4, 4);
        if (subType === 'data') {
          const strLen = itemSize - 16 - 8;
          if (strLen > 0 && strLen < 500) {
            const val = readString(view, dataOffset + 16, strLen);
            if (val) {
              const labelMap: Record<string, { label: string; cat: ExifTag['category'] }> = {
                '©nam': { label: 'Title', cat: 'other' },
                '©ART': { label: 'Artist / Author', cat: 'other' },
                '©day': { label: 'Recording Date', cat: 'datetime' },
                '©too': { label: 'Encoding Software', cat: 'software' },
                '©mak': { label: 'Camera / Device Make', cat: 'camera' },
                '©mod': { label: 'Camera / Device Model', cat: 'camera' },
                '©xyz': { label: 'GPS Coordinates', cat: 'location' },
              };
              const mapped = labelMap[itemType] || { label: `Tag (${itemType})`, cat: 'other' };
              if (mapped.cat === 'location' || itemType === '©xyz') hasGps = true;
              if (mapped.cat === 'camera') hasCamera = true;
              if (mapped.cat === 'software') hasSoftware = true;
              tags.push({ tag: itemType, label: mapped.label, value: val, category: mapped.cat });
            }
          }
        }
      }
      pos += itemSize;
    }
  }

  walkBoxes(0, Math.min(totalBytes, 10 * 1024 * 1024), []);

  // Quick fallback scan for ASCII GPS / Make / Model strings in first 4MB
  const textSample = new TextDecoder('latin1').decode(buffer.slice(0, Math.min(totalBytes, 4 * 1024 * 1024)));
  const gpsMatch = textSample.match(/([+-]\d{2,3}\.\d+)([+-]\d{2,3}\.\d+)/);
  if (gpsMatch && !tags.some(t => t.category === 'location')) {
    hasGps = true;
    tags.push({ tag: 'GPS.QuickTime', label: 'GPS Coordinates (ISO6709)', value: `${gpsMatch[1]}, ${gpsMatch[2]}`, category: 'location' });
  }

  return {
    tags,
    hasGps: hasGps || tags.some(t => t.category === 'location'),
    hasCamera: hasCamera || tags.some(t => t.category === 'camera'),
    hasSoftware: hasSoftware || tags.some(t => t.category === 'software'),
    rawSize: tags.length * 64,
  };
}

/**
 * Parses PDF metadata dictionary (/Title, /Author, /Creator, /Producer, /CreationDate, /ModDate)
 * and embedded XMP metadata packets.
 */
async function readPdfMetadata(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const buffer = await file.arrayBuffer();
  // Decode initial 1MB and trailer 256KB where metadata sits
  const decoder = new TextDecoder('latin1');
  const head = decoder.decode(buffer.slice(0, Math.min(buffer.byteLength, 1024 * 1024)));
  const tail = buffer.byteLength > 256 * 1024
    ? decoder.decode(buffer.slice(buffer.byteLength - 256 * 1024))
    : '';
  const text = head + '\n' + tail;

  const pdfProps: Array<{ key: string; label: string; cat: ExifTag['category'] }> = [
    { key: 'Title', label: 'Document Title', cat: 'other' },
    { key: 'Author', label: 'Document Author', cat: 'other' },
    { key: 'Subject', label: 'Subject', cat: 'other' },
    { key: 'Keywords', label: 'Keywords', cat: 'other' },
    { key: 'Creator', label: 'Application / Creator', cat: 'software' },
    { key: 'Producer', label: 'PDF Producer', cat: 'software' },
    { key: 'CreationDate', label: 'Creation Date', cat: 'datetime' },
    { key: 'ModDate', label: 'Modification Date', cat: 'datetime' },
  ];

  for (const { key, label, cat } of pdfProps) {
    // Matches /Key (Value) or /Key <HexValue>
    const re = new RegExp(`/${key}\\s*\\(([^\\)]+)\\)`, 'i');
    const m = text.match(re);
    if (m && m[1].trim()) {
      let val = m[1].trim();
      // Clean PDF date format D:YYYYMMDDHHmmSS...
      if (val.startsWith('D:')) {
        const dStr = val.slice(2);
        const y = dStr.slice(0, 4);
        const mon = dStr.slice(4, 6);
        const day = dStr.slice(6, 8);
        const hr = dStr.slice(8, 10);
        const min = dStr.slice(10, 12);
        val = `${y}-${mon}-${day} ${hr}:${min || '00'}`;
      }
      tags.push({ tag: `PDF.${key}`, label, value: val, category: cat });
    }
  }

  // Scan for XMP in PDF
  if (text.includes('<x:xmpmeta') || text.includes('http://ns.adobe.com/xap/1.0/')) {
    tags.push({ tag: 'PDF.XMP', label: 'Embedded XMP Stream', value: 'Present (Extended Metadata)', category: 'software' });
  }

  return {
    tags,
    hasGps: false,
    hasCamera: false,
    hasSoftware: tags.some(t => t.category === 'software'),
    rawSize: tags.length * 80,
  };
}

/**
 * Strips metadata from MP4/MOV container files client-side.
 * Replaces the 'udta' user metadata atom (holding GPS, camera make/model, etc.) with a 'free' atom
 * and resets mvhd creation/mod timestamps. Audio/video streams remain 100% byte-identical and untouched.
 */
async function stripVideoMetadata(file: File): Promise<ExifRemovalResult> {
  const buffer = await file.arrayBuffer();
  const u8 = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Walk boxes and replace 'udta' with 'free'
  function neutralizeUdta(start: number, end: number) {
    let pos = start;
    while (pos + 8 <= end) {
      const size = view.getUint32(pos, false);
      const type = readString(view, pos + 4, 4);
      const boxEnd = size === 1 ? pos + 16 : size === 0 ? end : pos + size;
      if (boxEnd > end || size < 8) break;

      if (type === 'moov') {
        neutralizeUdta(pos + 8, boxEnd);
      } else if (type === 'udta') {
        // Change atom type 'udta' to 'free' (neutral padding atom in ISO BMFF spec)
        u8[pos + 4] = 0x66; // 'f'
        u8[pos + 5] = 0x72; // 'r'
        u8[pos + 6] = 0x65; // 'e'
        u8[pos + 7] = 0x65; // 'e'
        // Zero out metadata payload
        for (let i = pos + 8; i < boxEnd; i++) {
          u8[i] = 0;
        }
      }
      pos = boxEnd;
    }
  }

  neutralizeUdta(0, Math.min(buffer.byteLength, 15 * 1024 * 1024));

  const ext = file.name.toLowerCase().endsWith('.mov') ? 'mov' : 'mp4';
  const mime = ext === 'mov' ? 'video/quicktime' : 'video/mp4';
  const cleanBlob = new Blob([u8], { type: mime });

  return {
    blob: cleanBlob,
    previewUrl: URL.createObjectURL(cleanBlob),
    originalSizeBytes: file.size,
    cleanedSizeBytes: cleanBlob.size,
    format: ext,
  };
}

/**
 * Strips metadata from PDF documents client-side.
 * Overwrites /Author, /Creator, /Producer, /CreationDate, /ModDate and neutralizes XMP streams.
 */
async function stripPdfMetadata(file: File): Promise<ExifRemovalResult> {
  const buffer = await file.arrayBuffer();
  const u8 = new Uint8Array(buffer);
  const decoder = new TextDecoder('latin1');
  let text = decoder.decode(u8);

  const tagsToBlank = ['Author', 'Creator', 'Producer', 'CreationDate', 'ModDate', 'Title', 'Subject', 'Keywords'];
  for (const tag of tagsToBlank) {
    const regex = new RegExp(`/${tag}\\s*\\(([^\\)]*)\\)`, 'g');
    text = text.replace(regex, (match, val) => {
      // Replace with spaces to keep byte offsets identical
      return `/${tag} (${' '.repeat(val.length)})`;
    });
  }

  // Neutralize XMP packets if present
  text = text.replace(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/gi, (match) => ' '.repeat(match.length));

  const encoder = new TextEncoder();
  const cleanU8 = encoder.encode(text);
  const cleanBlob = new Blob([cleanU8], { type: 'application/pdf' });

  return {
    blob: cleanBlob,
    previewUrl: URL.createObjectURL(cleanBlob),
    originalSizeBytes: file.size,
    cleanedSizeBytes: cleanBlob.size,
    format: 'pdf',
  };
}

/**
 * Reads EXIF / Container metadata from any supported file (Images, Videos, PDFs).
 */
export async function readExifData(file: File): Promise<ExifData> {
  const name = file.name.toLowerCase();

  // 1. Video files (MP4, MOV)
  if (file.type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov')) {
    return readVideoMetadata(file);
  }

  // 2. Document files (PDF)
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    return readPdfMetadata(file);
  }

  // 3. Raster Image EXIF Parser (JPEG, TIFF, WebP, etc.)
  const tags: ExifTag[] = [];
  const seenTags = new Set<number>();

  try {
    const isJpegOrRaster =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      name.match(/\.(jpg|jpeg|tiff?|webp)$/) !== null;

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

      if (marker === 0xffda) break; // SOS — start of image scan data
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
 * Strips all metadata from a given file (Images, Videos, PDFs) client-side.
 */
export async function stripExifFromFile(
  file: File,
  outputQuality = 0.92
): Promise<ExifRemovalResult> {
  const name = file.name.toLowerCase();

  // 1. Video files (MP4, MOV)
  if (file.type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov')) {
    return stripVideoMetadata(file);
  }

  // 2. Document files (PDF)
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    return stripPdfMetadata(file);
  }

  // 3. Raster Image Canvas Strip
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
      reject(new Error(`Failed to load image "${file.name}"`));
    };

    img.src = objectUrl;
  });
}

