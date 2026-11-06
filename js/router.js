/**
 * URL helpers for a multi-page static site hosted under any base path
 * (user site, project site, or custom domain). All links are relative to the
 * page's depth, which the HTML shell exposes as <html data-root="../">.
 */
import { PAGES } from './site-config.js';

const html = document.documentElement;
export const ROOT = html.dataset.root || './';
export const PAGE = html.dataset.page || 'home';

const dirOf = (id) => PAGES.find((p) => p.id === id)?.dir ?? id;

/** Relative URL to a page, with optional query params. */
export function url(pageId, params) {
  const dir = dirOf(pageId);
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : '';
  return `${ROOT}${dir ? `${dir}/` : ''}${qs}`;
}

export const asset = (path) => `${ROOT}${path}`;

/** Absolute URL (for sharing and structured data). */
export const absoluteUrl = (pageId, params) => new URL(url(pageId, params), location.href).href;

export const query = () => new URLSearchParams(location.search);
