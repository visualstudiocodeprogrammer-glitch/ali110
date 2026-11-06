#!/usr/bin/env node
/**
 * Validates data/*.json with the same schema the website uses, plus cross-file checks:
 * ids unique, references resolve, local files exist, no duplicate hadith text,
 * locale files have the same keys. Exit code 1 if anything is wrong.
 *
 *   npm run validate
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLLECTIONS, validateCollection } from '../js/schema.js';
import { LOCALES } from '../js/locales.js';
import { normalizeText } from '../js/util.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const data = {};

const readJson = (name) => JSON.parse(readFileSync(join(ROOT, 'data', name), 'utf8'));

for (const name of COLLECTIONS) {
  const file = `${name}.json`;
  if (!existsSync(join(ROOT, 'data', file))) { errors.push(`${file}: file is missing`); data[name] = []; continue; }
  let payload;
  try { payload = readJson(file); } catch (e) { errors.push(`${file}: not valid JSON (${e.message})`); data[name] = []; continue; }
  const { valid, problems } = validateCollection(name, payload);
  for (const p of problems) errors.push(`${file} > ${p.id}: ${p.errors.join('; ')}`);
  data[name] = valid;
}

const ids = (c) => new Set(data[c].map((i) => i.id));
const hadithIds = ids('hadiths');

for (const t of data.typography) if (!hadithIds.has(t.hadithId)) errors.push(`typography.json > ${t.id}: hadithId "${t.hadithId}" not found in hadiths.json`);
for (const v of data.virtues) for (const l of v.links || []) if (!ids(l.type).has(l.id)) errors.push(`virtues.json > ${v.id}: link ${l.type}/${l.id} does not exist`);

const seen = new Map();
for (const h of data.hadiths) {
  const key = normalizeText(h.arabic);
  if (seen.has(key)) errors.push(`hadiths.json > ${h.id}: same Arabic text as ${seen.get(key)} (duplicate)`);
  seen.set(key, h.id);
  if (h.verification.status === 'verified' && !h.source?.url) warnings.push(`hadiths.json > ${h.id}: marked "verified" but has no source url`);
}

const fileExists = (p) => existsSync(join(ROOT, p));
for (const g of data.gallery) for (const p of [g.src, g.thumb].filter(Boolean)) if (!fileExists(p)) errors.push(`gallery.json > ${g.id}: file "${p}" not found`);
for (const a of data.audio) if (!/^https?:/.test(a.src) && !fileExists(a.src)) errors.push(`audio.json > ${a.id}: file "${a.src}" not found`);
for (const a of data.articles) if (a.cover && !fileExists(a.cover)) errors.push(`articles.json > ${a.id}: cover "${a.cover}" not found`);

try {
  const daily = readJson('daily.json');
  for (const e of daily.entries || []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) errors.push(`daily.json: bad date "${e.date}"`);
    if (!hadithIds.has(e.hadithId)) errors.push(`daily.json: hadithId "${e.hadithId}" not found in hadiths.json`);
  }
} catch (e) { errors.push(`daily.json: ${e.message}`); }

try {
  const q = readJson('source-queue.json');
  for (const e of q.pending || []) {
    const u = typeof e === 'string' ? e : e.url;
    if (!/^https:\/\/\S+$/.test(u || '')) errors.push(`source-queue.json: invalid pending url "${u}"`);
  }
} catch (e) { errors.push(`source-queue.json: ${e.message}`); }

try {
  const about = readJson('about.json');
  for (const s of about.sections || []) for (const l of ['fa', 'en']) if (!Array.isArray(s.body?.[l]) || !s.body[l].length) errors.push(`about.json > ${s.id}: missing body.${l}`);
} catch (e) { errors.push(`about.json: ${e.message}`); }

const fa = Object.keys(LOCALES.fa);
const en = Object.keys(LOCALES.en);
for (const k of fa) if (!en.includes(k)) errors.push(`locales: "${k}" missing in en`);
for (const k of en) if (!fa.includes(k)) errors.push(`locales: "${k}" missing in fa`);

const total = COLLECTIONS.map((c) => `${c}:${data[c].length}`).join('  ');
console.log(`items  ${total}`);
for (const w of warnings) console.warn(`warning  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error    ${e}`);
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log('content OK');
