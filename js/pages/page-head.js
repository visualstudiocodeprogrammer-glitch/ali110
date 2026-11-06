import { el } from '../util.js';

export function pageHead(title, intro) {
  return el('header', { class: 'page-head' },
    el('h1', { class: 'page-head__title' }, title),
    intro && el('p', { class: 'page-head__intro' }, intro),
    el('span', { class: 'page-head__ornament', 'aria-hidden': 'true' }));
}
