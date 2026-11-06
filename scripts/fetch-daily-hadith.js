#!/usr/bin/env node
/**
 * Daily hadith retrieval (run by .github/workflows/daily-hadith.yml).
 *
 *   npm run daily                 add today's hadith from the next page in data/source-queue.json
 *   npm run daily:dry             same, but only print what would be added
 *   node scripts/fetch-daily-hadith.js --dry-run --url=<page>   try ONE page and list what is found
 *
 * Neither WikiShia nor ImamAli.net documents a public hadith API, so this reads
 * individual pages you list in the queue: via the MediaWiki API for WikiShia
 * (documented, read-only) and via the plain page for ImamAli.net. It checks
 * robots.txt, identifies itself, retries politely, and never overwrites data on failure.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createFetcher } from './lib/net.js';
import { runDaily, listCandidates } from './lib/daily-core.js';
import { isoDate } from '../js/util.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
const flag = (n) => process.argv.includes(`--${n}`);
const cfg = JSON.parse(readFileSync(resolve(ROOT, 'scripts/sources.config.json'), 'utf8'));
const date = arg('date') || isoDate(new Date());
const warn = (m) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${m}` : `warning: ${m}`);

const net = createFetcher({ userAgent: cfg.userAgent, timeoutMs: cfg.timeoutMs, maxRetries: cfg.maxRetries, delayMs: cfg.delayMs });
const allowedHosts = cfg.allowedHosts;
const hostOk = (host) => allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));

async function fetchPage(pageUrl) {
  const u = new URL(pageUrl);
  if (u.protocol !== 'https:' || !hostOk(u.hostname)) throw new Error(`host ${u.hostname} is not in scripts/sources.config.json allowedHosts`);
  if (!(await net.allowed(pageUrl))) throw new Error('disallowed by robots.txt (or robots.txt could not be read)');

  if (u.hostname.endsWith('wikishia.net')) {
    // MediaWiki Action API: https://www.mediawiki.org/wiki/API:Parse
    const m = u.pathname.match(/\/view\/(.+)$/) || [];
    const title = decodeURIComponent(m[1] || u.searchParams.get('title') || '');
    if (title) {
      const api = `${u.origin}/w/api.php?action=parse&format=json&formatversion=2&redirects=1&prop=text%7Cdisplaytitle&page=${encodeURIComponent(title)}`;
      try {
        if (await net.allowed(api)) {
          const data = await (await net.request(api)).json();
          if (data.parse?.text) return { html: data.parse.text, title: (data.parse.displaytitle || data.parse.title || title).replace(/<[^>]+>/g, '') };
        }
      } catch (err) {
        console.log(`  API unavailable (${err.message}); falling back to the page itself`);
      }
    }
  }
  const html = await (await net.request(pageUrl)).text();
  const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1]?.trim();
  return { html, title };
}

try {
  if (arg('url')) {
    const page = await fetchPage(arg('url'));
    const found = listCandidates(page.html);
    console.log(`${found.length} candidate(s) on "${page.title}":`);
    for (const c of found) console.log(JSON.stringify(c, null, 2));
  } else {
    await runDaily({ root: ROOT, date, dryRun: flag('dry-run'), fetchPage });
  }
} catch (err) {
  // The automation is optional: report, but never fail the repository or the site build.
  warn(`daily hadith retrieval failed: ${err.message}`);
}
