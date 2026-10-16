/**
 * ZIP Archive Exporter using JSZip
 * Bundles processed images into a downloadable archive.
 */

import JSZip from 'jszip';

export interface FileToZip {
  filename: string;
  blob: Blob;
}

export async function createZipArchive(
  files: FileToZip[],
  zipFilename = 'imagekit-processed-images.zip',
  onProgress?: (percent: number) => void
): Promise<void> {
  if (files.length === 0) return;

  const zip = new JSZip();

  // Deduplicate filenames if needed
  const nameCounts = new Map<string, number>();

  for (const file of files) {
    let name = file.filename;
    if (nameCounts.has(name)) {
      const count = nameCounts.get(name)! + 1;
      nameCounts.set(name, count);
      const dotIndex = name.lastIndexOf('.');
      if (dotIndex !== -1) {
        name = `${name.slice(0, dotIndex)} (${count})${name.slice(dotIndex)}`;
      } else {
        name = `${name} (${count})`;
      }
    } else {
      nameCounts.set(name, 0);
    }

    zip.file(name, file.blob);
  }

  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  downloadBlob(content, zipFilename);
}

/**
 * Downloads a single Blob to the client device
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
