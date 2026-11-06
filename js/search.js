/**
 * Client-side search over every collection. The index is built in memory from
 * the already-validated JSON; Persian/Arabic/English text is normalised first
 * (diacritics, letter variants, digits), so «العلم» finds «اَلْعِلْم».
 */
import { normalizeText } from './util.js';

const join = (...parts) => parts.flat().filter(Boolean).join(' ');
const both = (f) => (f ? join(f.fa, f.en) : '');

export function buildIndex({ hadiths = [], articles = [], virtues = [], narrations = [], typography = [], gallery = [], audio = [] }) {
  const hadithById = new Map(hadiths.map((h) => [h.id, h]));
  const docs = [];
  const add = (type, id, titleField, textParts, extra = {}) => {
    const title = typeof titleField === 'string' ? { fa: titleField, en: titleField } : titleField;
    docs.push({
      type, id, title,
      titleNorm: normalizeText(both(title)),
      hay: normalizeText(join(...textParts)),
      ...extra
    });
  };

  for (const h of hadiths) {
    const ref = h.source?.reference;
    const first = (s) => (s ? `${s.length > 70 ? `${s.slice(0, 70)}…` : s}` : '');
    add('hadiths', h.id,
      { fa: `${ref?.fa || ''} ${first(h.translation?.fa)}`.trim(), en: `${ref?.en || ''} ${first(h.translation?.en)}`.trim() },
      [h.arabic, h.translation?.fa, h.translation?.en, both(h.source?.work), both(ref), both(h.narrator), h.tags, h.category]);
  }
  for (const a of articles) add('articles', a.id, a.title, [both(a.title), both(a.summary), a.body?.fa, a.body?.en, a.category]);
  for (const v of virtues) add('virtues', v.id, v.title, [both(v.title), both(v.summary)]);
  for (const n of narrations) add('narrations', n.id, n.title, [both(n.title), both(n.summary), both(n.period), n.body?.fa, n.body?.en]);
  for (const ty of typography) {
    const h = hadithById.get(ty.hadithId);
    if (!h) continue;
    add('typography', ty.id, { fa: `${h.source?.reference?.fa || ''} ${h.translation?.fa || ''}`.trim().slice(0, 80), en: `${h.source?.reference?.en || ''} ${h.translation?.en || ''}`.trim().slice(0, 80) },
      [h.arabic, h.translation?.fa, h.translation?.en]);
  }
  for (const g of gallery) add('gallery', g.id, g.caption || g.alt, [both(g.alt), both(g.caption), g.credit]);
  for (const a of audio) add('audio', a.id, a.title, [both(a.title), both(a.speaker), a.kind]);
  return docs;
}

/** Every whitespace-separated token must appear; title hits rank higher. */
export function search(index, query, type = 'all') {
  const tokens = normalizeText(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];
  const hits = [];
  for (const d of index) {
    if (type !== 'all' && d.type !== type) continue;
    let score = 0;
    let ok = true;
    for (const tok of tokens) {
      const inTitle = d.titleNorm.includes(tok);
      const inText = d.hay.includes(tok);
      if (!inTitle && !inText) { ok = false; break; }
      score += inTitle ? 3 : 1;
    }
    if (ok) hits.push({ doc: d, score });
  }
  return hits.sort((a, b) => b.score - a.score).map((h) => h.doc);
}

export function countByType(docs) {
  const counts = {};
  for (const d of docs) counts[d.type] = (counts[d.type] || 0) + 1;
  return counts;
}
