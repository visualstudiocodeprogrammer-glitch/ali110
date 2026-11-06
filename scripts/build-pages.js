#!/usr/bin/env node
/**
 * Generates the per-page HTML shells (/, /hadiths/, ...), sitemap.xml, robots.txt,
 * precache.json and stamps sw.js with a build id.
 *
 *   node scripts/build-pages.js                 # regenerate in place (committed files)
 *   SITE_URL=https://me.github.io/ali110/ node scripts/build-pages.js --out dist
 *
 * With --out, the deployable site is copied to that folder first, so node_modules,
 * tests and scripts are never published. SITE_URL turns on canonical, og:url,
 * og:image and sitemap entries (they need absolute URLs).
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PAGES } from '../js/site-config.js';
import { LOCALES } from '../js/locales.js';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? resolve(SRC, args[outIdx + 1]) : SRC;

let base = (process.env.SITE_URL || SITE.url || '').trim();
if (base && !base.endsWith('/')) base += '/';

const COPY = ['assets', 'css', 'js', 'data', 'index.html', '404.html', 'offline.html', 'manifest.json', 'favicon.ico', '.nojekyll'];
if (OUT !== SRC) {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const item of COPY) if (existsSync(join(SRC, item))) cpSync(join(SRC, item), join(OUT, item), { recursive: true });
  cpSync(join(SRC, 'sw.js'), join(OUT, 'sw.js'));
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fa = LOCALES.fa;

const PRE_PAINT = `(function(){try{var d=document.documentElement,t=localStorage.getItem('ali110.theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;if(localStorage.getItem('ali110.lang')==='en'){d.lang='en';d.dir='ltr'}}catch(e){}})();`;

function shell(page) {
  const root = page.dir ? '../' : './';
  const key = page.id === 'home' ? null : page.id;
  const title = key ? `${fa[`meta.${key}.title`]} | ${SITE.name}` : `${SITE.name}: ${fa['site.tagline']}`;
  const desc = key ? fa[`meta.${key}.desc`] : fa['site.description'];
  const pageUrl = base ? `${base}${page.dir ? `${page.dir}/` : ''}` : '';
  const ld = {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, inLanguage: ['fa', 'en'],
    ...(base ? { url: base, potentialAction: { '@type': 'SearchAction', target: `${base}search/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } } : {})
  };
  return `<!doctype html>
<html lang="fa" dir="rtl" data-root="${root}" data-page="${page.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${SITE.themeColor}">
<meta name="color-scheme" content="light dark">
${pageUrl ? `<link rel="canonical" href="${pageUrl}">\n` : ''}<link rel="manifest" href="${root}manifest.json">
<link rel="icon" href="${root}favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="${root}assets/icons/favicon-32.png">
<link rel="apple-touch-icon" href="${root}assets/icons/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:locale" content="fa_IR">
<meta property="og:locale:alternate" content="en_US">
${pageUrl ? `<meta property="og:url" content="${pageUrl}">\n<meta property="og:image" content="${base}assets/images/og-image.png">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${root}assets/fonts/vazirmatn-arabic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}assets/fonts/amiri-arabic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}css/themes.css">
<link rel="stylesheet" href="${root}css/main.css">
<link rel="stylesheet" href="${root}css/components.css">
<link rel="stylesheet" href="${root}css/responsive.css">
<script>${PRE_PAINT}</script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="module" src="${root}js/app.js"></script>
</head>
<body>
<a class="skip-link" href="#main">${esc(fa.skip)}</a>
<div id="app-header"></div>
<main id="main" tabindex="-1"></main>
<div id="app-footer"></div>
<noscript><p style="padding:2rem;text-align:center">برای مشاهدهٔ ali110 جاوااسکریپت باید فعال باشد. / ali110 needs JavaScript to display its content.</p></noscript>
</body>
</html>
`;
}

for (const page of PAGES) {
  const dir = page.dir ? join(OUT, page.dir) : OUT;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), shell(page));
}

// 404.html: tell it the base path when known
{
  const path404 = join(OUT, '404.html');
  let html = readFileSync(path404, 'utf8');
  const basePath = base ? new URL(base).pathname : '';
  html = html.replace(/<meta name="ali110-base" content="[^"]*">/, `<meta name="ali110-base" content="${basePath}">`);
  writeFileSync(path404, html);
}

// sitemap.xml + robots.txt
const today = new Date().toISOString().slice(0, 10);
const sitemapPages = PAGES.filter((p) => p.id !== 'search');
const sitemap = base
  ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPages.map((p) => `  <url><loc>${base}${p.dir ? `${p.dir}/` : ''}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`
  : `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Set SITE_URL (or SITE.url in js/site-config.js) and run "npm run build" to list pages here. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n`;
writeFileSync(join(OUT, 'sitemap.xml'), sitemap);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n${base ? `\nSitemap: ${base}sitemap.xml\n` : ''}`);

// precache.json + stamp sw.js
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const skip = (f) => /LICENSE|ali110-logo-original|ali110-logo-trimmed|og-image/.test(f);
const urls = [
  ...PAGES.map((p) => `${p.dir ? `${p.dir}/` : ''}`),
  'offline.html', 'manifest.json', 'favicon.ico',
  ...['assets', 'css', 'js', 'data'].flatMap((d) => (existsSync(join(OUT, d)) ? walk(join(OUT, d)) : []))
    .map((f) => relative(OUT, f).split('\\').join('/')).filter((f) => !skip(f))
].sort();
const hash = createHash('sha1');
for (const u of urls) {
  const f = join(OUT, u.endsWith('/') || u === '' ? `${u}index.html` : u);
  if (existsSync(f)) hash.update(u).update(readFileSync(f));
}
const buildId = hash.digest('hex').slice(0, 10);
writeFileSync(join(OUT, 'precache.json'), `${JSON.stringify({ build: buildId, urls }, null, 2)}\n`);
const swPath = join(OUT, 'sw.js');
writeFileSync(swPath, readFileSync(swPath, 'utf8').replace(/const BUILD = "[^"]*";/, `const BUILD = "${buildId}";`));

console.log(`built ${PAGES.length} pages -> ${relative(process.cwd(), OUT) || '.'} (build ${buildId}${base ? `, site ${base}` : ', no SITE_URL'})`);
