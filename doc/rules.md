# Engineering Guidelines & Development Rules

## Project: imagetooltip (Free Picture & Image Converter)
**Audience:** All engineers, AI coding agents, and contributors  
**Enforcement Level:** Mandatory  
**Version:** 1.0.0  

---

## 1. Core Engineering Principles

These guidelines define the development standards, architectural boundaries, and coding conventions for the `imagetooltip` codebase. Every code addition or refactoring must strictly conform to these rules.

---

## 2. The Golden Rules

### Rule 1: Absolute Zero-Server Processing
> **Never send user file bytes, image blobs, or EXIF metadata across the network.**

- All file conversions, compressions, resizings, crops, and metadata inspections must execute 100% inside the client browser.
- Network requests are strictly forbidden except for:
  1. Fetching external static assets (Google Fonts, static icons).
  2. Netlify static contact form submissions (`POST /` with form text fields only).
  3. Client-side URL image imports (`urlImageFetcher.ts`), which fetch the image directly into memory.

### Rule 2: Strict Memory & Object URL Hygiene
> **Always revoke Object URLs. Prevent memory bloat in long user sessions.**

- Whenever an `ObjectURL` is created via `URL.createObjectURL(blob)`, its lifecycle must be managed:
  ```typescript
  // When replacing or removing an image item:
  if (item.result?.previewUrl) {
    URL.revokeObjectURL(item.result.previewUrl);
  }
  if (item.originalInfo?.previewUrl) {
    URL.revokeObjectURL(item.originalInfo.previewUrl);
  }
  ```
- Clear canvas contexts (`ctx.clearRect(0, 0, width, height)`) and set image buffer references to `null` on modal unmount.
- Limit batch queues to a maximum of 20 images to protect low-RAM mobile browsers from tab crashes.

### Rule 3: Modular Architecture & Component Reuse
> **Do not write duplicate card implementations. Always use centralized components.**

- **`ImageCard.tsx`** is the standard queue item component for Converter, Compressor, and Resizer views.
- **`DropZone.tsx`** is the universal upload and URL-import zone across all tools.
- Maintain workspace layout parity: All tools follow the **Two-Column Workspace** pattern (left sticky controls/queue, right active cards/canvas).

### Rule 4: Design Tokens & Dark Mode Pairing
> **Every background, text, and border class must have an explicit dark mode counterpart.**

- Never use raw un-themed CSS colors (e.g. `style={{ color: 'red' }}`).
- Never write a light-mode class without its dark-mode pair:
  - `bg-white dark:bg-slate-900`
  - `text-slate-900 dark:text-white`
  - `border-slate-200 dark:border-slate-800`
  - `text-slate-500 dark:text-slate-400`
- Keep CTA buttons clear, high-contrast, and free of redundant or distracting icons where clean text conveys higher clarity.

### Rule 5: Internationalization (i18n) First
> **Never hardcode user-facing strings in JSX components.**

- All labels, tooltips, error messages, and guide sections must use `useTranslation`:
  ```typescript
  const { t } = useTranslation();
  // Correct:
  <span>{t('converter.addMore', 'Add More')}</span>
  // Incorrect:
  <span>Add More</span>
  ```
- Translations are organized under `src/i18n.ts` supporting all 10 language dictionaries (`en`, `es`, `fr`, `de`, `pt`, `it`, `ja`, `zh`, `hi`, `ar`).

### Rule 6: Input Sanitization & Security
> **Sanitize all external inputs: filenames, EXIF tags, and contact forms.**

- Output filenames must be sanitized against path traversal and special characters using `sanitizeFilename(name)`:
  ```typescript
  filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  ```
- EXIF tag values must be escaped against script execution before rendering in HTML export templates.
- Forms must implement honeypots (`bot-field`) and client-side hourly token bucket rate limiting (`rateLimit.ts`).

### Rule 7: TypeScript Rigor
> **Zero untyped `any`. Strict null and undefined checks are enforced.**

- Run `npm run lint` (`tsc --noEmit`) to verify zero type errors before submitting changes.
- Use explicit discriminated unions for status (`status: 'idle' | 'processing' | 'done' | 'error'`).
- Image formats are strictly typed using `ImageFormat` (`'webp' | 'jpeg' | 'png' | 'avif' | 'gif' | 'bmp' | 'ico' | 'svg'`).

### Rule 8: Performance & Web Worker Isolation
> **Never block the browser's main thread during heavy media transformations.**

- Heavy image encoding (such as AVIF via libaom) must execute in Web Workers (`avif_enc_mt.worker`).
- Canvas draw operations for large batches must yield execution via `requestAnimationFrame` or `setTimeout(..., 0)` to allow the browser to paint progress updates and handle user interaction.

---

## 3. Git & Commit Message Standards

This project adheres to **Conventional Commits**:
- `feat(scope): ...` — New functional user-facing feature.
- `fix(scope): ...` — Bug fix or correction.
- `style(scope): ...` — UI styling, layout adjustments, typography.
- `perf(scope): ...` — Performance improvements or memory optimizations.
- `refactor(scope): ...` — Code refactoring without changing external behavior.
- `docs(scope): ...` — Documentation updates and guides.
