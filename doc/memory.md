# Architectural Decisions & Project Memory (ADR)

## Project: imagetooltip (Free Picture & Image Converter)
**Document Purpose:** Preserves engineering context, rationale behind past architectural decisions, known platform quirks, and lessons learned.  
**Version:** 1.0.0  

---

## 1. Architectural Decision Records (ADR)

### ADR-001: 100% In-Browser Client-Side Processing
- **Context:** Building an online image converter typically involves backend server workers (using ImageMagick, Sharp, or ffmpeg) requiring scalable cloud infrastructure, storage buckets, and high operating costs.
- **Decision:** Build imagetooltip entirely as a client-side web application using HTML5 Canvas, WebAssembly (`@jsquash/avif`), and Web Workers.
- **Consequences:**
  - *Positives:* Zero server infrastructure costs; infinite scalability on static edge CDN (Netlify); absolute user privacy compliance (GDPR/HIPAA/CCPA) since files never leave the browser; zero round-trip upload latency.
  - *Trade-offs:* Processing power depends on the client device's CPU/RAM; iOS Safari enforces cumulative canvas memory limits; very large files (>50MB) require memory monitoring.

---

### ADR-002: Extraction of Modular `ImageCard.tsx`
- **Context:** `ConverterView`, `CompressorView`, and `ResizerView` originally had duplicating JSX markup for image queue cards, leading to code divergence and inconsistent UI bug fixes.
- **Decision:** Extract a single, flexible, modular `ImageCard.tsx` component used across all three image tools.
- **Consequences:**
  - *Positives:* Single point of truth for card layout, image thumbnail display, transparency checkerboard patterns, savings badges, rotate/crop/preview modals, and download triggers.
  - *Trade-offs:* Requires passing tailored event handlers (`onProcessSingle`, `targetDimensions`, `processingLabel`) to accommodate tool-specific behaviors.

---

### ADR-003: Two-Column Workspace Layout Paradigm
- **Context:** The original UI placed upload queues and output downloads vertically below the settings, forcing extensive vertical scrolling when processing 10+ images.
- **Decision:** Implement a modern Two-Column Workspace across all tools once files are loaded:
  - **Left Sticky Sidebar:** Queue summary, quick Add/Clear buttons, format/quality controls, primary batch CTA, and ZIP download button.
  - **Right Canvas Area:** Multi-column grid of image cards or EXIF data panels.
- **Consequences:** Unified user experience across tools; essential controls remain in view at all times without scrolling.

---

### ADR-004: Native HTML5 History Routing Without External Router Libraries
- **Context:** Standard SPAs often pull in `react-router-dom` (>30KB minified) for simple route changes and query params.
- **Decision:** Implement routing natively using the browser's `window.history.pushState` and `window.addEventListener('popstate')`.
- **Consequences:**
  - *Positives:* Reduced bundle size by ~35KB; seamless canonical URL mapping; instant transitions; direct hook into `updateRouteSeo()`.
  - *Trade-offs:* Developers must register new slugs in `SLUG_TO_TAB` and `TAB_TO_SLUG` mapping dictionaries in `App.tsx`.

---

### ADR-005: WebAssembly AVIF Encoding via `@jsquash/avif`
- **Context:** Standard browser canvas does not natively support encoding into AVIF via `canvas.toBlob('image/avif')` across older browsers, yet AVIF offers up to 50% better compression than JPEG.
- **Decision:** Integrate `@jsquash/avif` to run libaom compiled to WebAssembly inside dedicated Web Workers.
- **Consequences:** Enables universal in-browser AVIF encoding even in browsers lacking native encoder support. Fallback to WebP/JPEG is automatically triggered if WebAssembly fails.

---

### ADR-006: Client-Side Rate Limiting for Netlify Contact Forms
- **Context:** Static site contact forms are vulnerable to automated bot spam. Traditional Google reCAPTCHAs are privacy-invasive and hurt Lighthouse performance scores.
- **Decision:** Implement a dual-layer defense:
  1. A hidden honeypot field (`bot-field`) ignored by real users but filled by automated scrapers.
  2. A client-side hourly token bucket (`rateLimit.ts` in `localStorage`) limiting submissions to 5 per hour per device.
- **Consequences:** Effective spam prevention without annoying puzzle challenges or tracking cookies.

---

### ADR-007: EXIF Inspector & Multi-Format Exporter
- **Context:** Users removing metadata often need to audit or archive what tags existed prior to stripping.
- **Decision:** Develop a deep binary parsing engine (`exifRemover.ts`) and multi-format exporter (`exifExporter.ts`) enabling one-click export to HTML, CSV, JSON, and TXT.
- **Consequences:** Transforms the EXIF tool from a simple black-box cleaner into a comprehensive privacy audit tool.

---

### ADR-008: Header Cleanliness & Tool Parity
- **Context:** In `ExifRemoverView`, duplicate "Add More" and "Clear Queue" buttons were present in the view header while already existing inside the left sidebar header, creating visual clutter.
- **Decision:** Remove the redundant header buttons in `ExifRemoverView`, simplify the single-item CTA to clean text `Clear` without icons, align `Show IDs` directly beside it, and ensure high-contrast colors in the Export dropdown for dark mode.
- **Consequences:** Cleaner visual hierarchy; consistent user experience matching Converter, Compressor, and Resizer views.

---

## 2. Known Platform Quirks & Gotchas

1. **iOS Safari Canvas Memory Limit:**
   - *Issue:* iOS Safari limits total cumulative canvas memory to ~288 megapixels. Rapidly processing multiple 48MP smartphone photos can cause tab reloads.
   - *Mitigation:* Always set canvas width/height to 0 and revoke URLs upon card removal.
2. **Animated GIF & WebP Canvas Flattening:**
   - *Issue:* Standard 2D Canvas `drawImage` extracts only the first frame of an animated GIF or animated WebP.
   - *Mitigation:* Explicitly documented in FAQs and tool descriptions that canvas conversion extracts the primary frame.
3. **CORS on URL Image Imports:**
   - *Issue:* Browsers block `fetch(imageUrl)` from third-party domains lacking `Access-Control-Allow-Origin: *`.
   - *Mitigation:* Provide helpful error messages when an external server blocks direct client-side fetching, and instruct users to save the image locally or use CORS-enabled image hosts.
4. **Tailwind v4 `@theme` & Dark Mode:**
   - *Issue:* Tailwind v4 manages dark mode differently from v3 `class` strategies.
   - *Mitigation:* Using native CSS class selectors (`.dark`) and CSS custom property theme tokens in `index.css`.
