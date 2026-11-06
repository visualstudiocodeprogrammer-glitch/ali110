import { SITE } from './site-config.js';
import { t } from './i18n.js';

function setTag(selector, attr, value) {
  const node = document.head.querySelector(selector);
  if (node && value) node.setAttribute(attr, value);
}

/** Update <title>, description and Open Graph tags for the current language. */
export function setMeta({ title, description, jsonLd } = {}) {
  const full = title ? `${title} | ${SITE.name}` : `${SITE.name}: ${t('site.tagline')}`;
  const desc = description || t('site.description');
  document.title = full;
  setTag('meta[name="description"]', 'content', desc);
  setTag('meta[property="og:title"]', 'content', full);
  setTag('meta[property="og:description"]', 'content', desc);
  setTag('meta[property="og:locale"]', 'content', document.documentElement.lang === 'fa' ? 'fa_IR' : 'en_US');

  document.head.querySelector('script[data-jsonld="page"]')?.remove();
  if (jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.jsonld = 'page';
    s.textContent = JSON.stringify(jsonLd);
    document.head.append(s);
  }
}
