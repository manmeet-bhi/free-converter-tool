# ImageKit – In-Browser Image Converter & Compressor

ImageKit is a fast, 100% private, client-side web utility for converting, compressing, and resizing images directly in your browser. All image transformations, decoding, and encoding run locally using standard HTML5 Canvas, `createImageBitmap`, binary ArrayBuffers, and custom TypeScript encoders with **zero server uploads**.

---

## ✨ Features

- **Multi-Format Converter**:
  - **Inputs**: JPG/JPEG, PNG, WebP, GIF (static frame), SVG (sanitized), BMP, ICO.
  - **Outputs**: WebP, JPEG/JPG, PNG, BMP (built-in 24-bit RGB encoder), ICO (built-in 32-bit favicon encoder).
  - Batch conversion with custom filenames, matte background fill for non-alpha formats, and ZIP bundle export via JSZip.
- **Smart Compressor**:
  - Target file size binary search compression (e.g. compress to exact target like 250 KB).
  - Compression presets: Maximum, Balanced, High Quality, and Custom.
  - Side-by-side interactive before/after split comparison slider.
- **Image Resizer**:
  - Pixel dimensions, percentage scaling, and aspect ratio locking.
  - Built-in social media and display presets (Instagram, TikTok, Twitter/X, YouTube thumbnails, Facebook, Full HD, 4K, Favicons).
- **Comprehensive Informational & Legal Pages**:
  - Dedicated pages for About Us, Contact Us, Privacy Policy, Terms of Service, and Cookie Policy.
- **URL Slug Routing**:
  - Clean client-side routes: `/home`, `/converter`, `/compressor`, `/resizer`, `/format`, `/about`, `/contact`, `/privacy`, `/terms`, `/cookie`.
- **Preloader & Lightweight Animations**:
  - Zero-overhead CSS preloader and micro-animations for high performance.
- **Google Analytics & AdSense Ready**:
  - Pre-configured script hooks in `index.html` and responsive `AdBanner` component.

---

## 🚀 Running Locally

### Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 1. Install Dependencies
```bash
npm install
```
*(If encountering any legacy peer dependency mismatches with third-party sub-packages, use `npm install --legacy-peer-deps`)*

### 2. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Production Build & Preview
```bash
# Build the optimized production bundle
npm run build

# Preview the production build locally
npm run preview

# Cross-platform clean
npm run clean
```

---

## 🌐 Deploying to Netlify

The project is pre-configured for Netlify deployment with `netlify.toml` and `public/_redirects`:

1. **Push to GitHub / GitLab / Bitbucket**:
   - Connect the repository in the [Netlify Dashboard](https://app.netlify.com).
2. **Build Settings** (detected automatically via `netlify.toml`):
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. **Manual Deploy (Drag & Drop)**:
   - Run `npm run build` locally.
   - Drag and drop the generated `dist/` folder into the Netlify Drop area.

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Packaging**: JSZip (ZIP archives), canvas-confetti (UI feedback)


