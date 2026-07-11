import { useEffect } from 'react';

const DEFAULT_IMAGE = '/favicon.png';

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

export default function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  robots = 'index, follow',
}) {
  useEffect(() => {
    const siteUrl = window.location.origin;
    const canonicalUrl = new URL(path, siteUrl).toString();
    const imageUrl = new URL(image, siteUrl).toString();

    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    upsertMeta('meta[property="twitter:title"]', { property: 'twitter:title', content: title });
    upsertMeta('meta[property="twitter:description"]', { property: 'twitter:description', content: description });
    upsertMeta('meta[property="twitter:image"]', { property: 'twitter:image', content: imageUrl });
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
  }, [description, image, path, robots, title]);

  return null;
}
