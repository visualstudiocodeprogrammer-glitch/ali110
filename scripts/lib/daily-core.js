/**
 * Core of the daily-hadith job, separated from the network so it can be tested.
 * Rules: never invent text; keep the source URL; skip duplicates; validate before
 * writing; never touch existing data if anything fails.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateCollection } from '../../js/schema.js';
import { normalizeText } from '../../js/util.js';
import { extractCandidates } from './extract.js';

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
function writeJsonAtomic(p, obj) {
  writeFileSync(`${p}.tmp`, `${JSON.stringify(obj, null, 2)}\n`);
  renameSync(`${p}.tmp`, p);
}

const SOURCES = {
  'wikishia.net': { fa: 'ویکی‌شیعه', en: 'WikiShia' },
  'imamali.net': { fa: 'ImamAli.net', en: 'ImamAli.net' }
};
export const sourceLabel = (host) => {
  const key = Object.keys(SOURCES).find((k) => host === k || host.endsWith(`.${k}`));
  return key ? SOURCES[key] : { fa: host, en: host };
};

export const isDuplicate = (arabic, existing) => {
  const n = normalizeText(arabic);
  return existing.some((h) => {
    const e = normalizeText(h.arabic);
    return e === n || (Math.min(e.length, n.length) > 25 && (e.includes(n) || n.includes(e)));
  });
};

export function buildHadith({ candidate, pageUrl, pageTitle, date }) {
  const host = new URL(pageUrl).hostname;
  const short = createHash('sha1').update(normalizeText(candidate.arabic)).digest('hex').slice(0, 8);
  const translation = { status: 'sourced', translator: { fa: 'مطابق متن صفحهٔ منبع', en: 'as given on the source page' } };
  if (candidate.fa) translation.fa = candidate.fa;
  if (candidate.en) translation.en = candidate.en;
  // translator is a plain string in the schema, so flatten to the English wording
  translation.translator = translation.translator.en;
  const title = pageTitle || pageUrl;
  return {
    id: `auto-${date}-${short}`,
    arabic: candidate.arabic,
    translation,
    source: { work: sourceLabel(host), reference: { fa: title, en: title }, url: pageUrl },
    narrator: null,
    verification: {
      status: 'source-linked',
      note: {
        fa: 'به‌صورت خودکار از صفحهٔ منبع استخراج شد و هنوز بازبینی انسانی نشده است. پیش از اتکا، متن را با منبع تطبیق دهید.',
        en: 'Retrieved automatically from the source page and not yet reviewed by a person. Compare the text with the source before relying on it.'
      },
      checkedAt: date
    },
    category: 'collected',
    tags: ['auto'],
    featured: false,
    addedAt: date
  };
}

/**
 * @param {{root:string,date:string,dryRun?:boolean,fetchPage:(url:string)=>Promise<{html:string,title?:string}>,log?:Function,maxAttempts?:number}} o
 * @returns {Promise<{status:'added'|'already-done'|'nothing'|'dry-run', hadith?:object}>}
 */
export async function runDaily({ root, date, dryRun = false, fetchPage, log = console.log, maxAttempts = 5 }) {
  const dataDir = join(root, 'data');
  const hadithsPath = join(dataDir, 'hadiths.json');
  const dailyPath = join(dataDir, 'daily.json');
  const queuePath = join(dataDir, 'source-queue.json');

  const hadiths = readJson(hadithsPath);
  const daily = readJson(dailyPath);
  const queue = existsSync(queuePath) ? readJson(queuePath) : { schema: 1, pending: [], done: [] };

  if ((daily.entries || []).some((e) => e.date === date)) {
    log(`A hadith is already recorded for ${date}; nothing to do.`);
    return { status: 'already-done' };
  }
  if (!queue.pending.length) {
    log('data/source-queue.json has no pending pages. Add source page URLs (see README); the site keeps rotating curated hadiths meanwhile.');
    return { status: 'nothing' };
  }

  let attempts = 0;
  for (const entry of [...queue.pending]) {
    if (attempts++ >= maxAttempts) break;
    const pageUrl = typeof entry === 'string' ? entry : entry.url;
    log(`Trying ${pageUrl}`);
    let page;
    try { page = await fetchPage(pageUrl); } catch (err) { log(`  skipped: ${err.message}`); continue; }

    const fresh = extractCandidates(page.html).filter((c) => !isDuplicate(c.arabic, hadiths.items));
    if (!fresh.length) { log('  no new Arabic quotation found on this page'); continue; }

    const hadith = buildHadith({ candidate: fresh[0], pageUrl, pageTitle: page.title, date });
    const nextHadiths = { ...hadiths, items: [...hadiths.items, hadith] };
    const check = validateCollection('hadiths', nextHadiths);
    if (check.problems.length) { log(`  rejected (invalid): ${check.problems.map((p) => p.errors.join('; ')).join(' | ')}`); continue; }

    if (dryRun) { log('Dry run: would add\n' + JSON.stringify(hadith, null, 2)); return { status: 'dry-run', hadith }; }

    const stillPending = queue.pending.filter((e) => e !== entry);
    // Each page is used once for one hadith, then retired.
    writeJsonAtomic(hadithsPath, nextHadiths);
    writeJsonAtomic(dailyPath, { ...daily, entries: [...(daily.entries || []), { date, hadithId: hadith.id }] });
    writeJsonAtomic(queuePath, { ...queue, pending: stillPending, done: [...(queue.done || []), { url: pageUrl, date, hadithId: hadith.id }] });
    log(`Added ${hadith.id} from ${pageUrl}`);
    return { status: 'added', hadith };
  }
  log('No usable hadith found today; existing data left untouched.');
  return { status: 'nothing' };
}

/** Candidate listing for `--url` (never writes). */
export function listCandidates(html) {
  return extractCandidates(html);
}
