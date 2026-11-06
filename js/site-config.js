/**
 * Static site configuration, shared by the browser and scripts/build-pages.js.
 * Edit SITE.url once a custom domain (or the final GitHub Pages URL) is known:
 * it enables canonical links, Open Graph URLs and sitemap entries.
 */
export const SITE = {
  name: 'ali110',
  // e.g. 'https://username.github.io/ali110/' or 'https://ali110.example'. Leave '' until known.
  url: '',
  defaultLang: 'fa',
  themeColor: '#063F38',
  // Add { name: 'Telegram', url: 'https://t.me/...' } entries; the footer shows them only if present.
  social: []
};

/**
 * One entry per page. `dir` is the folder (and URL segment) on the static host.
 * `nav`: 'main' = top-level link, 'media' = inside the "Media" dropdown, null = not in the nav.
 */
export const PAGES = [
  { id: 'home', dir: '', nav: 'main' },
  { id: 'about', dir: 'about', nav: 'main' },
  { id: 'virtues', dir: 'virtues', nav: 'main' },
  { id: 'hadiths', dir: 'hadiths', nav: 'main' },
  { id: 'narrations', dir: 'narrations', nav: 'main' },
  { id: 'typography', dir: 'typography', nav: 'media' },
  { id: 'gallery', dir: 'gallery', nav: 'media' },
  { id: 'audio', dir: 'audio', nav: 'media' },
  { id: 'articles', dir: 'articles', nav: 'main' },
  { id: 'search', dir: 'search', nav: null }
];
