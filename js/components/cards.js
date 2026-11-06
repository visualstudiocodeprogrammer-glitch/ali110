import { el } from '../util.js';
import { t, tr, fmtDate, fmtNumber, getLang } from '../i18n.js';
import { url, asset } from '../router.js';
import { icon, arrow, categoryLabel, verificationBadge } from './ui.js';
import { hasIcon } from '../icons.js';
import { audioPlayer } from './audio-player.js';

export function virtueCard(v) {
  return el('a', { class: 'card card--virtue', href: url('virtues', { id: v.id }) },
    el('span', { class: 'medallion', 'aria-hidden': 'true' }, icon(hasIcon(v.icon) ? v.icon : 'star', 26)),
    el('h3', { class: 'card__title' }, tr(v.title)),
    el('p', { class: 'card__text' }, tr(v.summary)),
    el('span', { class: 'card__more' }, t('readMore'), arrow(true, 16)));
}

const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 4, 0);

function cover(a) {
  if (a.cover) {
    return el('div', { class: 'cover' }, el('img', { src: asset(a.cover), alt: '', loading: 'lazy', decoding: 'async' }));
  }
  return el('div', { class: `cover cover--p${hash(a.category || a.id)}`, 'aria-hidden': 'true' });
}

export function articleCard(a) {
  return el('a', { class: 'card card--article', href: url('articles', { id: a.id }) },
    cover(a),
    el('div', { class: 'card__body' },
      el('div', { class: 'meta-row' },
        el('span', { class: 'meta-row__cat' }, categoryLabel(a.category)),
        el('time', { datetime: a.publishedAt }, fmtDate(a.publishedAt)),
        a.readingMinutes && el('span', {}, t('minRead', { n: fmtNumber(a.readingMinutes) }))),
      el('h3', { class: 'card__title' }, tr(a.title)),
      el('p', { class: 'card__text' }, tr(a.summary))));
}

export function narrationCard(n) {
  return el('a', { class: 'card card--narration', href: url('narrations', { id: n.id }) },
    n.period && el('span', { class: 'period' }, tr(n.period)),
    el('h3', { class: 'card__title' }, tr(n.title)),
    el('p', { class: 'card__text' }, tr(n.summary)),
    el('span', { class: 'card__more' }, t('readMore'), arrow(true, 16)));
}

/** A typography artwork rendered live from a hadith's Arabic text. */
export function typographyCard(item, hadith, onOpen) {
  const ref = tr(hadith.source?.reference);
  return el('button', { class: `typo typo--${item.style}`, type: 'button', 'aria-label': `${t('typography.open')}: ${ref}`, onclick: () => onOpen?.(item) },
    el('span', { class: 'typo__text', lang: 'ar', dir: 'rtl' }, hadith.arabic),
    el('span', { class: 'typo__ref' }, ref));
}

/** Larger version for the lightbox. */
export function typographyPlate(item, hadith) {
  const tl = hadith.translation?.[getLang()] || hadith.translation?.fa || hadith.translation?.en || '';
  return el('figure', { class: `typo-plate typo--${item.style}` },
    el('blockquote', { class: 'typo-plate__text', lang: 'ar', dir: 'rtl' }, hadith.arabic),
    el('figcaption', { class: 'typo-plate__cap' },
      el('span', {}, tl),
      el('span', { class: 'typo-plate__ref' }, [tr(hadith.source?.work), tr(hadith.source?.reference)].filter(Boolean).join(t('refSep')))));
}

export function galleryItem(g, onOpen) {
  return el('button', { class: 'gallery-item', type: 'button', onclick: () => onOpen?.(g), 'aria-label': `${t('gallery.open')}: ${tr(g.alt)}` },
    el('img', { src: asset(g.thumb || g.src), width: g.width, height: g.height, alt: tr(g.alt), loading: 'lazy', decoding: 'async' }));
}

const kindIcon = { maddahi: 'mic', speech: 'mic', mawlid: 'star', lecture: 'book' };

export function audioCard(a) {
  return el('article', { class: 'audio-card', id: `a-${a.id}` },
    el('div', { class: 'audio-card__head' },
      el('span', { class: 'kind' }, icon(kindIcon[a.kind] || 'mic', 16), t(`audio.kind.${a.kind}`)),
      a.speaker && el('span', { class: 'audio-card__speaker' }, tr(a.speaker))),
    audioPlayer(a));
}

export { verificationBadge };
