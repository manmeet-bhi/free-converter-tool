# Product Requirements Document (PRD)

## Project: imagetooltip (Free Picture & Image Converter)
**Domain:** [https://free-picture-converter.netlify.app](https://free-picture-converter.netlify.app)  
**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** October 2026  

---

## 1. Executive Summary

**imagetooltip** is a high-performance, **100% client-side** web application designed to convert, compress, resize, edit, and sanitize images and metadata directly within the user's browser.

Unlike traditional online conversion websites that upload sensitive personal photos or corporate documents to third-party cloud servers (introducing latency, bandwidth costs, storage quotas, and data leak hazards), imagetooltip performs all image transformations using browser-native **HTML5 Canvas**, **WebAssembly (WASM)**, and **Web Workers**. Files never leave the user's device, ensuring maximum speed and total privacy.

---

## 2. Problem Statement & Value Proposition

### 2.1 The Problems with Traditional Online Converters
- **Privacy & Security Risks:** Millions of users unknowingly upload medical records, IDs, confidential documents, and personal photos to unverified cloud servers.
- **Data Caps & Paywalls:** Competing platforms impose strict file-size limits (e.g., 5MB or 10MB), artificial queues, and subscription paywalls for batch processing.
- **Slow Round-Trip Latency:** Uploading heavy 20MB RAW or JPEG files over slow internet connections wastes bandwidth and time.
- **Aggressive Advertisements & Dark Patterns:** Cluttered interfaces, fake "Download" buttons, malware lures, and cookie trackers degrade user trust.

### 2.2 The imagetooltip Solution
1. **Absolute Privacy:** 100% in-browser processing via WebAssembly and Canvas APIs. No uploads, no storage, no trackers.
2. **Zero Wait Times:** Instantaneous local transformation bypassing network latency.
3. **Generous Batch Processing:** Clean batch queue supporting up to 20 images (up to 50MB each) simultaneously.
4. **All-in-One Utility Suite:** Seamlessly switch between Image Conversion, Intelligent Compression, Canvas Dimension Resizing, and EXIF Metadata Scrubbing.
5. **No Registration Required:** Unlimited free usage with zero accounts, logins, or fees.

---

## 3. Target Audience & Personas

| Persona | Primary Needs | Key Features Used |
| :--- | :--- | :--- |
| **Web Developers & Designers** | Convert PNG/JPG to WebP/AVIF, compress assets to specific KB targets, preserve alpha transparency. | Converter, Compressor, AVIF WASM, Custom Quality, Batch ZIP export. |
| **Privacy-Conscious Individuals** | Strip GPS coordinates, device serials, and timestamps from photos before posting to social media. | EXIF & Metadata Remover, Tag Audit & Export (HTML, CSV, JSON, TXT). |
| **Photographers & Creators** | Quick resizing, cropping, aspect ratio locking, format conversion without opening heavy software like Photoshop. | Resizer, Built-in Crop/Rotate/Flip Editor Modal, Preview Modal. |
| **Students & Job Applicants** | Compress resume photos, document scans, or portal uploads to strict file limits (e.g. `< 200 KB`). | Target File Size Compressor, Aspect Ratio Resizer. |
| **E-Commerce Sellers** | Standardize thousands of product images to identical canvas dimensions with padded background letterboxing. | Resizer (Contain Mode with custom background color), Batch Conversion. |

---

## 4. Product Modules & Functional Specifications

### 4.1 Universal Image Converter (`/converter`)
- **Supported Input Formats:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.bmp`, `.svg`, `.ico`.
- **Supported Output Formats:** WebP, AVIF (via WebAssembly), PNG, JPG, GIF, BMP, ICO.
- **Batch Processing:** Up to 20 files per session.
- **Customization Options:**
  - Per-image or global target format selection.
  - Variable quality slider (1% to 100%).
  - Preserve or flatten transparency with custom color fill.
  - Per-card quick rotate (90° clockwise), crop, and full-resolution preview.
- **Exporting:** Single-file direct download or one-click `imagetooltip-converted.zip` archive generation.

### 4.2 Intelligent Image Compressor (`/image-compressor`)
- **Compression Modes:**
  1. **Balanced Preset:** Standard quality (~75-80%) optimizing visual fidelity vs file weight reduction.
  2. **Max Savings Preset:** Aggressive compression (~50-60%) for mobile-first web delivery.
  3. **High Quality Preset:** Minimal loss (~90-95%) for photography and print.
  4. **Target File Size Mode (KB/MB):** Automatic iterative binary search algorithms to hit strict user-defined byte limits (e.g., exactly 250 KB).
- **Interactive Visual Comparison Slider:** Side-by-side split screen showing before vs after quality with zoom and pan.
- **Savings Analytics:** Real-time display of percentage reduced and exact bytes saved.

### 4.3 Dimension & Aspect Ratio Resizer (`/resize-image`)
- **Units:** Pixels (`px`) or Percent (`%`).
- **Aspect Ratio Locking:** Auto-calculates proportional dimensions when constrained.
- **Preset Quick Ratios:** `1:1` Square, `16:9` Widescreen, `4:3` Standard, `3:2` Photography, `9:16` Story/Reel.
- **Fit & Canvas Modes:**
  - **Cover:** Fills dimensions while cropping excess.
  - **Contain / Letterbox:** Preserves full image, letterboxing borders with user-selected background color (or transparent canvas).
  - **Stretch:** Forces exact target dimensions without padding or cropping.
  - **Fit (Canvas Crop):** Automatically scales down preserving boundaries.
- **Output Re-encoding:** Ability to simultaneously resize and convert formats.

### 4.4 EXIF & Metadata Remover (`/exif-remover`)
- **Inspection Engine:** Deep binary parsing of EXIF, TIFF, GPS, IPTC, and container header tags.
- **Sensitive Tag Detection:** Highlights embedded GPS coordinates (latitude, longitude, altitude), camera serial numbers, device model, software/OS, and original capture timestamps.
- **Permanent Sanitization:** Strips all identifying metadata chunks, re-encoding safe, structure-only pixels.
- **Export Inspection Reports:** Download detected metadata as `.html` (styled visual audit), `.csv` (spreadsheet), `.json` (developer object), or `.txt` (plain text).
- **Action Controls:** Clean, icon-free `Clear` single CTA, `Show IDs` toggle, and batch `Clear All Metadata`.

### 4.5 Built-in Image Editor Modal
- **Trigger:** Accessible from any card via the "Edit" button.
- **Capabilities:**
  - Interactive box crop with draggable handles and aspect ratio constraints (`Free`, `1:1`, `4:3`, `16:9`, `3:2`).
  - Rotation (90°, 180°, 270° increments).
  - Horizontal flip and vertical flip.
  - Non-destructive client canvas preview with live dimensions calculation.

### 4.6 URL Image Import Modal
- **Trigger:** "Import from URL" button in upload zones.
- **Functionality:** Accepts multiple direct image URLs (one per line) and imports them directly into the queue via CORS-safe client-side fetching with fallback handling.

### 4.7 Internationalization (i18n)
- **Supported Languages:** English (`en`), Spanish (`es`), French (`fr`), German (`de`), Portuguese (`pt`), Italian (`it`), Japanese (`ja`), Chinese (`zh`), Hindi (`hi`), Arabic (`ar` with RTL layout support).
- **Automatic Language Detection:** Detects user browser language preference with persistent localStorage override.

### 4.8 Netlify Contact Form
- **Form Fields:** Name, Email, Inquiry Subject, Message.
- **Anti-Spam Safeguards:** Hidden honeypot field (`bot-field`) and hourly IP/browser rate-limiting (`localStorage` token bucket) ensuring spam protection without intrusive CAPTCHAs.

---

## 5. Non-Functional Requirements

### 5.1 Performance & Core Web Vitals (CWV)
- **Largest Contentful Paint (LCP):** `< 1.2s` on standard mobile and desktop connections.
- **Cumulative Layout Shift (CLS):** `0.00` (strictly reserved layout spaces, no dynamic ad shifts).
- **Interaction to Next Paint (INP):** `< 100ms` (heavy WASM encoding dispatched to Web Workers and requestAnimationFrame chunks).
- **Bundle Size:** Gzipped main application bundle `< 220 KB`.

### 5.2 Security & Data Privacy
- **Strict Client-Side Guarantee:** Zero image byte uploads to any remote server or cloud bucket.
- **Content Security Policy (CSP):** Disallow unauthorized script injections or external tracking pixels.
- **Memory Safety:** Explicit revocation of all created Object URLs (`URL.revokeObjectURL`) upon card removal, modal closure, or batch reset.
- **Sanitized Downloads:** Output filenames sanitized against path traversal or malicious characters.

### 5.3 Accessibility (a11y)
- **WCAG 2.1 Level AA Compliance.**
- Accessible contrast ratios (`> 4.5:1` for regular text, `> 3:1` for large text and controls).
- Full keyboard operability (`Tab`, `Enter`, `Escape` to dismiss modals, `Space` to toggle selections).
- ARIA live announcements for progress bars, conversion statuses, and error messages.

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

1. **User Privacy:** 100% of image conversions performed locally with zero server image storage.
2. **Speed:** Average conversion time under 300ms per standard image on mid-tier hardware.
3. **SEO Ranking:** Top 3 organic ranking for high-intent conversion terms (`png to webp`, `free picture converter`, `exif remover`).
4. **Bounce Rate:** Maintained below 35% through high-clarity drop zones and immediate interactive feedback.
5. **Satisfaction & Retention:** Zero account barriers leading to high repeat bookmark usage.
