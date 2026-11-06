/**
 * Heuristic extraction of "Arabic text + nearby Persian/English translation" from
 * HTML. Nothing here invents content: if a page has no Arabic block that looks
 * like a quotation, the result is an empty list.
 */
import * as cheerio from 'cheerio';
import { normalizeText } from '../../js/util.js';

const AR = /[\u0600-\u06FF\u0750-\u077F]/g;
const LATIN = /[A-Za-z]/g;
const DIAC = /[\u064B-\u065F\u0670]/g;
const PERSIAN_LETTERS = /[پچژگ]/;
const PERSIAN_WORDS = new Set(['که', 'را', 'از', 'در', 'این', 'است', 'می', 'آن', 'بر', 'با', 'برای', 'هر', 'خود']);

export function classify(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  const ar = (t.match(AR) || []).length;
  const la = (t.match(LATIN) || []).length;
  const total = ar + la;
  if (total < 8) return 'other';
  if (ar / total > 0.85) {
    if (PERSIAN_LETTERS.test(t)) return 'fa';
    const words = t.replace(DIAC, '').split(/\s+/);
    const hits = words.filter((w) => PERSIAN_WORDS.has(w) || w.startsWith('می‌')).length;
    return hits >= 2 || (hits >= 1 && words.length < 8) ? 'fa' : 'ar';
  }
  return la / total > 0.85 ? 'en' : 'other';
}

const clean = (s) => s.replace(/\[\d+\]/g, '').replace(/^[\s«»"“”'‘’:\-–—]+|[\s«»"“”'‘’]+$/g, '').replace(/\s+/g, ' ').trim();

/**
 * @returns {{arabic:string, fa?:string, en?:string}[]}
 */
export function extractCandidates(html) {
  const $ = cheerio.load(html);
  $('script, style, sup.reference, .mw-editsection, .navbox, .toc, #toc, nav, table, .references').remove();

  const blocks = [];
  $('blockquote, p, li, dd, div, span[lang="ar"]').each((_, node) => {
    const $n = $(node);
    // keep only leaf-ish blocks so a blockquote and its inner <p> are not counted twice
    if ($n.find('blockquote, p, li, dd, div').length) return;
    const text = clean($n.text());
    if (text.length < 8) return;
    blocks.push({ text, kind: classify(text) });
  });

  const out = [];
  const seen = new Set();
  blocks.forEach((b, i) => {
    if (b.kind !== 'ar') return;
    const words = b.text.split(/\s+/).length;
    if (b.text.length < 20 || b.text.length > 600 || words < 4) return;
    const key = normalizeText(b.text);
    if (seen.has(key)) return;
    seen.add(key);
    const cand = { arabic: b.text };
    for (const next of blocks.slice(i + 1, i + 4)) {
      if (next.kind === 'ar') break;
      if (next.kind === 'fa' && !cand.fa) cand.fa = next.text;
      if (next.kind === 'en' && !cand.en) cand.en = next.text;
    }
    out.push(cand);
  });
  return out;
}
