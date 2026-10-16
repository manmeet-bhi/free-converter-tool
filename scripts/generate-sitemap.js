/**
 * Automatic Sitemap & Robots.txt Generator
 * 
 * Generates public/sitemap.xml and public/robots.txt using centralized
 * route definitions and environment-configured production domain.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

// Resolve production domain
const siteUrl = (process.env.VITE_SITE_URL || 'https://freeconvertertool.netlify.app').replace(/\/$/, '');

// Today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// All valid, canonical, public indexable routes with priorities & frequencies
const routes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/converter', priority: '0.9', changefreq: 'weekly' },
  { path: '/png-to-jpg', priority: '0.9', changefreq: 'weekly' },
  { path: '/jpg-to-png', priority: '0.9', changefreq: 'weekly' },
  { path: '/png-to-webp', priority: '0.9', changefreq: 'weekly' },
  { path: '/webp-to-png', priority: '0.9', changefreq: 'weekly' },
  { path: '/jpg-to-webp', priority: '0.9', changefreq: 'weekly' },
  { path: '/webp-to-jpg', priority: '0.9', changefreq: 'weekly' },
  { path: '/png-to-ico', priority: '0.85', changefreq: 'weekly' },
  { path: '/image-compressor', priority: '0.9', changefreq: 'weekly' },
  { path: '/resize-image', priority: '0.85', changefreq: 'weekly' },
  { path: '/format', priority: '0.7', changefreq: 'monthly' },
  { path: '/features', priority: '0.6', changefreq: 'monthly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookie', priority: '0.3', changefreq: 'yearly' },
];

function generateSitemapXml() {
  const urlsXml = routes
    .map(
      (r) => `  <url>
    <loc>${siteUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>
`;
}

function generateRobotsTxt() {
  return `# Robots.txt for ImageKit
# Allow search engines full access to public landing pages

User-agent: *
Allow: /

# Sitemap Index
Sitemap: ${siteUrl}/sitemap.xml
`;
}

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write sitemap.xml
const sitemapPath = path.join(publicDir, 'sitemap.xml');
fs.writeFileSync(sitemapPath, generateSitemapXml(), 'utf-8');
console.log(`[SEO] Generated public/sitemap.xml with ${routes.length} canonical URLs for ${siteUrl}`);

// Write robots.txt
const robotsPath = path.join(publicDir, 'robots.txt');
fs.writeFileSync(robotsPath, generateRobotsTxt(), 'utf-8');
console.log(`[SEO] Generated public/robots.txt pointing to ${siteUrl}/sitemap.xml`);
