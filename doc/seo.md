# Search Engine Optimization (SEO) Architecture & Management Guide

## Project: imagetooltip (Free Picture & Image Converter)
**Production Site URL:** [https://free-picture-converter.netlify.app](https://free-picture-converter.netlify.app)  
**Configuration File:** `src/config/seo.ts`  
**Sitemap Generator:** `scripts/generate-sitemap.js`  
**Version:** 1.0.0  

---

## 1. Overview & Strategy

imagetooltip is engineered for organic search dominance in the high-intent image conversion, compression, and metadata cleaning categories. Rather than relying solely on a generic home page, the application deploys:
1. **Dedicated Programmatic Landing Pages:** Tailored landing pages for specific high-volume conversion pairs (e.g. `/png-to-jpg`, `/webp-to-png`, `/png-to-ico`).
2. **Dynamic HTML5 Head Synchronization:** Client-side updates to `<title>`, `<meta description>`, `<link rel="canonical">`, and `<script type="application/ld+json">` on every route transition.
3. **Automated Static Build Artifacts:** `public/sitemap.xml` and `public/robots.txt` generated automatically during every `npm run build`.
4. **Rich Results Eligibility:** Full Schema.org JSON-LD markup qualifying pages for Google SoftwareApplication, Breadcrumbs, and FAQ rich snippets.

---

## 2. Published SEO Landing Page Routes Matrix

The sitemap and route engine maintain 16 primary indexable routes:

| Route Path | Primary Target Keyword | Tool Preset | Priority | Changefreq |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Free Picture & Image Converter | Home Hub | `1.0` | Daily |
| `/converter` | Online Image Converter | Universal Converter | `0.9` | Daily |
| `/png-to-jpg` | Convert PNG to JPG Online | Converter (JPEG preset) | `0.9` | Weekly |
| `/jpg-to-png` | Convert JPG to PNG Online | Converter (PNG preset) | `0.9` | Weekly |
| `/png-to-webp` | Convert PNG to WebP Online | Converter (WebP preset) | `0.9` | Weekly |
| `/webp-to-png` | Convert WebP to PNG Online | Converter (PNG preset) | `0.9` | Weekly |
| `/jpg-to-webp` | Convert JPG to WebP Online | Converter (WebP preset) | `0.9` | Weekly |
| `/webp-to-jpg` | Convert WebP to JPG Online | Converter (JPEG preset) | `0.9` | Weekly |
| `/png-to-ico` | Convert PNG to ICO Favicon | Converter (ICO preset) | `0.85` | Weekly |
| `/image-compressor`| Online Image Compressor | Image Compressor | `0.9` | Weekly |
| `/resize-image` | Online Image Resizer | Image Resizer | `0.85` | Weekly |
| `/exif-remover` | EXIF & Metadata Remover | EXIF Remover | `0.85` | Weekly |
| `/faq` | Image Conversion FAQ | Knowledge Base | `0.6` | Monthly |
| `/about` | About imagetooltip | Corporate Mission | `0.5` | Monthly |
| `/contact` | Contact Us & Support | Netlify Form | `0.5` | Monthly |
| `/privacy` | Privacy Policy | Legal Privacy View | `0.3` | Monthly |

---

## 3. Configuring the Production Domain

All canonical links, Open Graph share tags, JSON-LD schemas, and the sitemap dynamically inherit the central `SITE_URL`.

### In `src/config/seo.ts`:
```typescript
export const SITE_URL = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? import.meta.env.VITE_SITE_URL
    : 'https://free-picture-converter.netlify.app'
).replace(/\/$/, '');
```

### Changing the Domain:
- **Local Development / Preview:**
  Add to `.env`:
  ```bash
  VITE_SITE_URL="https://yourcustomdomain.com"
  ```
- **Netlify Dashboard:**
  Under **Site Configuration** > **Environment variables**, set `VITE_SITE_URL` to your production domain. On the next deploy, the sitemap and metadata will automatically target that domain.

---

## 4. Structured Data (JSON-LD) Implementation

imagetooltip automatically generates and injects valid Schema.org JSON-LD scripts into `<head>`:

### 4.1 `WebApplication` Schema
Identifies the tool as a browser multimedia application operating at zero cost:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "imagetooltip",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "All modern browsers (Chrome, Edge, Firefox, Safari)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

### 4.2 `FAQPage` Schema
Automatically compiled whenever a view or landing page contains FAQs, qualifying the route for Google FAQ expandable rich snippets in search results:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is my data private when converting files?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. imagetooltip processes all images 100% inside your browser using client-side WebAssembly and Canvas APIs. Your files are never uploaded to any server."
      }
    }
  ]
}
```

### 4.3 `BreadcrumbList` Schema
Establishes clear hierarchy (`Home > Tools > [Active Tool]`), enhancing breadcrumb display in search engine result pages (SERPs).

---

## 5. Automated Build Pipeline: Sitemap & Robots.txt

The build script `scripts/generate-sitemap.js` is triggered automatically prior to every Vite compilation:
```bash
# Build production bundle and generate sitemap.xml & robots.txt
npm run build

# Standalone sitemap generation
npm run build:sitemap
```

### Output: `public/robots.txt`
```
User-agent: *
Allow: /

# Sitemap Index
Sitemap: https://free-picture-converter.netlify.app/sitemap.xml
```

---

## 6. How to Add a New Conversion Landing Page (5 Steps)

Suppose you wish to create a dedicated high-intent landing page for **SVG to PNG** (`/svg-to-png`):

### Step 1: Add Route Identifier in `src/types.ts`
```typescript
export type ActiveTab = 
  | ... existing tabs
  | 'svg-to-png';
```

### Step 2: Register Metadata in `src/config/seo.ts`
```typescript
'/svg-to-png': {
  slug: '/svg-to-png',
  title: 'SVG to PNG Converter – Convert Vector SVG to High-Res PNG | imagetooltip',
  description: 'Convert scalable vector SVG graphics to high-resolution PNG images with transparent backgrounds directly in your browser. 100% free and private.',
  keywords: ['svg to png', 'convert svg to png', 'vector to png converter', 'svg to transparent png'],
  h1: 'Convert SVG to PNG Online in High Resolution',
  canonical: `${SITE_URL}/svg-to-png`,
  changefreq: 'weekly',
  priority: 0.85,
  isIndexable: true,
},
```

### Step 3: Add Educational & FAQ Content in `src/config/landingPages.ts`
```typescript
'svg-to-png': {
  slug: '/svg-to-png',
  toolType: 'converter',
  targetFormat: 'png',
  acceptedFormats: ['.svg'],
  badge: 'Vector to Raster',
  h1: 'Convert SVG to PNG Online',
  intro: 'Render sharp vector SVGs into high-resolution PNGs with crisp transparency and custom canvas scaling.',
  sourceFormatName: 'SVG',
  targetFormatName: 'PNG',
  howToSteps: [ ... ],
  benefits: [ ... ],
  faqs: [ ... ],
  relatedTools: [ ... ],
},
```

### Step 4: Map Route in `src/App.tsx`
Add `/svg-to-png` to `SLUG_TO_TAB` and `TAB_TO_SLUG`.

### Step 5: Update `scripts/generate-sitemap.js`
Add `{ path: '/svg-to-png', priority: '0.85', changefreq: 'weekly' }` to the `routes` array.

Run `npm run build` to verify the build and generate the updated sitemap.

---

## 7. Google Search Console (GSC) Setup & Verification

1. **Access GSC:** Navigate to [search.google.com/search-console](https://search.google.com/search-console).
2. **Add Property:** Enter `https://free-picture-converter.netlify.app` under **URL prefix**.
3. **Verify Ownership:** Choose **HTML tag** method. Add your token to Netlify environment variables:
   ```bash
   VITE_GOOGLE_SITE_VERIFICATION="your-verification-code"
   ```
4. **Submit Sitemap:** In GSC sidebar, navigate to **Sitemaps**, type `sitemap.xml`, and click **Submit**.
5. **Inspect & Request Indexing:** Use the URL Inspection tool to verify high-priority routes (`/`, `/converter`, `/image-compressor`, `/resize-image`, `/exif-remover`, `/png-to-jpg`) and submit for indexing.

---

## 8. Core Web Vitals & Search Ranking Factors

- **Zero Layout Shifts (CLS = 0.00):** Fixed-dimension placeholders avoid shifting content when image thumbnails load.
- **Fast LCP (< 1.2s):** Inline SVG logos and CSS-only loading states ensure instant first paints.
- **Minimal JavaScript Latency (INP < 100ms):** Heavy image encoding runs inside Web Workers, preventing main-thread input delays.
- **Mobile Friendliness:** High tap target sizes (`>= 44px`), responsive font sizes, and thumb-friendly sticky action bars.
