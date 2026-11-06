import { LOCALES } from './locales.js';
import { SITE } from './site-config.js';

const KEY = 'ali110.lang';
export const SUPPORTED = ['fa', 'en'];
let lang = SITE.defaultLang;

function readStored() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function applyToDocument() {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'fa' ? 'rtl' : 'ltr';
}

export function initLang() {
  const stored = readStored();
  lang = SUPPORTED.includes(stored) ? stored : SITE.defaultLang;
  applyToDocument();
  return lang;
}

export const getLang = () => lang;
export const otherLang = () => (lang === 'fa' ? 'en' : 'fa');

export function setLang(next) {
  if (!SUPPORTED.includes(next) || next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, lang); } catch { /* storage may be blocked; the choice just won't persist */ }
  applyToDocument();
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

/** Interface string by key, with {placeholders}. Falls back to Persian, then to the key. */
export function t(key, vars) {
  let s = LOCALES[lang]?.[key] ?? LOCALES.fa[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

/** Pick the current language from a { fa, en } field, falling back to the other one. */
export function tr(field) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field[otherLang()] || '';
}

/** Same for { fa: [...], en: [...] } paragraph lists. */
export function trList(field) {
  if (!field) return [];
  return field[lang]?.length ? field[lang] : field[otherLang()] || [];
}

const locale = () => (lang === 'fa' ? 'fa-IR' : 'en-GB');

export function fmtDate(iso, options = { year: 'numeric', month: 'long', day: 'numeric' }) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale(), options).format(d);
}

export const fmtNumber = (n) => new Intl.NumberFormat(locale()).format(n);

/** Replace Latin digits in an already-built string with the digits of the active locale. */
export function localizeDigits(str) {
  if (lang !== 'fa') return str;
  return String(str).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}
