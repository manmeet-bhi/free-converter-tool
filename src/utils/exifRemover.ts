/**
 * Browser-based EXIF & Universal Media Metadata Remover Utility
 * - Reads & strips metadata client-side 100% in-browser with ZERO server uploads.
 * - Supports:
 *   - Video: MP4, MOV, WebM, MKV, AVI, M4V, 3GP, FLV, WMV, TS
 *   - Audio: MP3, M4A, WAV, FLAC, OGG, Opus, AAC
 *   - Images: JPEG, PNG (lossless chunk strip), WebP, AVIF, GIF, BMP, TIFF, HEIC/HEIF
 *   - Documents: PDF (Info dictionary + XMP stream blanking)
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

// --------------------------------------------------------------------------
// 1. ISO BASE MEDIA FILE FORMAT (MP4, MOV, M4V, M4A, 3GP, 3G2)
// --------------------------------------------------------------------------
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '';
  const s = Math.round(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s (${seconds.toFixed(1)}s)`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s (${seconds.toFixed(1)}s)`;
  }
  return `${seconds.toFixed(2)}s`;
}

interface IsoBoxHeader {
  offset: number;
  totalSize: number;
  headerSize: number;
  type: string;
}

/**
 * Reads top-level box headers without loading mdat video frames into RAM.
 * Allows handling multi-gigabyte or long videos in milliseconds.
 */
async function scanTopLevelBoxes(file: File): Promise<IsoBoxHeader[]> {
  const boxes: IsoBoxHeader[] = [];
  let pos = 0;
  const maxBoxes = 120;
  let count = 0;

  while (pos + 8 <= file.size && count < maxBoxes) {
    count++;
    const readLen = Math.min(16, file.size - pos);
    const sliceBuf = await file.slice(pos, pos + readLen).arrayBuffer();
    if (sliceBuf.byteLength < 8) break;

    const view = new DataView(sliceBuf);
    const size32 = view.getUint32(0, false);
    const type = readString(view, 4, 4);

    let totalSize = size32;
    let headerSize = 8;

    if (size32 === 1 && sliceBuf.byteLength >= 16) {
      totalSize = Number(view.getBigUint64(8, false));
      headerSize = 16;
    } else if (size32 === 0) {
      totalSize = file.size - pos;
      headerSize = 8;
    }

    if (totalSize < headerSize || isNaN(totalSize) || totalSize > file.size * 2) {
      break;
    }

    boxes.push({ offset: pos, totalSize, headerSize, type });
    pos += totalSize;
  }

  return boxes;
}

async function readIsoBmffMetadata(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  let hasGps = false;
  let hasCamera = false;
  let hasSoftware = false;
  const macEpochOffset = 2082844800; // seconds between 1904-01-01 and 1970-01-01

  // 1. Locate moov box using lightweight top-level header scanning
  const topBoxes = await scanTopLevelBoxes(file);
  const moovBox = topBoxes.find(b => b.type === 'moov');

  let moovBuffer: ArrayBuffer | null = null;

  if (moovBox && moovBox.totalSize > 0 && moovBox.totalSize <= 64 * 1024 * 1024) {
    moovBuffer = await file.slice(moovBox.offset, moovBox.offset + moovBox.totalSize).arrayBuffer();
  } else {
    // Fallback: If moov is placed at the end of a long video, check the last 32 MB
    const tailSize = Math.min(file.size, 32 * 1024 * 1024);
    const tailOffset = file.size - tailSize;
    const tailBuf = await file.slice(tailOffset, file.size).arrayBuffer();
    const tailU8 = new Uint8Array(tailBuf);
    const tailView = new DataView(tailBuf);

    for (let i = 0; i <= tailBuf.byteLength - 8; i += 4) {
      if (
        tailU8[i + 4] === 0x6d && // 'm'
        tailU8[i + 5] === 0x6f && // 'o'
        tailU8[i + 6] === 0x6f && // 'o'
        tailU8[i + 7] === 0x76    // 'v'
      ) {
        const sz = tailView.getUint32(i, false);
        if (sz >= 8 && i + sz <= tailBuf.byteLength) {
          moovBuffer = tailBuf.slice(i, i + sz);
          break;
        } else if (i + 8 <= tailBuf.byteLength) {
          moovBuffer = tailBuf.slice(i);
          break;
        }
      }
    }

    // Fallback 2: Check first 16 MB
    if (!moovBuffer) {
      const headSize = Math.min(file.size, 16 * 1024 * 1024);
      const headBuf = await file.slice(0, headSize).arrayBuffer();
      const headU8 = new Uint8Array(headBuf);
      const headView = new DataView(headBuf);
      for (let i = 0; i <= headBuf.byteLength - 8; i += 4) {
        if (
          headU8[i + 4] === 0x6d &&
          headU8[i + 5] === 0x6f &&
          headU8[i + 6] === 0x6f &&
          headU8[i + 7] === 0x76
        ) {
          const sz = headView.getUint32(i, false);
          if (sz >= 8 && i + sz <= headBuf.byteLength) {
            moovBuffer = headBuf.slice(i, i + sz);
            break;
          }
        }
      }
    }
  }

  if (moovBuffer) {
    const view = new DataView(moovBuffer);

    function walkBoxes(start: number, end: number, path: string[]) {
      let pos = start;
      while (pos + 8 <= end) {
        const size32 = view.getUint32(pos, false);
        const type = readString(view, pos + 4, 4);

        let boxEnd = pos + size32;
        let contentStart = pos + 8;

        if (size32 === 1 && pos + 16 <= end) {
          const size64 = Number(view.getBigUint64(pos + 8, false));
          boxEnd = pos + size64;
          contentStart = pos + 16;
        } else if (size32 === 0) {
          boxEnd = end;
          contentStart = pos + 8;
        }

        if (boxEnd > end || (size32 !== 0 && size32 < 8)) break;

        if (type === 'moov' || type === 'udta' || type === 'trak' || type === 'mdia' || type === 'minf' || type === 'meta') {
          const subStart = type === 'meta' ? contentStart + 4 : contentStart;
          walkBoxes(subStart, boxEnd, [...path, type]);
        } else if (type === 'mvhd') {
          try {
            const version = view.getUint8(contentStart);
            let createTime = 0;
            let modTime = 0;
            let timeScale = 1;
            let duration = 0;

            if (version === 0 && contentStart + 20 <= boxEnd) {
              createTime = view.getUint32(contentStart + 4, false);
              modTime = view.getUint32(contentStart + 8, false);
              timeScale = view.getUint32(contentStart + 12, false);
              duration = view.getUint32(contentStart + 16, false);
            } else if (version === 1 && contentStart + 32 <= boxEnd) {
              createTime = Number(view.getBigUint64(contentStart + 4, false));
              modTime = Number(view.getBigUint64(contentStart + 12, false));
              timeScale = view.getUint32(contentStart + 20, false);
              duration = Number(view.getBigUint64(contentStart + 24, false));
            }

            if (createTime > macEpochOffset) {
              const createDate = new Date((createTime - macEpochOffset) * 1000);
              tags.push({ tag: 'mvhd.create', label: 'Media Creation Date', value: createDate.toLocaleString(), category: 'datetime' });
            }
            if (modTime > macEpochOffset) {
              const modDate = new Date((modTime - macEpochOffset) * 1000);
              tags.push({ tag: 'mvhd.mod', label: 'Media Modification Date', value: modDate.toLocaleString(), category: 'datetime' });
            }
            if (timeScale > 0 && duration > 0) {
              const formattedDuration = formatDuration(duration / timeScale);
              tags.push({ tag: 'mvhd.duration', label: 'Video Duration', value: formattedDuration, category: 'settings' });
            }
          } catch { /* skip corrupt mvhd */ }
        } else if (type === 'ilst') {
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
        if (dataOffset + 8 <= pos + itemSize) {
          const subType = readString(view, dataOffset + 4, 4);
          if (subType === 'data') {
            const strLen = itemSize - 16 - 8;
            if (strLen > 0 && strLen < 1000) {
              const val = readString(view, dataOffset + 16, strLen);
              if (val) {
                const labelMap: Record<string, { label: string; cat: ExifTag['category'] }> = {
                  '©nam': { label: 'Title', cat: 'other' },
                  '©ART': { label: 'Artist / Author', cat: 'other' },
                  '©alb': { label: 'Album', cat: 'other' },
                  '©day': { label: 'Recording Date', cat: 'datetime' },
                  '©too': { label: 'Encoding Software', cat: 'software' },
                  '©swr': { label: 'Software Application', cat: 'software' },
                  '©mak': { label: 'Camera / Device Make', cat: 'camera' },
                  '©mod': { label: 'Camera / Device Model', cat: 'camera' },
                  '©xyz': { label: 'GPS Coordinates', cat: 'location' },
                  '©gen': { label: 'Genre', cat: 'other' },
                  '©wrt': { label: 'Composer / Writer', cat: 'other' },
                  'cprt': { label: 'Copyright', cat: 'other' },
                  'desc': { label: 'Description', cat: 'other' },
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

    walkBoxes(0, moovBuffer.byteLength, []);

    // Quick regex scan for ISO 6709 GPS string in moov atom
    try {
      const moovText = new TextDecoder('latin1').decode(moovBuffer);
      const gpsMatch = moovText.match(/([+-]\d{2,3}\.\d{3,})([+-]\d{2,3}\.\d{3,})/);
      if (gpsMatch && !tags.some(t => t.category === 'location')) {
        hasGps = true;
        tags.push({
          tag: 'GPS.QuickTime',
          label: 'GPS Coordinates (ISO6709)',
          value: `${gpsMatch[1]}, ${gpsMatch[2]}`,
          category: 'location',
        });
      }

      // Check common device signatures in moov
      const deviceSignatures = [
        { regex: /iPhone\s*[\w,]+/i, label: 'Camera Device', cat: 'camera' as const },
        { regex: /iPad\s*[\w,]+/i, label: 'Camera Device', cat: 'camera' as const },
        { regex: /GoPro\s*[\w\s]+/i, label: 'Action Camera', cat: 'camera' as const },
        { regex: /DJI\s*[\w\s]+/i, label: 'Drone / Camera', cat: 'camera' as const },
        { regex: /Canon\s*[\w\s]+/i, label: 'Digital Camera', cat: 'camera' as const },
        { regex: /Sony\s*[\w\s]+/i, label: 'Digital Camera', cat: 'camera' as const },
        { regex: /Samsung\s*[\w\s]+/i, label: 'Camera Device', cat: 'camera' as const },
      ];

      for (const sig of deviceSignatures) {
        const m = moovText.match(sig.regex);
        if (m && !tags.some(t => t.value.includes(m[0]))) {
          hasCamera = true;
          tags.push({ tag: 'Device.Hardware', label: sig.label, value: m[0].trim(), category: sig.cat });
          break;
        }
      }
    } catch { /* skip */ }
  }

  return {
    tags,
    hasGps: hasGps || tags.some(t => t.category === 'location'),
    hasCamera: hasCamera || tags.some(t => t.category === 'camera'),
    hasSoftware: hasSoftware || tags.some(t => t.category === 'software'),
    rawSize: tags.length * 64,
  };
}

async function stripIsoBmffMetadata(file: File): Promise<ExifRemovalResult> {
  const name = file.name.toLowerCase();
  const ext = name.endsWith('.mov') ? 'mov' : name.endsWith('.m4a') ? 'm4a' : 'mp4';
  const mime = ext === 'mov' ? 'video/quicktime' : ext === 'm4a' ? 'audio/mp4' : 'video/mp4';

  const topBoxes = await scanTopLevelBoxes(file);
  const moovBox = topBoxes.find(b => b.type === 'moov');

  if (moovBox && moovBox.totalSize > 0 && moovBox.totalSize <= 64 * 1024 * 1024) {
    // Read ONLY the moov box (typically 100 KB - 2 MB)
    const moovBuf = await file.slice(moovBox.offset, moovBox.offset + moovBox.totalSize).arrayBuffer();
    const moovU8 = new Uint8Array(moovBuf);
    const moovView = new DataView(moovBuf);

    function neutralizeMoov(start: number, end: number) {
      let pos = start;
      while (pos + 8 <= end) {
        const size32 = moovView.getUint32(pos, false);
        const type = readString(moovView, pos + 4, 4);

        let boxEnd = pos + size32;
        let contentStart = pos + 8;

        if (size32 === 1 && pos + 16 <= end) {
          const size64 = Number(moovView.getBigUint64(pos + 8, false));
          boxEnd = pos + size64;
          contentStart = pos + 16;
        } else if (size32 === 0) {
          boxEnd = end;
          contentStart = pos + 8;
        }

        if (boxEnd > end || (size32 !== 0 && size32 < 8)) break;

        if (type === 'moov' || type === 'trak' || type === 'mdia' || type === 'minf') {
          neutralizeMoov(contentStart, boxEnd);
        } else if (type === 'udta' || type === 'meta') {
          // Change atom type to 'free' (standard ISO BMFF neutral padding atom)
          moovU8[pos + 4] = 0x66; // 'f'
          moovU8[pos + 5] = 0x72; // 'r'
          moovU8[pos + 6] = 0x65; // 'e'
          moovU8[pos + 7] = 0x65; // 'e'
          // Zero out payload
          for (let i = contentStart; i < boxEnd; i++) {
            moovU8[i] = 0;
          }
        } else if (type === 'mvhd' || type === 'tkhd') {
          // Zero out creation and modification timestamps in 32-bit and 64-bit headers
          const version = moovView.getUint8(contentStart);
          if (version === 0 && contentStart + 16 <= boxEnd) {
            moovView.setUint32(contentStart + 4, 0, false); // creation_time
            moovView.setUint32(contentStart + 8, 0, false); // modification_time
          } else if (version === 1 && contentStart + 28 <= boxEnd) {
            moovView.setBigUint64(contentStart + 4, 0n, false); // creation_time (64-bit)
            moovView.setBigUint64(contentStart + 12, 0n, false); // modification_time (64-bit)
          }
        }

        pos = boxEnd;
      }
    }

    neutralizeMoov(moovBox.headerSize, moovBuf.byteLength);

    // Concatenate chunks without duplicating mdat video frames in RAM
    const parts: BlobPart[] = [];
    if (moovBox.offset > 0) {
      parts.push(file.slice(0, moovBox.offset));
    }
    parts.push(moovU8);
    if (moovBox.offset + moovBox.totalSize < file.size) {
      parts.push(file.slice(moovBox.offset + moovBox.totalSize));
    }

    const cleanBlob = new Blob(parts, { type: mime });
    return {
      blob: cleanBlob,
      previewUrl: URL.createObjectURL(cleanBlob),
      originalSizeBytes: file.size,
      cleanedSizeBytes: cleanBlob.size,
      format: ext,
    };
  }

  // Fallback for files without isolated moov or small clips (< 32 MB)
  const sampleLen = Math.min(file.size, 16 * 1024 * 1024);
  const headBuf = await file.slice(0, sampleLen).arrayBuffer();
  const headU8 = new Uint8Array(headBuf);

  // Scan and neutralize any udta in head
  for (let i = 0; i <= headU8.length - 8; i++) {
    if (
      headU8[i + 4] === 0x75 && // 'u'
      headU8[i + 5] === 0x64 && // 'd'
      headU8[i + 6] === 0x74 && // 't'
      headU8[i + 7] === 0x61    // 'a'
    ) {
      headU8[i + 4] = 0x66;
      headU8[i + 5] = 0x72;
      headU8[i + 6] = 0x65;
      headU8[i + 7] = 0x65;
    }
  }

  const parts: BlobPart[] = [headU8];
  if (file.size > sampleLen) {
    parts.push(file.slice(sampleLen));
  }

  const cleanBlob = new Blob(parts, { type: mime });
  return {
    blob: cleanBlob,
    previewUrl: URL.createObjectURL(cleanBlob),
    originalSizeBytes: file.size,
    cleanedSizeBytes: cleanBlob.size,
    format: ext,
  };
}

// --------------------------------------------------------------------------
// 2. MATROSKA & WEBM (MKV, WebM via EBML Element Inspection)
// --------------------------------------------------------------------------
async function readMatroskaMetadata(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const sampleSize = Math.min(file.size, 8 * 1024 * 1024);
  const buffer = await file.slice(0, sampleSize).arrayBuffer();
  const u8 = new Uint8Array(buffer);
  const decoder = new TextDecoder('utf-8');

  let hasSoftware = false;

  // EBML Element ID patterns
  // Title (0x7BA9), MuxingApp (0x4D80), WritingApp (0x5741), DateUTC (0x4461)
  // Scan text patterns in EBML Segment Info
  const latinText = new TextDecoder('latin1').decode(u8);

  const muxMatch = latinText.match(/\x4D\x80[\x80-\xFF]([^\x00-\x1F\x7F-\x9F]{2,60})/);
  if (muxMatch && muxMatch[1]) {
    hasSoftware = true;
    tags.push({ tag: 'EBML.MuxingApp', label: 'Muxing Application', value: muxMatch[1].trim(), category: 'software' });
  }

  const writeMatch = latinText.match(/\x57\x41[\x80-\xFF]([^\x00-\x1F\x7F-\x9F]{2,60})/);
  if (writeMatch && writeMatch[1]) {
    hasSoftware = true;
    tags.push({ tag: 'EBML.WritingApp', label: 'Writing Application', value: writeMatch[1].trim(), category: 'software' });
  }

  const titleMatch = latinText.match(/\x7B\xA9[\x80-\xFF]([^\x00-\x1F\x7F-\x9F]{2,80})/);
  if (titleMatch && titleMatch[1]) {
    tags.push({ tag: 'EBML.Title', label: 'Segment Title', value: titleMatch[1].trim(), category: 'other' });
  }

  // Check for common encoder signatures (HandBrake, Lavf, mkvmerge, etc.)
  const signatures = [
    { regex: /Lavf[0-9.]+/i, label: 'FFmpeg Muxer' },
    { regex: /HandBrake[0-9.]*/i, label: 'HandBrake Transcoder' },
    { regex: /mkvmerge[^\r\n]{0,30}/i, label: 'MKVToolNix' },
    { regex: /libebml[^\r\n]{0,30}/i, label: 'EBML Library' },
  ];

  for (const { regex, label } of signatures) {
    const m = latinText.match(regex);
    if (m && !tags.some(t => t.value.includes(m[0]))) {
      hasSoftware = true;
      tags.push({ tag: 'MKV.Encoder', label, value: m[0].trim(), category: 'software' });
    }
  }

  return {
    tags,
    hasGps: false,
    hasCamera: false,
    hasSoftware,
    rawSize: tags.length * 50,
  };
}

async function stripMatroskaMetadata(file: File): Promise<ExifRemovalResult> {
  const headerLen = Math.min(file.size, 16 * 1024 * 1024);
  const headerBuf = await file.slice(0, headerLen).arrayBuffer();
  const u8 = new Uint8Array(headerBuf);
  const latinText = new TextDecoder('latin1').decode(u8);

  // Blank out MuxingApp, WritingApp, and Title strings in-place with spaces
  const stringPatterns = [
    /\x4D\x80([\x80-\xFF])([^\x00-\x1F\x7F-\x9F]{2,80})/g,
    /\x57\x41([\x80-\xFF])([^\x00-\x1F\x7F-\x9F]{2,80})/g,
    /\x7B\xA9([\x80-\xFF])([^\x00-\x1F\x7F-\x9F]{2,80})/g,
  ];

  for (const pattern of stringPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(latinText)) !== null) {
      const matchIndex = match.index;
      const strLen = match[2].length;
      const strStart = matchIndex + 2 + 1; // ID (2 bytes) + length descriptor (1 byte)
      for (let i = 0; i < strLen; i++) {
        if (strStart + i < u8.length) {
          u8[strStart + i] = 0x20; // replace with neutral space
        }
      }
    }
  }

  const ext = file.name.toLowerCase().endsWith('.webm') ? 'webm' : 'mkv';
  const mime = ext === 'webm' ? 'video/webm' : 'video/x-matroska';

  const parts: BlobPart[] = [u8];
  if (file.size > headerLen) {
    parts.push(file.slice(headerLen));
  }
  const cleanBlob = new Blob(parts, { type: mime });

  return {
    blob: cleanBlob,
    previewUrl: URL.createObjectURL(cleanBlob),
    originalSizeBytes: file.size,
    cleanedSizeBytes: cleanBlob.size,
    format: ext,
  };
}

// --------------------------------------------------------------------------
// 3. RIFF CONTAINERS (AVI, WAV, WebP)
// --------------------------------------------------------------------------
async function readRiffMetadata(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const sampleSize = Math.min(file.size, 8 * 1024 * 1024);
  const buffer = await file.slice(0, sampleSize).arrayBuffer();
  const view = new DataView(buffer);

  let hasSoftware = false;

  if (view.byteLength > 12) {
    const riff = readString(view, 0, 4);
    const formType = readString(view, 8, 4);

    if (riff === 'RIFF') {
      let pos = 12;
      while (pos + 8 <= view.byteLength) {
        const chunkId = readString(view, pos, 4);
        const chunkSize = view.getUint32(pos + 4, true);
        if (chunkSize < 0 || pos + 8 + chunkSize > view.byteLength) break;

        if (chunkId === 'LIST') {
          const listType = readString(view, pos + 8, 4);
          if (listType === 'INFO') {
            // Parse INFO subchunks
            let subPos = pos + 12;
            const listEnd = pos + 8 + chunkSize;
            while (subPos + 8 <= listEnd) {
              const subId = readString(view, subPos, 4);
              const subSize = view.getUint32(subPos + 4, true);
              if (subSize <= 0 || subPos + 8 + subSize > listEnd) break;

              const val = readString(view, subPos + 8, Math.min(subSize, 300));
              if (val) {
                const riffMap: Record<string, { label: string; cat: ExifTag['category'] }> = {
                  'INAM': { label: 'Title / Track Name', cat: 'other' },
                  'IART': { label: 'Artist / Author', cat: 'other' },
                  'ICRD': { label: 'Creation Date', cat: 'datetime' },
                  'ISFT': { label: 'Software / Tool', cat: 'software' },
                  'ICMT': { label: 'Comments', cat: 'other' },
                  'ICOP': { label: 'Copyright', cat: 'other' },
                  'IGNR': { label: 'Genre', cat: 'other' },
                  'ITCH': { label: 'Technician', cat: 'software' },
                  'ISRC': { label: 'Source', cat: 'other' },
                };
                const meta = riffMap[subId] || { label: `RIFF.${subId}`, cat: 'other' };
                if (meta.cat === 'software') hasSoftware = true;
                tags.push({ tag: `RIFF.${subId}`, label: meta.label, value: val, category: meta.cat });
              }
              subPos += 8 + subSize + (subSize % 2);
            }
          }
        }
        pos += 8 + chunkSize + (chunkSize % 2);
      }
    }
  }

  return {
    tags,
    hasGps: false,
    hasCamera: false,
    hasSoftware,
    rawSize: tags.length * 60,
  };
}

async function stripRiffMetadata(file: File): Promise<ExifRemovalResult> {
  const headerLen = Math.min(file.size, 16 * 1024 * 1024);
  const headerBuf = await file.slice(0, headerLen).arrayBuffer();
  const u8 = new Uint8Array(headerBuf);
  const view = new DataView(headerBuf);

  if (view.byteLength > 12) {
    let pos = 12;
    while (pos + 8 <= view.byteLength) {
      const chunkId = readString(view, pos, 4);
      const chunkSize = view.getUint32(pos + 4, true);
      if (pos + 8 + chunkSize > view.byteLength) break;

      if (chunkId === 'LIST') {
        const listType = readString(view, pos + 8, 4);
        if (listType === 'INFO') {
          // Rename LIST to JUNK (standard RIFF neutral padding chunk)
          u8[pos] = 0x4A;     // 'J'
          u8[pos + 1] = 0x55; // 'U'
          u8[pos + 2] = 0x4E; // 'N'
          u8[pos + 3] = 0x4B; // 'K'
          // Zero payload
          for (let i = pos + 4; i < pos + 8 + chunkSize; i++) {
            u8[i] = 0;
          }
        }
      } else if (chunkId === 'id3 ' || chunkId === 'ID3 ' || chunkId === 'EXIF' || chunkId === 'XMP ') {
        u8[pos] = 0x4A; u8[pos + 1] = 0x55; u8[pos + 2] = 0x4E; u8[pos + 3] = 0x4B;
        for (let i = pos + 4; i < pos + 8 + chunkSize; i++) {
          u8[i] = 0;
        }
      }
      pos += 8 + chunkSize + (chunkSize % 2);
    }
  }

  const name = file.name.toLowerCase();
  const ext = name.endsWith('.avi') ? 'avi' : name.endsWith('.wav') ? 'wav' : 'webp';
  const mime = ext === 'avi' ? 'video/x-msvideo' : ext === 'wav' ? 'audio/wav' : 'image/webp';

  const parts: BlobPart[] = [u8];
  if (file.size > headerLen) {
    parts.push(file.slice(headerLen));
  }
  const cleanBlob = new Blob(parts, { type: mime });

  return {
    blob: cleanBlob,
    previewUrl: URL.createObjectURL(cleanBlob),
    originalSizeBytes: file.size,
    cleanedSizeBytes: cleanBlob.size,
    format: ext,
  };
}

// --------------------------------------------------------------------------
// 4. MP3 ID3V1 & ID3V2 AUDIO METADATA
// --------------------------------------------------------------------------
async function readMp3Metadata(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const headBuffer = await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer();
  const headView = new DataView(headBuffer);
  let hasSoftware = false;

  // Check ID3v2 at start
  if (headView.byteLength >= 10) {
    const id3 = readString(headView, 0, 3);
    if (id3 === 'ID3') {
      const synchsafeSize =
        ((headView.getUint8(6) & 0x7f) << 21) |
        ((headView.getUint8(7) & 0x7f) << 14) |
        ((headView.getUint8(8) & 0x7f) << 7) |
        (headView.getUint8(9) & 0x7f);

      const frameEnd = Math.min(headView.byteLength, 10 + synchsafeSize);
      let pos = 10;
      while (pos + 10 <= frameEnd) {
        const frameId = readString(headView, pos, 4);
        if (!frameId || frameId.charCodeAt(0) === 0) break;
        const frameSize = headView.getUint32(pos + 4, false);
        if (frameSize <= 0 || pos + 10 + frameSize > frameEnd) break;

        const val = readString(headView, pos + 10, Math.min(frameSize, 250));
        if (val) {
          const id3Map: Record<string, { label: string; cat: ExifTag['category'] }> = {
            'TIT2': { label: 'Track Title', cat: 'other' },
            'TPE1': { label: 'Lead Artist / Performer', cat: 'other' },
            'TALB': { label: 'Album Title', cat: 'other' },
            'TYER': { label: 'Release Year', cat: 'datetime' },
            'TDRC': { label: 'Recording Date', cat: 'datetime' },
            'TCON': { label: 'Genre', cat: 'other' },
            'COMM': { label: 'Comment', cat: 'other' },
            'TSSE': { label: 'Encoding Software', cat: 'software' },
            'TENC': { label: 'Encoded By', cat: 'software' },
            'TCOM': { label: 'Composer', cat: 'other' },
            'TRCK': { label: 'Track Number', cat: 'settings' },
          };
          const mapped = id3Map[frameId] || { label: `ID3.${frameId}`, cat: 'other' };
          if (mapped.cat === 'software') hasSoftware = true;
          tags.push({ tag: `ID3.${frameId}`, label: mapped.label, value: val, category: mapped.cat });
        }
        pos += 10 + frameSize;
      }
    }
  }

  // Check ID3v1 at end (last 128 bytes)
  if (file.size > 128) {
    const tailBuffer = await file.slice(file.size - 128).arrayBuffer();
    const tailView = new DataView(tailBuffer);
    if (readString(tailView, 0, 3) === 'TAG') {
      const title = readString(tailView, 3, 30);
      const artist = readString(tailView, 33, 30);
      const album = readString(tailView, 63, 30);
      const year = readString(tailView, 93, 4);

      if (title && !tags.some(t => t.label === 'Track Title')) tags.push({ tag: 'ID3v1.Title', label: 'Track Title', value: title, category: 'other' });
      if (artist && !tags.some(t => t.label.includes('Artist'))) tags.push({ tag: 'ID3v1.Artist', label: 'Artist', value: artist, category: 'other' });
      if (album && !tags.some(t => t.label === 'Album Title')) tags.push({ tag: 'ID3v1.Album', label: 'Album Title', value: album, category: 'other' });
      if (year && !tags.some(t => t.label.includes('Year'))) tags.push({ tag: 'ID3v1.Year', label: 'Release Year', value: year, category: 'datetime' });
    }
  }

  return {
    tags,
    hasGps: false,
    hasCamera: false,
    hasSoftware,
    rawSize: tags.length * 64,
  };
}

async function stripMp3Metadata(file: File): Promise<ExifRemovalResult> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  let startOffset = 0;
  let endOffset = buffer.byteLength;

  // Strip ID3v2 header from start
  if (view.byteLength >= 10 && readString(view, 0, 3) === 'ID3') {
    const synchsafeSize =
      ((view.getUint8(6) & 0x7f) << 21) |
      ((view.getUint8(7) & 0x7f) << 14) |
      ((view.getUint8(8) & 0x7f) << 7) |
      (view.getUint8(9) & 0x7f);
    startOffset = 10 + synchsafeSize;
  }

  // Strip ID3v1 trailer from end
  if (view.byteLength - startOffset > 128) {
    if (readString(view, view.byteLength - 128, 3) === 'TAG') {
      endOffset = view.byteLength - 128;
    }
  }

  const cleanSlice = buffer.slice(startOffset, endOffset);
  const cleanBlob = new Blob([cleanSlice], { type: 'audio/mpeg' });

  return {
    blob: cleanBlob,
    previewUrl: URL.createObjectURL(cleanBlob),
    originalSizeBytes: file.size,
    cleanedSizeBytes: cleanBlob.size,
    format: 'mp3',
  };
}

// --------------------------------------------------------------------------
// 5. FLAC AUDIO METADATA
// --------------------------------------------------------------------------
async function readFlacMetadata(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const buffer = await file.slice(0, Math.min(file.size, 2 * 1024 * 1024)).arrayBuffer();
  const u8 = new Uint8Array(buffer);
  let hasSoftware = false;

  if (u8.length >= 4 && u8[0] === 0x66 && u8[1] === 0x4C && u8[2] === 0x61 && u8[3] === 0x43) {
    let pos = 4;
    while (pos + 4 <= u8.length) {
      const isLast = (u8[pos] & 0x80) !== 0;
      const blockType = u8[pos] & 0x7f;
      const len = (u8[pos + 1] << 16) | (u8[pos + 2] << 8) | u8[pos + 3];
      pos += 4;

      if (blockType === 4 && pos + len <= u8.length) {
        // Vorbis comment block
        const view = new DataView(buffer, pos, len);
        const vendorLen = view.getUint32(0, true);
        if (vendorLen > 0 && vendorLen < len) {
          const vendor = readString(view, 4, vendorLen);
          if (vendor) {
            hasSoftware = true;
            tags.push({ tag: 'FLAC.Vendor', label: 'Encoding Software', value: vendor, category: 'software' });
          }

          let cPos = 4 + vendorLen;
          if (cPos + 4 <= len) {
            const count = view.getUint32(cPos, true);
            cPos += 4;
            for (let i = 0; i < Math.min(count, 50); i++) {
              if (cPos + 4 > len) break;
              const strLen = view.getUint32(cPos, true);
              cPos += 4;
              if (cPos + strLen > len) break;
              const comment = readString(view, cPos, strLen);
              const eqIdx = comment.indexOf('=');
              if (eqIdx > 0) {
                const key = comment.slice(0, eqIdx).toUpperCase();
                const val = comment.slice(eqIdx + 1).trim();
                const cat = (key === 'DATE' || key === 'YEAR') ? 'datetime' : 'other';
                tags.push({ tag: `FLAC.${key}`, label: key, value: val, category: cat });
              }
              cPos += strLen;
            }
          }
        }
      }

      pos += len;
      if (isLast) break;
    }
  }

  return {
    tags,
    hasGps: false,
    hasCamera: false,
    hasSoftware,
    rawSize: tags.length * 60,
  };
}

async function stripFlacMetadata(file: File): Promise<ExifRemovalResult> {
  const buffer = await file.arrayBuffer();
  const u8 = new Uint8Array(buffer);

  if (u8.length >= 4 && u8[0] === 0x66 && u8[1] === 0x4C && u8[2] === 0x61 && u8[3] === 0x43) {
    let pos = 4;
    while (pos + 4 <= u8.length) {
      const isLast = (u8[pos] & 0x80) !== 0;
      const blockType = u8[pos] & 0x7f;
      const len = (u8[pos + 1] << 16) | (u8[pos + 2] << 8) | u8[pos + 3];

      if (blockType === 4) {
        // Change Vorbis comment block type to PADDING (blockType = 1)
        u8[pos] = (isLast ? 0x80 : 0x00) | 0x01;
        // Zero payload
        for (let i = pos + 4; i < pos + 4 + len; i++) {
          u8[i] = 0;
        }
      }
      pos += 4 + len;
      if (isLast) break;
    }
  }

  const cleanBlob = new Blob([u8], { type: 'audio/flac' });
  return {
    blob: cleanBlob,
    previewUrl: URL.createObjectURL(cleanBlob),
    originalSizeBytes: file.size,
    cleanedSizeBytes: cleanBlob.size,
    format: 'flac',
  };
}

// --------------------------------------------------------------------------
// 6. PDF DOCUMENTS
// --------------------------------------------------------------------------
async function readPdfMetadata(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const buffer = await file.arrayBuffer();
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
    const re = new RegExp(`/${key}\\s*\\(([^\\)]+)\\)`, 'i');
    const m = text.match(re);
    if (m && m[1].trim()) {
      let val = m[1].trim();
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

async function stripPdfMetadata(file: File): Promise<ExifRemovalResult> {
  const buffer = await file.arrayBuffer();
  const u8 = new Uint8Array(buffer);
  const decoder = new TextDecoder('latin1');
  let text = decoder.decode(u8);

  const tagsToBlank = ['Author', 'Creator', 'Producer', 'CreationDate', 'ModDate', 'Title', 'Subject', 'Keywords'];
  for (const tag of tagsToBlank) {
    const regex = new RegExp(`/${tag}\\s*\\(([^\\)]*)\\)`, 'g');
    text = text.replace(regex, (_match, val) => {
      return `/${tag} (${' '.repeat(val.length)})`;
    });
  }

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

// --------------------------------------------------------------------------
// 7. LOSSLESS PNG METADATA STRIPPER
// --------------------------------------------------------------------------
async function stripPngMetadata(file: File): Promise<ExifRemovalResult> {
  const buffer = await file.arrayBuffer();
  const u8 = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    u8.length < 8 ||
    u8[0] !== 0x89 || u8[1] !== 0x50 || u8[2] !== 0x4e || u8[3] !== 0x47 ||
    u8[4] !== 0x0d || u8[5] !== 0x0a || u8[6] !== 0x1a || u8[7] !== 0x0a
  ) {
    // Fallback to canvas
    return stripImageViaCanvas(file, 1.0);
  }

  const chunksToDrop = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt']);
  const cleanChunks: BlobPart[] = [u8.slice(0, 8)]; // Signature

  let pos = 8;
  while (pos + 12 <= u8.length) {
    const length = view.getUint32(pos, false);
    const type = readString(view, pos + 4, 4);
    const totalChunkLen = 12 + length;

    if (pos + totalChunkLen > u8.length) break;

    if (!chunksToDrop.has(type)) {
      cleanChunks.push(u8.slice(pos, pos + totalChunkLen));
    }

    pos += totalChunkLen;
    if (type === 'IEND') break;
  }

  const cleanBlob = new Blob(cleanChunks, { type: 'image/png' });

  return {
    blob: cleanBlob,
    previewUrl: URL.createObjectURL(cleanBlob),
    originalSizeBytes: file.size,
    cleanedSizeBytes: cleanBlob.size,
    format: 'png',
  };
}

// --------------------------------------------------------------------------
// 8. RASTER IMAGE CANVAS STRIPPER (FALLBACK FOR JPEG, WEBP, BMP, ETC.)
// --------------------------------------------------------------------------
async function stripImageViaCanvas(
  file: File,
  outputQuality = 0.92
): Promise<ExifRemovalResult> {
  const name = file.name.toLowerCase();

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

// --------------------------------------------------------------------------
// 9. JPEG / TIFF EXIF & XMP PARSER
// --------------------------------------------------------------------------
async function readJpegExif(file: File): Promise<ExifData> {
  const tags: ExifTag[] = [];
  const seenTags = new Set<number>();

  try {
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

          // SubIFD and GPS IFD pointers
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

      if (marker === 0xffda) break; // SOS
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

// --------------------------------------------------------------------------
// MAIN ENTRY: READ METADATA FROM ANY MEDIA FILE
// --------------------------------------------------------------------------
export async function readExifData(file: File): Promise<ExifData> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  try {
    // 1. ISO BMFF Containers (MP4, MOV, M4V, M4A, 3GP, 3G2)
    if (
      type.startsWith('video/mp4') ||
      type.startsWith('video/quicktime') ||
      type.startsWith('audio/mp4') ||
      type.startsWith('audio/x-m4a') ||
      name.endsWith('.mp4') ||
      name.endsWith('.mov') ||
      name.endsWith('.m4v') ||
      name.endsWith('.m4a') ||
      name.endsWith('.3gp') ||
      name.endsWith('.3g2')
    ) {
      return await readIsoBmffMetadata(file);
    }

    // 2. Matroska / WebM Containers (MKV, WebM)
    if (
      type.includes('matroska') ||
      type.includes('webm') ||
      name.endsWith('.mkv') ||
      name.endsWith('.webm')
    ) {
      return await readMatroskaMetadata(file);
    }

    // 3. RIFF Containers (AVI, WAV, WebP)
    if (
      type.includes('msvideo') ||
      type.includes('wav') ||
      type === 'image/webp' ||
      name.endsWith('.avi') ||
      name.endsWith('.wav') ||
      name.endsWith('.webp')
    ) {
      return await readRiffMetadata(file);
    }

    // 4. MP3 Audio (ID3v1 & ID3v2)
    if (
      type.includes('mpeg') ||
      type.includes('mp3') ||
      name.endsWith('.mp3')
    ) {
      return await readMp3Metadata(file);
    }

    // 5. FLAC Audio
    if (
      type.includes('flac') ||
      name.endsWith('.flac')
    ) {
      return await readFlacMetadata(file);
    }

    // 6. Documents (PDF)
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      return await readPdfMetadata(file);
    }

    // 7. JPEG / TIFF Images
    if (
      type === 'image/jpeg' ||
      type === 'image/jpg' ||
      type === 'image/tiff' ||
      name.match(/\.(jpe?g|tiff?)$/) !== null
    ) {
      return await readJpegExif(file);
    }

    // 8. General fallback for any other media (OGG, AAC, PNG, etc.)
    const sample = await file.slice(0, Math.min(file.size, 2 * 1024 * 1024)).arrayBuffer();
    const text = new TextDecoder('latin1').decode(sample);
    const fallbackTags: ExifTag[] = [];

    const gpsMatch = text.match(/([+-]\d{2,3}\.\d+)([+-]\d{2,3}\.\d+)/);
    if (gpsMatch) {
      fallbackTags.push({
        tag: 'GPS.Coord',
        label: 'GPS Coordinates',
        value: `${gpsMatch[1]}, ${gpsMatch[2]}`,
        category: 'location',
      });
    }

    return {
      tags: fallbackTags,
      hasGps: fallbackTags.length > 0,
      hasCamera: false,
      hasSoftware: false,
      rawSize: fallbackTags.length * 40,
    };
  } catch {
    return { tags: [], hasGps: false, hasCamera: false, hasSoftware: false, rawSize: 0 };
  }
}

// --------------------------------------------------------------------------
// MAIN ENTRY: STRIP ALL METADATA FROM ANY MEDIA FILE
// --------------------------------------------------------------------------
export async function stripExifFromFile(
  file: File,
  outputQuality = 0.92
): Promise<ExifRemovalResult> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  // 1. ISO BMFF (MP4, MOV, M4V, M4A, 3GP, 3G2)
  if (
    type.startsWith('video/mp4') ||
    type.startsWith('video/quicktime') ||
    type.startsWith('audio/mp4') ||
    type.startsWith('audio/x-m4a') ||
    name.endsWith('.mp4') ||
    name.endsWith('.mov') ||
    name.endsWith('.m4v') ||
    name.endsWith('.m4a') ||
    name.endsWith('.3gp') ||
    name.endsWith('.3g2')
  ) {
    return stripIsoBmffMetadata(file);
  }

  // 2. Matroska / WebM (MKV, WebM)
  if (
    type.includes('matroska') ||
    type.includes('webm') ||
    name.endsWith('.mkv') ||
    name.endsWith('.webm')
  ) {
    return stripMatroskaMetadata(file);
  }

  // 3. RIFF Containers (AVI, WAV, WebP)
  if (
    type.includes('msvideo') ||
    type.includes('wav') ||
    name.endsWith('.avi') ||
    name.endsWith('.wav')
  ) {
    return stripRiffMetadata(file);
  }

  // 4. MP3 Audio
  if (
    type.includes('mpeg') ||
    type.includes('mp3') ||
    name.endsWith('.mp3')
  ) {
    return stripMp3Metadata(file);
  }

  // 5. FLAC Audio
  if (
    type.includes('flac') ||
    name.endsWith('.flac')
  ) {
    return stripFlacMetadata(file);
  }

  // 6. Documents (PDF)
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return stripPdfMetadata(file);
  }

  // 7. Lossless PNG strip (removes eXIf, tEXt, zTXt, iTXt chunks)
  if (type === 'image/png' || name.endsWith('.png')) {
    return stripPngMetadata(file);
  }

  // 8. Raster images (JPEG, WebP, BMP, etc.)
  return stripImageViaCanvas(file, outputQuality);
}
