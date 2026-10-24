# Design System & User Experience (UX) Specification

## Project: imagetooltip (Free Picture & Image Converter)
**Design Philosophy:** Modern, Hyper-Functional, Dark-Mode First, Zero-Friction Utility  
**Typography:** Plus Jakarta Sans (UI) & JetBrains Mono (Technical/Data)  
**Layout Model:** Two-Column Workspace with Mobile Sticky Action Bars  
**Version:** 1.0.0  

---

## 1. Design Philosophy & Brand Identity

imagetooltip is designed to feel like an installable native desktop utility running seamlessly in a web browser. It eschews the cluttered, ad-heavy, and confusing interfaces common to legacy file converters in favor of a clean, high-contrast, minimalist workspace.

### Core Visual Principles
1. **Clarity Over Clutter:** Interface elements only appear when relevant. Unnecessary headers, promotional banners, or duplicate buttons are eliminated.
2. **Instant Feedback:** Drag-over states, conversion progress animations, real-time file size calculations, and celebratory micro-interactions keep users engaged.
3. **Ergonomic Hierarchy:** Primary calls to action (CTAs) are large, prominent, and thumb-friendly on mobile devices.
4. **Dual-Theme Excellence:** Full, meticulously crafted dark mode and light mode support with high contrast and zero eye fatigue.

---

## 2. Color Palette & Design Tokens

imagetooltip uses curated Tailwind CSS color scales paired with distinct semantic tool accents to distinguish functions:

### 2.1 Neutral Base Tokens
| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| **Page Background** | `slate-50` (`#f8fafc`) | `slate-950` (`#020617`) | Global page background |
| **Card Surface** | `white` (`#ffffff`) | `slate-900` (`#0f172a`) | Cards, panels, modals |
| **Surface Hover** | `slate-100` (`#f1f5f9`) | `slate-800` (`#1e293b`) | Interactive hover states |
| **Borders** | `slate-200` (`#e2e8f0`) | `slate-800` (`#1e293b`) | Subtle dividers and card outlines |
| **Text Primary** | `slate-900` (`#0f172a`) | `white` (`#ffffff`) | Headings and primary labels |
| **Text Secondary**| `slate-600` (`#475569`) | `slate-400` (`#94a3b8`) | Subtitles, descriptions, captions |
| **Code / Metadata**| `slate-500` (`#64748b`) | `slate-300` (`#cbd5e1`) | Bytes, dimensions, EXIF tag keys |

### 2.2 Semantic Tool Accents
Each core tool features an assigned accent color to create immediate cognitive recognition:

```
┌─────────────────────────────────────────────────────────────┐
│ Tool Accent Identity                                        │
├────────────────────┬─────────────────┬──────────────────────┤
│ Tool               │ Primary Color   │ Tailwind Scale       │
├────────────────────┼─────────────────┼──────────────────────┤
│ Image Converter    │ Vibrant Blue    │ blue-600 / blue-400  │
│ Image Compressor   │ Emerald Green   │ emerald-600 / 400    │
│ Image Resizer      │ Cyan / Sky      │ cyan-600 / cyan-400  │
│ EXIF Remover       │ Rose / Crimson  │ rose-600 / rose-400  │
└────────────────────┴─────────────────┴──────────────────────┘
```

---

## 3. Typography Hierarchy

Fonts are loaded from Google Fonts via preconnected links in `index.html`:
- **UI Font:** `Plus Jakarta Sans` — Clean, modern humanist sans-serif offering superior legibility at small sizes.
- **Data & Monospace Font:** `JetBrains Mono` — Crisp monospace typeface used for file sizes, dimensions, percentage savings, and raw EXIF IDs.

### Typography Scale
- **Display Hero (`h1`):** `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight`
- **Section Heading (`h2`):** `text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white`
- **Card Heading (`h3`):** `text-base sm:text-lg font-bold text-slate-900 dark:text-white`
- **Body Regular:** `text-sm text-slate-600 dark:text-slate-300 leading-relaxed`
- **Technical Specs:** `text-xs font-mono font-semibold`
- **Micro Badges:** `text-[10px] sm:text-[11px] font-bold uppercase tracking-wider`

---

## 4. The Two-Column Workspace Paradigm

Once files are added to the application, the view transitions smoothly into an optimized Two-Column Workspace:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Header (Brand, Navigation Links, Language Switcher, Theme Toggle)          │
├────────────────────────────────┬───────────────────────────────────────────┤
│ LEFT COLUMN: Sticky Sidebar    │ RIGHT COLUMN: Active Canvas / Cards Grid  │
│ ────────────────────────────── │ ───────────────────────────────────────── │
│ • Header (Count, + Add, Clear) │ • ImageCard Grid (Responsive 1/2/3 cols)  │
│ • Scrollable queue list items  │ • Individual Image Preview & Thumbnail    │
│ • Global batch settings:       │ • Dimensions & File Size Before / After   │
│   - Target format selector     │ • Action buttons: Rotate, Crop, Download  │
│   - Quality / Compression      │ • Progress animation bar during active    │
│   - Dimensions & fit modes     │   processing                              │
│ • Primary Batch Action CTA     │ • Empty state fallback illustration       │
│ • "Download All as ZIP" CTA    │                                           │
└────────────────────────────────┴───────────────────────────────────────────┘
```

### Layout Responsiveness
- **Desktop (`lg` >= 1024px):** Fixed-width left sidebar (320px–380px) stays sticky during scroll; right canvas expands to fill remaining space with a responsive multi-column grid.
- **Tablet (`md` 768px–1023px):** Two columns scale gracefully; left sidebar controls collapse into expandable accordions if needed.
- **Mobile (`< 768px`):** Single column stack. A **Mobile Sticky Bottom Action Bar** fixes to the bottom of the viewport with primary action CTAs and a drawer trigger for settings.

---

## 5. Component Design Specifications

### 5.1 `DropZone.tsx`
- **Empty State:** Dashed border (`border-2 border-dashed border-slate-300 dark:border-slate-700`), hover drag-over pulse animation (`scale-[1.01] border-blue-500 bg-blue-50/50 dark:bg-blue-950/20`).
- **Call-to-Action:** Prominent "Select Files" button alongside "Import from URL" secondary button.
- **Micro-copy:** Lists maximum file size (50MB) and format badges (`JPG, PNG, WebP, AVIF, GIF, SVG, BMP, ICO`).

### 5.2 Modular `ImageCard.tsx`
- **Header:** Checkbox for selective batch processing, truncated file name with tooltip, remove button (`X`).
- **Media Preview:** Contained thumbnail preview with dark checkerboard pattern behind transparent PNG/WebP images.
- **Details Strip:** Original dimensions vs target dimensions; original file size vs processed file size.
- **Savings Badge:** Emerald pill displaying percentage reduced (e.g. `-64%`) or amber pill for size increases.
- **Card Action Bar:**
  - `Rotate`: Instant 90° clockwise canvas rotation.
  - `Edit`: Opens interactive `ImageEditorModal`.
  - `Preview`: Opens full-resolution `ImagePreviewModal`.
  - `Process / Download`: Dedicated action button for single-item workflow.

### 5.3 `ImageEditorModal.tsx`
- **Canvas Viewport:** Scaled viewport preserving image aspect ratio.
- **Cropping Handles:** Draggable corner and edge handles with semi-transparent dark overlay.
- **Controls Toolbar:**
  - Aspect Ratio Presets: `Free`, `1:1`, `4:3`, `16:9`, `3:2`.
  - Transformations: Rotate Clockwise, Rotate Counter-Clockwise, Flip Horizontal, Flip Vertical.
  - Action CTAs: "Cancel" (discards changes) and "Apply Changes" (re-renders item in queue).

### 5.4 `CompareSlider.tsx`
- **Interaction:** Draggable divider bar with handle icon allowing interactive split-view comparison between Original Image (Left) and Compressed/Converted Image (Right).
- **Labels:** Floating badges displaying "Original" vs "Compressed" with live file sizes.

---

## 6. Micro-Interactions & Feedback Design

1. **Processing Spinners:** Smooth rotating icons (`animate-spin`) accompanied by descriptive phase labels (e.g., `"Resizing canvas dimensions to 1920×1080 px..."` or `"Reading EXIF tags & GPS coords..."`).
2. **Confetti Burst:** When a batch conversion completes successfully, `canvas-confetti` generates a subtle celebration animation from the bottom of the screen.
3. **Active State Scaling:** All primary buttons feature `active:scale-95` or `active:scale-98` for tactile button press feedback.
4. **Copy Feedback:** One-click copy buttons in EXIF exporter or URL modal display `"Copied!"` confirmation for 2 seconds.

---

## 7. Accessibility (a11y) & Inclusivity

- **Visible Focus Rings:** All buttons, inputs, selects, and checkboxes maintain clear `focus:ring-2 focus:ring-blue-500` outlines.
- **Semantic HTML5:** Native `<button>`, `<select>`, `<input>`, `<article>`, `<main>`, `<header>`, and `<footer>` elements are strictly used.
- **Keyboard Navigation:** Modals trap focus and listen for `Escape` to close. Checkboxes toggle via `Space`.
- **Screen Reader Support:** All icon-only buttons include descriptive `aria-label` and `title` tags (e.g., `aria-label="Download clean file"`).
