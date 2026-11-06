import { el } from '../util.js';
import { t, getLang } from '../i18n.js';
import { icon } from './ui.js';

let dialog;
let state;

function ensure() {
  if (dialog) return;
  const body = el('div', { class: 'lightbox__body' });
  const close = el('button', { class: 'icon-btn lightbox__close', type: 'button', 'aria-label': t('close') }, icon('close', 22));
  const prev = el('button', { class: 'icon-btn lightbox__nav lightbox__nav--prev', type: 'button' }, icon('arrowStart', 24, 'icon--dir'));
  const next = el('button', { class: 'icon-btn lightbox__nav lightbox__nav--next', type: 'button' }, icon('arrowEnd', 24, 'icon--dir'));
  dialog = el('dialog', { class: 'lightbox', 'aria-label': t('lightbox.label') }, close, prev, body, next);
  document.body.append(dialog);

  close.addEventListener('click', () => dialog.close());
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  // Clicking the dimmed backdrop (the dialog element itself) closes it.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { state?.opener?.focus?.(); state?.onClose?.(); state = null; });
  dialog.addEventListener('keydown', (e) => {
    const rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
    else if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
  });
  dialog.refs = { body, prev, next, close };
}

function paint() {
  const { items, index, render } = state;
  const { body, prev, next, close } = dialog.refs;
  body.replaceChildren(render(items[index]));
  const many = items.length > 1;
  prev.hidden = next.hidden = !many;
  prev.setAttribute('aria-label', t('prev'));
  next.setAttribute('aria-label', t('next'));
  close.setAttribute('aria-label', t('close'));
  dialog.setAttribute('aria-label', t('lightbox.label'));
}

function step(delta) {
  if (!state) return;
  const n = state.items.length;
  state.index = (state.index + delta + n) % n;
  paint();
  state.onChange?.(state.items[state.index]);
}

/**
 * @param {{items:any[], index?:number, render:(item:any)=>Node, onChange?:Function, onClose?:Function}} opts
 */
export function openLightbox({ items, index = 0, render, onChange, onClose }) {
  ensure();
  state = { items, index, render, onChange, onClose, opener: document.activeElement, lang: getLang() };
  paint();
  dialog.showModal();
  dialog.refs.close.focus();
}
