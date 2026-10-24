# Project Tasks, Roadmap & Feature Backlog

## Project: imagetooltip (Free Picture & Image Converter)
**Tracking Status:** Active  
**Current Milestone:** v1.0.0 Stable Production  
**Last Updated:** October 2026  

---

## 1. Completed Milestones & Changelog

### Phase 1: Core Foundation & Conversion Engine ✅
- [x] Set up React 19, TypeScript 5.8, Vite 8.3, and Tailwind CSS v4 pipeline.
- [x] Implement browser-native canvas drawing and format conversion for JPEG, PNG, and WebP.
- [x] Integrate `@jsquash/avif` with multithreaded WebAssembly workers for high-efficiency AVIF encoding.
- [x] Develop binary encoders for Windows Bitmap (`BMP`) and Windows Icon (`ICO`) generation.
- [x] Build multi-file batch queue system with `JSZip` client-side archive packaging (`imagetooltip-converted.zip`).
- [x] Create universal `DropZone.tsx` supporting drag-and-drop, file browsing, and multi-file selection.

### Phase 2: Compression & Resizing Workspaces ✅
- [x] Build `CompressorView.tsx` with 3 curated presets (`Balanced`, `Max Savings`, `High Quality`).
- [x] Implement Target File Size mode with binary search optimization algorithms (hit exact KB / MB targets).
- [x] Build interactive `CompareSlider.tsx` for side-by-side split screen quality comparison.
- [x] Build `ResizerView.tsx` supporting Pixel (`px`) and Percentage (`%`) dimension scaling.
- [x] Implement aspect ratio locking and predefined ratio shortcuts (`1:1`, `16:9`, `4:3`, `3:2`, `9:16`).
- [x] Support canvas fit modes: `Cover`, `Contain` (with custom letterbox color fill), `Stretch`, and `Fit`.

### Phase 3: Privacy, EXIF Sanitization & Image Editor Modal ✅
- [x] Build deep binary EXIF/IPTC parser (`exifRemover.ts`) to detect GPS coordinates, camera hardware, and timestamps.
- [x] Implement EXIF tag exporter supporting HTML visual reports, CSV spreadsheets, JSON objects, and TXT summaries.
- [x] Build interactive `ImageEditorModal.tsx` supporting custom box cropping, 90° rotations, and horizontal/vertical flips.
- [x] Build `ImagePreviewModal.tsx` for full-resolution image inspection and direct download.
- [x] Build `UrlImageModal.tsx` for importing batch images from direct web URLs via CORS-safe client fetching.

### Phase 4: UI/UX Standardization & Two-Column Workspace Parity ✅
- [x] Extract modular `ImageCard.tsx` component to eliminate redundant card JSX across Converter, Compressor, and Resizer.
- [x] Implement unified **Two-Column Workspace** layout across all tools (Left sticky queue/controls, Right canvas grid).
- [x] Add mobile sticky bottom action bars for convenient one-thumb operation on smartphones.
- [x] Simplify `ExifRemoverView`:
  - Removed duplicate "Add More" and "Clear Queue" buttons from header.
  - Renamed single-item CTA to clean text `Clear` without icons.
  - Aligned `Show IDs` button directly beside the `Clear` CTA.
  - Fixed dark mode contrast and removed unreadable red text in Export EXIF dropdown.

### Phase 5: SEO, Internationalization & Netlify Production Deployment ✅
- [x] Implement 16 canonical SEO routes with programmatic landing page engine (`ToolLandingView.tsx`).
- [x] Configure dynamic `<head>` metadata, canonical URLs, and Schema.org JSON-LD structured data injection.
- [x] Build `scripts/generate-sitemap.js` for automated `sitemap.xml` and `robots.txt` generation during build.
- [x] Set up multi-lingual internationalization (`i18n.ts`) supporting 10 languages with auto-detection.
- [x] Implement Netlify Contact Form with honeypot spam protection and client-side hourly rate limiting (`rateLimit.ts`).
- [x] Verify production build (`npm run build`) passing with zero errors and optimized chunk sizes.

---

## 2. Current Sprint Priorities

- [x] Complete comprehensive documentation suite in `doc/`:
  - `doc/prd.md` — Product Requirements Document
  - `doc/architecture.md` — System Architecture & Technical Specifications
  - `doc/design.md` — Design System & UX Guidelines
  - `doc/seo.md` — SEO Architecture & Management Guide
  - `doc/rules.md` — Engineering Guidelines & Development Rules
  - `doc/memory.md` — Architectural Decision Records & Platform Memory
  - `doc/tasks.md` — Tasks, Roadmap & Feature Backlog
- [ ] Monitor Core Web Vitals (LCP < 1.2s, CLS 0.00, INP < 100ms) on live Netlify deployments.
- [ ] Submit `sitemap.xml` to Google Search Console and verify rich snippet validation.

---

## 3. Future Roadmap & Product Backlog

### Phase 6: PWA & Offline Enhancements (Q1 2027)
- [ ] Add Service Worker (`vite-plugin-pwa`) to cache WebAssembly binaries and UI shell for 100% offline desktop/mobile usage.
- [ ] Add Web App Manifest with custom icons and shortcuts for standalone desktop installation.
- [ ] Add Drag-and-Drop direct folder ingestion (`FileSystemDirectoryEntry`).

### Phase 7: Advanced Image Features (Q2 2027)
- [ ] **SVG Optimizer:** Client-side vector cleanup and minification using WebAssembly SVGO.
- [ ] **Batch Watermarking:** Overlay custom text or PNG logo watermark with adjustable opacity and position grid.
- [ ] **Color Palette Extractor:** Client-side k-means clustering to extract dominant hex palettes from any image.
- [ ] **Multi-page PDF-to-Image Extraction:** Convert document PDF pages into PNG/JPEG image files using `pdf.js`.

### Phase 8: Ecosystem & Companion Extensions (Q3 2027)
- [ ] Manifest V3 Chrome / Edge extension companion for right-click "Convert Image with imagetooltip".
- [ ] WebGPU-accelerated image filters (sharpen, denoise, auto-enhance) running in shader memory.
