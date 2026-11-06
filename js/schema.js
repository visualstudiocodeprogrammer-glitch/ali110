/**
 * Content schemas shared by the browser (data-loader.js) and Node
 * (scripts/validate-content.js). No DOM or Node APIs here.
 *
 * Every data file looks like { "schema": 1, "items": [ ... ] }.
 * Localised fields are objects: { "fa": "...", "en": "..." }.
 */

export const COLLECTIONS = ['hadiths', 'articles', 'virtues', 'narrations', 'typography', 'gallery', 'audio'];

export const VERIFICATION_STATUSES = ['verified', 'source-linked', 'unverified'];
export const TRANSLATION_STATUSES = ['draft', 'reviewed', 'sourced'];
export const TYPO_STYLES = ['emerald', 'gold', 'night', 'cream'];
export const AUDIO_KINDS = ['maddahi', 'speech', 'mawlid', 'lecture'];
export const LINK_TYPES = ['hadiths', 'articles', 'narrations', 'virtues', 'typography', 'gallery', 'audio'];

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isLoc = (v) => isObj(v) && (isStr(v.fa) || isStr(v.en));
const isLocBoth = (v) => isObj(v) && isStr(v.fa) && isStr(v.en);
const isLocList = (v) => isObj(v) && ['fa', 'en'].every((l) => Array.isArray(v[l]) && v[l].length > 0 && v[l].every(isStr));
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isUrl = (v) => typeof v === 'string' && /^https?:\/\/\S+$/.test(v);
const isPath = (v) => typeof v === 'string' && v.length > 0 && !/^[a-z]+:/i.test(v) && !v.startsWith('/') && !v.includes('..');

/** Each rule: [fieldName, predicate, description, required?] */
const COMMON = [['id', (v) => typeof v === 'string' && ID_RE.test(v), 'lowercase id (a-z, 0-9, -)', true]];

const SCHEMAS = {
  hadiths: [
    ...COMMON,
    ['arabic', isStr, 'Arabic text', true],
    // fa/en are each optional (auto-retrieved hadiths may be Arabic-only); the UI simply omits what is missing
    ['translation', (v) => isObj(v) && (v.fa === undefined || isStr(v.fa)) && (v.en === undefined || isStr(v.en)) && (v.status === undefined || TRANSLATION_STATUSES.includes(v.status)), 'translation {fa?,en?,status?}', true],
    ['source', (v) => isObj(v) && isLoc(v.work) && (v.url === undefined || isUrl(v.url)) && (v.reference === undefined || isLoc(v.reference)), 'source {work, reference?, url}', true],
    ['narrator', (v) => v === null || isLoc(v), 'narrator {fa,en} or null', false],
    ['verification', (v) => isObj(v) && VERIFICATION_STATUSES.includes(v.status), 'verification {status}', true],
    ['category', isStr, 'category', true],
    ['tags', (v) => Array.isArray(v) && v.every(isStr), 'tags[]', false],
    ['featured', (v) => typeof v === 'boolean', 'boolean', false],
    ['addedAt', isDate, 'YYYY-MM-DD', false]
  ],
  articles: [
    ...COMMON,
    ['title', isLocBoth, 'title {fa,en}', true],
    ['summary', isLocBoth, 'summary {fa,en}', true],
    ['category', isStr, 'category', true],
    ['publishedAt', isDate, 'YYYY-MM-DD', true],
    ['readingMinutes', (v) => Number.isInteger(v) && v > 0, 'positive integer', false],
    ['cover', (v) => v === null || isPath(v), 'relative path or null', false],
    ['body', isLocList, 'body {fa:[...], en:[...]}', true],
    ['sources', (v) => Array.isArray(v) && v.every((s) => isObj(s) && isStr(s.title) && isUrl(s.url)), 'sources[{title,url}]', false],
    ['verification', (v) => isObj(v) && VERIFICATION_STATUSES.includes(v.status), 'verification {status}', false],
    ['featured', (v) => typeof v === 'boolean', 'boolean', false]
  ],
  virtues: [
    ...COMMON,
    ['title', isLocBoth, 'title {fa,en}', true],
    ['summary', isLocBoth, 'summary {fa,en}', true],
    ['icon', isStr, 'icon name', true],
    ['links', (v) => Array.isArray(v) && v.every((l) => isObj(l) && LINK_TYPES.includes(l.type) && isStr(l.id)), 'links[{type,id}]', false],
    ['featured', (v) => typeof v === 'boolean', 'boolean', false]
  ],
  narrations: [
    ...COMMON,
    ['title', isLocBoth, 'title {fa,en}', true],
    ['summary', isLocBoth, 'summary {fa,en}', true],
    ['period', isLocBoth, 'period {fa,en}', false],
    ['body', isLocList, 'body {fa:[...], en:[...]}', true],
    ['sources', (v) => Array.isArray(v) && v.length > 0 && v.every((s) => isObj(s) && isStr(s.title) && isUrl(s.url)), 'sources[{title,url}] (at least one)', true],
    ['verification', (v) => isObj(v) && VERIFICATION_STATUSES.includes(v.status), 'verification {status}', true],
    ['featured', (v) => typeof v === 'boolean', 'boolean', false]
  ],
  typography: [
    ...COMMON,
    ['hadithId', isStr, 'id of an entry in hadiths.json', true],
    ['style', (v) => TYPO_STYLES.includes(v), `one of ${TYPO_STYLES.join(', ')}`, true],
    ['featured', (v) => typeof v === 'boolean', 'boolean', false],
    ['addedAt', isDate, 'YYYY-MM-DD', false]
  ],
  gallery: [
    ...COMMON,
    ['src', isPath, 'relative image path', true],
    ['width', (v) => Number.isInteger(v) && v > 0, 'integer', true],
    ['height', (v) => Number.isInteger(v) && v > 0, 'integer', true],
    ['alt', isLoc, 'alt {fa,en}', true],
    ['caption', isLoc, 'caption {fa,en}', false],
    ['credit', isStr, 'credit', false],
    ['thumb', isPath, 'relative thumbnail path', false],
    ['featured', (v) => typeof v === 'boolean', 'boolean', false],
    ['addedAt', isDate, 'YYYY-MM-DD', true]
  ],
  audio: [
    ...COMMON,
    ['title', isLoc, 'title {fa,en}', true],
    ['kind', (v) => AUDIO_KINDS.includes(v), `one of ${AUDIO_KINDS.join(', ')}`, true],
    ['speaker', isLoc, 'speaker {fa,en}', false],
    ['src', (v) => isPath(v) || isUrl(v), 'relative path or https URL', true],
    ['duration', (v) => typeof v === 'number' && v > 0, 'seconds', false],
    ['credit', isStr, 'credit', false],
    ['featured', (v) => typeof v === 'boolean', 'boolean', false],
    ['addedAt', isDate, 'YYYY-MM-DD', true]
  ]
};

/** @returns {string[]} human-readable problems; empty array means valid */
export function validateItem(collection, item) {
  const rules = SCHEMAS[collection];
  if (!rules) return [`unknown collection "${collection}"`];
  if (!isObj(item)) return ['item is not an object'];
  const errors = [];
  for (const [field, test, expected, required] of rules) {
    const v = item[field];
    if (v === undefined) {
      if (required) errors.push(`missing "${field}" (${expected})`);
    } else if (!test(v)) {
      errors.push(`invalid "${field}", expected ${expected}`);
    }
  }
  return errors;
}

/** Validate a whole collection payload; also checks id uniqueness. */
export function validateCollection(collection, payload) {
  const problems = [];
  if (!isObj(payload) || !Array.isArray(payload.items)) {
    return { valid: [], problems: [{ id: '(file)', errors: ['expected { "schema": 1, "items": [...] }'] }] };
  }
  const seen = new Set();
  const valid = [];
  payload.items.forEach((item, i) => {
    const errors = validateItem(collection, item);
    const id = (item && item.id) || `#${i}`;
    if (item && item.id) {
      if (seen.has(item.id)) errors.push('duplicate id');
      seen.add(item.id);
    }
    if (errors.length) problems.push({ id, errors });
    else valid.push(item);
  });
  return { valid, problems };
}
