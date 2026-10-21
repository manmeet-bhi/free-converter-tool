/**
 * EXIF & Metadata Export Utility
 * Exports detected metadata into HTML, CSV, JSON, and TXT formats.
 */

import { ExifData, ExifTag } from './exifRemover';

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function triggerDownload(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports EXIF metadata as a formatted JSON file.
 */
export function exportExifToJson(sourceFilename: string, exif: ExifData): void {
  const base = sourceFilename.replace(/\.[^.]+$/, '');
  const data = {
    file: sourceFilename,
    exportedAt: new Date().toISOString(),
    tool: 'imagetooltip EXIF Inspector',
    summary: {
      totalTags: exif.tags.length,
      hasGps: exif.hasGps,
      hasCamera: exif.hasCamera,
      hasSoftware: exif.hasSoftware,
      rawMetadataSizeBytes: exif.rawSize,
    },
    tags: exif.tags.map((t) => ({
      tagId: t.tag,
      label: t.label,
      category: t.category,
      value: t.value,
    })),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  triggerDownload(jsonStr, `${sanitizeFilename(base)}_metadata.json`, 'application/json');
}

/**
 * Exports EXIF metadata as a CSV spreadsheet.
 */
export function exportExifToCsv(sourceFilename: string, exif: ExifData): void {
  const base = sourceFilename.replace(/\.[^.]+$/, '');

  const rows: string[] = [];
  rows.push('"Category","Tag ID","Tag Name","Value"');

  for (const tag of exif.tags) {
    const cat = escapeCsv(tag.category.toUpperCase());
    const id = escapeCsv(tag.tag);
    const label = escapeCsv(tag.label);
    const val = escapeCsv(tag.value);
    rows.push(`"${cat}","${id}","${label}","${val}"`);
  }

  const csvContent = '\uFEFF' + rows.join('\r\n'); // BOM for UTF-8 Excel support
  triggerDownload(csvContent, `${sanitizeFilename(base)}_metadata.csv`, 'text/csv;charset=utf-8;');
}

function escapeCsv(val: string): string {
  return val.replace(/"/g, '""');
}

/**
 * Exports EXIF metadata as a clean plain text report.
 */
export function exportExifToTxt(sourceFilename: string, exif: ExifData): void {
  const base = sourceFilename.replace(/\.[^.]+$/, '');
  const divider = '='.repeat(76);
  const subDivider = '-'.repeat(76);

  const lines: string[] = [
    divider,
    `imagetooltip - EXIF Metadata Inspection Report`,
    divider,
    `Source File: ${sourceFilename}`,
    `Export Date: ${new Date().toLocaleString()}`,
    `Total Tags:  ${exif.tags.length}`,
    `GPS Found:   ${exif.hasGps ? 'YES (High Privacy Risk)' : 'None'}`,
    `Camera Info: ${exif.hasCamera ? 'YES' : 'None'}`,
    `Software:    ${exif.hasSoftware ? 'YES' : 'None'}`,
    divider,
    '',
  ];

  const categories: Record<string, ExifTag[]> = {};
  for (const t of exif.tags) {
    const cat = t.category.toUpperCase();
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(t);
  }

  for (const [cat, tags] of Object.entries(categories)) {
    lines.push(`[${cat}] (${tags.length} tags)`);
    lines.push(subDivider);
    for (const t of tags) {
      const label = t.label.padEnd(28, ' ');
      lines.push(`  ${label} : ${t.value} (${t.tag})`);
    }
    lines.push('');
  }

  lines.push(divider);
  lines.push('Generated 100% offline via imagetooltip (https://imagetooltip.com)');
  lines.push(divider);

  triggerDownload(lines.join('\r\n'), `${sanitizeFilename(base)}_metadata.txt`, 'text/plain;charset=utf-8;');
}

/**
 * Exports EXIF metadata as a standalone styled HTML report document.
 */
export function exportExifToHtml(sourceFilename: string, exif: ExifData): void {
  const base = sourceFilename.replace(/\.[^.]+$/, '');

  const rowsHtml = exif.tags
    .map(
      (t) => `
        <tr>
          <td><span class="badge badge-${t.category}">${escapeHtml(t.category.toUpperCase())}</span></td>
          <td><span class="tag-id">${escapeHtml(t.tag)}</span></td>
          <td><strong>${escapeHtml(t.label)}</strong></td>
          <td class="value">${escapeHtml(t.value)}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EXIF Report – ${escapeHtml(sourceFilename)}</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --border: #1f2937;
      --blue: #3b82f6;
      --rose: #f43f5e;
      --emerald: #10b981;
      --amber: #f59e0b;
      --purple: #a855f7;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --text: #0f172a;
        --text-muted: #64748b;
        --border: #e2e8f0;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    .header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 800;
    }
    .header p {
      margin: 0;
      color: var(--text-muted);
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .stat-card {
      background: rgba(125, 125, 125, 0.05);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
    }
    .stat-card .label {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .stat-card .val {
      font-size: 18px;
      font-weight: 800;
    }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    th, td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: rgba(125, 125, 125, 0.05);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 700;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: rgba(125, 125, 125, 0.03);
    }
    .tag-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: var(--text-muted);
      background: rgba(125, 125, 125, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      word-break: break-all;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }
    .badge-location { background: rgba(244, 63, 94, 0.15); color: var(--rose); }
    .badge-camera { background: rgba(59, 130, 246, 0.15); color: var(--blue); }
    .badge-datetime { background: rgba(245, 158, 11, 0.15); color: var(--amber); }
    .badge-settings { background: rgba(168, 85, 247, 0.15); color: var(--purple); }
    .badge-software { background: rgba(16, 185, 129, 0.15); color: var(--emerald); }
    .badge-other { background: rgba(125, 125, 125, 0.15); color: var(--text-muted); }
    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EXIF Metadata Inspection Report</h1>
      <p>File: <strong>${escapeHtml(sourceFilename)}</strong> &bull; Generated: ${new Date().toLocaleString()}</p>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Tags</div>
          <div class="val">${exif.tags.length}</div>
        </div>
        <div class="stat-card">
          <div class="label">GPS Location</div>
          <div class="val" style="color: ${exif.hasGps ? 'var(--rose)' : 'var(--emerald)'}">${exif.hasGps ? '⚠️ Detected' : '✓ Clean'}</div>
        </div>
        <div class="stat-card">
          <div class="label">Camera Hardware</div>
          <div class="val" style="color: ${exif.hasCamera ? 'var(--blue)' : 'var(--text-muted)'}">${exif.hasCamera ? 'Found' : 'None'}</div>
        </div>
        <div class="stat-card">
          <div class="label">Software Tags</div>
          <div class="val" style="color: ${exif.hasSoftware ? 'var(--purple)' : 'var(--text-muted)'}">${exif.hasSoftware ? 'Found' : 'None'}</div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 120px;">Category</th>
            <th style="width: 100px;">Tag ID</th>
            <th style="width: 220px;">Property</th>
            <th>Extracted Value</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Generated 100% in-browser with zero uploads using <a href="https://imagetooltip.com" style="color: var(--blue); text-decoration: none; font-weight: 600;">imagetooltip</a>
    </div>
  </div>
</body>
</html>`;

  triggerDownload(html, `${sanitizeFilename(base)}_metadata.html`, 'text/html;charset=utf-8;');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
