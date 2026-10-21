# Complete SEO Management Guide for imagetooltip

Welcome to the comprehensive SEO management guide for **imagetooltip** (`free-converter-tool`). This guide details how our production-ready SEO system is architected, how to configure custom domains, add new landing pages, manage metadata and structured data (JSON-LD), and submit your sitemap to Google Search Console.

---

## 1. Architecture Overview

### Framework & Execution Model
- **Framework**: Vite 8 + React 19 + TypeScript + Tailwind CSS v4.
- **Hosting Target**: Netlify (via `netlify.toml` and `public/_redirects` SPA rewrite).
- **Core Principles**:
  - **100% Client-Side Privacy**: All decoding, conversion, and compression runs locally via HTML5 Canvas, Web Workers, and TypeScript binary encoders. User files are **never** uploaded to a server, stored, or indexed.
  - **Single Source of Truth**: All domain URLs, titles, descriptions, canonical links, Open Graph tags, and structured data originate from centralized configuration files.
  - **Zero Duplication**: Shared layout views, dynamic metadata injection, and automated sitemap generation ensure no duplicated metadata or broken links.

---

## 2. Directory Structure

```
c:\img-converter\
├── public/
│   ├── _redirects             # Netlify SPA 200 rewrite rule (/* /index.html 200)
│   ├── favicon.svg            # Crisp vector brand icon
│   ├── robots.txt             # Crawl directives & sitemap reference
│   └── sitemap.xml            # Production sitemap listing all canonical routes
├── scripts/
│   └── generate-sitemap.js    # Node script that auto-generates sitemap.xml and robots.txt
├── src/
│   ├── config/
│   │   ├── seo.ts             # Centralized SEO settings, domain resolution & route metadata
│   │   └── landingPages.ts    # Rich content, FAQs & configs for dedicated tool pages
│   ├── utils/
│   │   └── seo.ts             # Dynamic document head & JSON-LD schema injection engine
│   ├── views/
│   │   └── ToolLandingView.tsx# Reusable landing page layout for SEO conversion pairs
│   ├── App.tsx                # HTML5 History API router & dynamic SEO synchronization
│   └── types.ts               # Typed ActiveTab routes
└── doc/
    └── SEO_MANAGEMENT_GUIDE.md# This documentation
```

---

## 3. Configuring Your Production Domain

All canonical URLs, Open Graph images, JSON-LD schemas, and the sitemap dynamically use the central `SITE_URL`.

### In `src/config/seo.ts`:
```typescript
export const SITE_URL = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? import.meta.env.VITE_SITE_URL
    : 'https://freeconvertertool.netlify.app'
).replace(/\/$/, '');
```

### How to Change the Domain:
1. **Local Development / Preview**:
   Create or edit `.env`:
   ```bash
   VITE_SITE_URL="https://yourcustomdomain.com"
   ```
2. **Netlify Dashboard**:
   - Go to **Site Configuration** > **Environment variables**.
   - Add `VITE_SITE_URL` = `https://yourcustomdomain.com`.
   - On the next deploy, `npm run build` will automatically rebuild the sitemap, robots.txt, and metadata targeting your custom domain!

---

## 4. Published SEO Landing Page Routes

imagetooltip includes dedicated, high-intent landing pages for all supported formats and tools:

| URL Path | Primary Keyword | Target Tool | Priority |
| :--- | :--- | :--- | :--- |
| `/` | Free Online Image Converter | Home Dashboard | `1.0` |
| `/converter` | Online Image Converter | Universal Converter | `0.9` |
| `/png-to-jpg` | Convert PNG to JPG Online | Converter (JPEG preset) | `0.9` |
| `/jpg-to-png` | Convert JPG to PNG Online | Converter (PNG preset) | `0.9` |
| `/png-to-webp` | Convert PNG to WebP Online | Converter (WebP preset) | `0.9` |
| `/webp-to-png` | Convert WebP to PNG Online | Converter (PNG preset) | `0.9` |
| `/jpg-to-webp` | Convert JPG to WebP Online | Converter (WebP preset) | `0.9` |
| `/webp-to-jpg` | Convert WebP to JPG Online | Converter (JPEG preset) | `0.9` |
| `/png-to-ico` | Convert PNG to ICO Favicon | Converter (ICO preset) | `0.85` |
| `/image-compressor` | Online Image Compressor | Image Compressor | `0.9` |
| `/resize-image` | Online Image Resizer | Image Resizer | `0.85` |
| `/format` | Supported Image Formats | Formats Matrix | `0.7` |
| `/about` | About imagetooltip | About Us | `0.5` |
| `/faq` | Frequently Asked Questions | FAQ Knowledge Base | `0.6` |
| `/contact` | Contact Us & Support | Contact Form | `0.5` |
| `/privacy` | Privacy Policy | Legal Privacy View | `0.3` |

---

## 5. How to Add a New Conversion Landing Page

Suppose you want to add a new landing page for **BMP to JPG** (`/bmp-to-jpg`):

### Step 1: Add Route to `src/types.ts`
```typescript
export type ActiveTab = 
  | ... existing tabs
  | 'bmp-to-jpg';
```

### Step 2: Register in `src/config/seo.ts`
Add the metadata entry to `SEO_ROUTES`:
```typescript
'/bmp-to-jpg': {
  slug: '/bmp-to-jpg',
  title: 'BMP to JPG Converter – Convert Bitmap to JPG Online | imagetooltip',
  description: 'Convert large uncompressed Windows Bitmap images to compressed JPG format online with zero server uploads.',
  keywords: ['bmp to jpg', 'convert bmp to jpg', 'bitmap to jpeg'],
  h1: 'Convert BMP to JPG Online',
  canonical: `${SITE_URL}/bmp-to-jpg`,
  changefreq: 'weekly',
  priority: 0.85,
  isIndexable: true,
},
```

### Step 3: Add Page Content in `src/config/landingPages.ts`
Add the tool configuration to `TOOL_LANDING_CONFIGS`:
```typescript
'bmp-to-jpg': {
  slug: '/bmp-to-jpg',
  toolType: 'converter',
  targetFormat: 'jpeg',
  acceptedFormats: ['.bmp'],
  badge: 'Uncompressed to JPG',
  h1: 'Convert BMP to JPG Online',
  intro: 'Convert heavy Windows BMP bitmaps to high-quality JPGs to cut file sizes by up to 90% in your browser.',
  sourceFormatName: 'BMP',
  targetFormatName: 'JPG',
  howToSteps: [ ... ],
  benefits: [ ... ],
  faqs: [ ... ],
  relatedTools: [ ... ],
},
```

### Step 4: Map Route in `src/App.tsx`
Add `/bmp-to-jpg` to `SLUG_TO_TAB` and `TAB_TO_SLUG`.

### Step 5: Update `scripts/generate-sitemap.js`
Add `{ path: '/bmp-to-jpg', priority: '0.85', changefreq: 'weekly' }` to the `routes` array.

Run `npm run build` and your new page is fully wired, indexable, and listed in `sitemap.xml`!

---

## 6. Structured Data (JSON-LD) Implementation

imagetooltip automatically creates and injects valid, escaped Schema.org JSON-LD structured data into `<head>`:

1. **`Organization` Schema**:
   Identifies the publisher, website URL, brand logo, and GitHub repository.
2. **`WebSite` Schema**:
   Identifies the official name, description, and language.
3. **`WebApplication` Schema**:
   Declares the tool as a `MultimediaApplication` operating in web browsers with zero cost (`price: "0"`).
4. **`BreadcrumbList` Schema**:
   Provides structured navigation hierarchy (`Home > Tools > [Tool Name]`).
5. **`FAQPage` Schema**:
   Automatically generated whenever a landing page includes FAQs, qualifying the page for Google FAQ rich snippet displays.

### Validating Structured Data:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

---

## 7. Automated Sitemap & Robots.txt Generation

The sitemap and robots.txt are generated automatically on every build using `scripts/generate-sitemap.js`.

### Commands:
```bash
# Build production bundle and auto-generate sitemap.xml & robots.txt
npm run build

# Or generate sitemap standalone without full build
npm run build:sitemap
```

### `public/robots.txt` Output:
```
User-agent: *
Allow: /

# Sitemap Index
Sitemap: https://freeconvertertool.netlify.app/sitemap.xml
```

---

## 8. Connecting with Google Search Console (GSC)

### Step 1: Open Google Search Console
Go to [search.google.com/search-console](https://search.google.com/search-console) and click **Add property**.

### Step 2: Choose Property Type
- **URL prefix**: Enter your exact URL (e.g. `https://freeconvertertool.netlify.app` or your custom domain).

### Step 3: Verification
Choose **HTML tag** verification. Copy your verification token (e.g. `google-site-verification=abc123xyz`).
- In Netlify or your `.env`:
  ```bash
  VITE_GOOGLE_SITE_VERIFICATION="abc123xyz"
  ```
- Or place it directly in `index.html`:
  ```html
  <meta name="google-site-verification" content="YOUR_TOKEN_HERE" />
  ```
- Click **Verify** in GSC.

### Step 4: Submit the Sitemap
1. In the GSC sidebar, navigate to **Sitemaps**.
2. Under "Add a new sitemap", enter: `sitemap.xml`.
3. Click **Submit**.
4. Status should change to **Success** within a few hours.

### Step 5: Inspect and Request Indexing
1. Use the **URL Inspection** search bar at the top of GSC.
2. Enter `https://yourdomain.com/` or high-priority landing pages like `https://yourdomain.com/png-to-jpg`.
3. Click **Test Live URL**.
4. Once verified, click **Request Indexing**.

---

## 9. Performance & Core Web Vitals Best Practices

Search engines reward fast, responsive web applications:

1. **Largest Contentful Paint (LCP)**:
   - Our CSS preloader in `index.html` renders in <50ms without waiting for JavaScript bundles.
   - Hero headlines and text are render-ready immediately.
2. **Cumulative Layout Shift (CLS)**:
   - We avoid layout shifts by giving drop zones and preview cards fixed minimum dimensions.
   - No dynamic advertisement banners or sudden popup injections.
3. **Interaction to Next Paint (INP)**:
   - Conversion operations are chunked and executed asynchronously so the browser main thread remains responsive.
4. **Font Optimization**:
   - Google Fonts (Plus Jakarta Sans and JetBrains Mono) are loaded with `preconnect` and `display=swap`.

---

## 10. Privacy & Quality Compliance

- **No Cloaking or Doorways**: Every landing page contains real, functional conversion tools.
- **Accurate Claims**: Only formats that genuinely work (WebP, AVIF, JPG, PNG, GIF, SVG, BMP, ICO) are listed.
- **User Image Protection**: Images never leave the user's browser, satisfying strict GDPR, CCPA, and enterprise privacy standards.
