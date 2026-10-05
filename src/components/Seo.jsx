import { useEffect } from 'react';

const DEFAULT_IMAGE = '/og-image.png';

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function upsertScript(id, content) {
  let element = document.head.querySelector(`script#${id}`);

  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }

  element.textContent = typeof content === 'string' ? content : JSON.stringify(content);
}

export default function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  robots = 'index, follow',
  keywords = 'stratify, startup operating system, founder intelligence, vc thesis matching, startup runway, cap table planner',
  schema = null,
  geoRegion = 'US-CA',
  geoPlacename = 'San Francisco, California',
  geoPosition = '37.789172;-122.401449',
}) {
  useEffect(() => {
    const siteUrl = window.location.origin;
    const canonicalUrl = new URL(path, siteUrl).toString();
    const imageUrl = new URL(image, siteUrl).toString();

    document.title = title;

    // Standard SEO Meta Tags
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[name="author"]', { name: 'author', content: 'Stratify Labs Inc.' });
    upsertMeta('meta[name="publisher"]', { name: 'publisher', content: 'Stratify Labs Inc.' });

    // Open Graph / Facebook / LinkedIn
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Stratify' });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: '1200' });
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: '630' });

    // Twitter / X Cards
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:site"]', { name: 'twitter:site', content: '@stratifyco' });
    upsertMeta('meta[property="twitter:title"]', { property: 'twitter:title', content: title });
    upsertMeta('meta[property="twitter:description"]', { property: 'twitter:description', content: description });
    upsertMeta('meta[property="twitter:image"]', { property: 'twitter:image', content: imageUrl });

    // GEO / Geotargeting Metadata (Generative Engine Optimization)
    upsertMeta('meta[name="geo.region"]', { name: 'geo.region', content: geoRegion });
    upsertMeta('meta[name="geo.placename"]', { name: 'geo.placename', content: geoPlacename });
    upsertMeta('meta[name="geo.position"]', { name: 'geo.position', content: geoPosition });
    upsertMeta('meta[name="ICBM"]', { name: 'ICBM', content: geoPosition.replace(';', ', ') });

    // Dublin Core Metadata
    upsertMeta('meta[name="DC.title"]', { name: 'DC.title', content: title });
    upsertMeta('meta[name="DC.description"]', { name: 'DC.description', content: description });
    upsertMeta('meta[name="DC.creator"]', { name: 'DC.creator', content: 'Stratify Labs Inc.' });
    upsertMeta('meta[name="DC.publisher"]', { name: 'DC.publisher', content: 'Stratify Labs Inc.' });

    // AEO (Answer Engine Optimization) & AI Bot Directives
    upsertMeta('meta[name="ai-content-declaration"]', { name: 'ai-content-declaration', content: 'authoritative-enterprise-grounded' });

    // Canonical link
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });

    // Dynamic JSON-LD Structured Data
    if (schema) {
      upsertScript('stratify-dynamic-jsonld', schema);
    }
  }, [description, image, path, robots, title, keywords, schema, geoRegion, geoPlacename, geoPosition]);

  return null;
}
