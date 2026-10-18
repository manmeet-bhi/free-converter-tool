/**
 * Client-Side Dynamic SEO & Schema Injection Engine
 * 
 * Safely synchronizes document head tags (title, description, canonical,
 * Open Graph, Twitter cards, robots) and structured JSON-LD data with
 * the active page state.
 */

import { PageMetadata, SITE_NAME, SITE_URL, TWITTER_HANDLE } from '../config/seo';

/**
 * Safely updates or creates a `<meta>` element by name or property attribute.
 */
function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string): void {
  if (typeof document === 'undefined') return;

  let element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Safely updates or creates a `<link>` element by rel attribute.
 */
function setLinkTag(rel: string, href: string): void {
  if (typeof document === 'undefined') return;

  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Injects or updates a JSON-LD structured data script in document.head.
 */
function setStructuredData(scriptId: string, data: object): void {
  if (typeof document === 'undefined') return;

  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  // Safely serialize with JSON escaping
  script.textContent = JSON.stringify(data, null, 2);
}

/**
 * Generates JSON-LD schema for a page.
 */
export function generateSchemaForPage(meta: PageMetadata, faqs?: { question: string; answer: string }[]): object {
  const schemas: any[] = [];

  // 1. Organization Schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
  });

  // 2. WebSite Schema (with search capability)
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: meta.description,
    inLanguage: 'en-US',
  });

  // 3. WebApplication Schema for conversion & image tools
  if (meta.slug === '/' || meta.slug.includes('converter') || meta.slug.includes('-to-') || meta.slug.includes('compressor') || meta.slug.includes('resizer')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: meta.h1 || meta.title,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All (Web Browser)',
      browserRequirements: 'Requires HTML5 Canvas & WebAssembly support',
      url: meta.canonical,
      description: meta.description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        '100% In-browser processing with zero server uploads',
        'Batch image conversion and ZIP bundle download',
        'Target file size compression',
        'Custom pixel and aspect ratio resizing',
      ],
    });
  }

  // 4. BreadcrumbList Schema for non-home pages
  if (meta.slug !== '/') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_URL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: meta.h1 || meta.title,
          item: meta.canonical,
        },
      ],
    });
  }

  // 5. FAQPage Schema if FAQs exist on this page
  if (faqs && faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
}

/**
 * Updates all document head metadata and JSON-LD structured data for the given page.
 */
export function updatePageSEO(meta: PageMetadata, faqs?: { question: string; answer: string }[]): void {
  if (typeof document === 'undefined') return;

  // 1. Title
  document.title = meta.title;

  // 2. Standard Metadata
  setMetaTag('name', 'description', meta.description);
  if (meta.keywords?.length) {
    setMetaTag('name', 'keywords', meta.keywords.join(', '));
  }
  setMetaTag('name', 'robots', meta.isIndexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
  setMetaTag('name', 'author', 'ImageKit Team');

  // 3. Canonical URL
  setLinkTag('canonical', meta.canonical);

  // 4. Open Graph Tags
  const ogImage = `${SITE_URL}/og-image.png`;
  setMetaTag('property', 'og:site_name', SITE_NAME);
  setMetaTag('property', 'og:title', meta.title);
  setMetaTag('property', 'og:description', meta.description);
  setMetaTag('property', 'og:url', meta.canonical);
  setMetaTag('property', 'og:type', meta.ogType || 'website');
  setMetaTag('property', 'og:image', ogImage);
  setMetaTag('property', 'og:locale', 'en_US');

  // 5. Twitter Card Tags
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:site', TWITTER_HANDLE);
  setMetaTag('name', 'twitter:creator', TWITTER_HANDLE);
  setMetaTag('name', 'twitter:title', meta.title);
  setMetaTag('name', 'twitter:description', meta.description);
  setMetaTag('name', 'twitter:image', ogImage);

  // 6. JSON-LD Structured Data
  const schema = generateSchemaForPage(meta, faqs);
  setStructuredData('schema-json-ld', schema);
}
