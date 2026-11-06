import { el } from '../util.js';
import { iconSvg } from '../icons.js';
import { t, fmtDate } from '../i18n.js';

export const icon = (name, size = 20, extra = '') =>
  el('span', { class: `icon ${extra}`.trim(), 'aria-hidden': 'true', html: iconSvg(name, size) });

/** Directional arrow: points toward the inline end (→ in LTR, ← in RTL). */
export const arrow = (toEnd = true, size = 18) => icon(toEnd ? 'arrowEnd' : 'arrowStart', size, 'icon--dir');

let region;
let timer;
/** Polite live-region message shown for a couple of seconds. */
export function toast(message) {
  if (!region) {
    region = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(region);
  }
  region.textContent = message;
  region.classList.add('is-on');
  clearTimeout(timer);
  timer = setTimeout(() => region.classList.remove('is-on'), 2400);
}

export function categoryLabel(cat) {
  const key = `category.${cat}`;
  const s = t(key);
  return s === key ? cat : s;
}

export function verificationBadge(status) {
  const icons = { verified: 'check', 'source-linked': 'link', unverified: 'alert' };
  return el('span', { class: `badge badge--${status}` }, icon(icons[status] || 'alert', 14), t(`verify.${status}`));
}

export function sectionHead({ id, title, intro, href, linkText }) {
  return el('header', { class: 'section-head' },
    el('div', { class: 'section-head__text' },
      el('h2', { id, class: 'section-head__title' }, title),
      intro && el('p', { class: 'section-head__intro' }, intro)),
    href && el('a', { class: 'link-more', href }, linkText, arrow(true, 16)));
}

export function emptyState({ title, text, iconName = 'star' }) {
  return el('div', { class: 'empty' },
    icon(iconName, 28),
    el('h3', { class: 'empty__title' }, title),
    text && el('p', { class: 'empty__text' }, text));
}

export function errorState(retry) {
  return el('div', { class: 'empty empty--error', role: 'alert' },
    icon('alert', 28),
    el('h3', { class: 'empty__title' }, t('error.title')),
    el('p', { class: 'empty__text' }, t('error.text')),
    retry && el('button', { class: 'btn btn--ghost', type: 'button', onclick: retry }, t('error.retry')));
}

/** "Sources" list shared by article and narration detail pages. */
export function sourceList(sources) {
  if (!sources?.length) return null;
  return el('section', { class: 'sources', 'aria-labelledby': 'sources-h' },
    el('h2', { id: 'sources-h', class: 'sources__title' }, t('sources')),
    el('ul', { class: 'sources__list' },
      sources.map((s) => el('li', {},
        el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.title, icon('external', 14),
          el('span', { class: 'sr-only' }, ` ${t('opensNew')}`))))));
}

export function checkedLine(verification) {
  if (!verification?.checkedAt) return null;
  return el('p', { class: 'checked' },
    verificationBadge(verification.status),
    el('span', {}, t('checkedOn', { date: fmtDate(verification.checkedAt) })));
}
