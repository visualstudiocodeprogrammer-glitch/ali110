import { el, copyText } from '../util.js';
import { t, tr, getLang, fmtDate } from '../i18n.js';
import { url, absoluteUrl } from '../router.js';
import { icon, toast, verificationBadge, categoryLabel } from './ui.js';

const trStatusKey = { draft: 'tstatus.draft', reviewed: 'tstatus.reviewed', sourced: 'tstatus.sourced' };

function referenceLine(h) {
  const work = tr(h.source?.work);
  const ref = tr(h.source?.reference);
  return [work, ref].filter(Boolean).join(t('refSep'));
}

export function hadithPlainText(h) {
  const tl = h.translation?.[getLang()] || h.translation?.fa || h.translation?.en || '';
  return [h.arabic, '', tl, `— ${referenceLine(h)}`, absoluteUrl('hadiths', { id: h.id })].join('\n');
}

async function shareHadith(h) {
  const link = absoluteUrl('hadiths', { id: h.id });
  if (navigator.share) {
    try {
      await navigator.share({ title: `${tr(h.source?.reference) || ''} | ali110`.trim(), text: h.arabic, url: link });
      return;
    } catch (e) {
      if (e?.name === 'AbortError') return; // user closed the share sheet
    }
  }
  toast((await copyText(link)) ? t('linkCopied') : t('copyFailed'));
}

function translations(h) {
  const order = getLang() === 'fa' ? ['fa', 'en'] : ['en', 'fa'];
  return el('div', { class: 'hadith__tr' }, order.filter((l) => h.translation?.[l]).map((l) =>
    el('p', { class: 'hadith__tr-item', lang: l, dir: l === 'fa' ? 'rtl' : 'ltr' }, h.translation[l])));
}

/** Full hadith block: Arabic, both translations, source, verification, actions. */
export function hadithCard(h, { daily = false } = {}) {
  const status = h.translation?.status;
  const sourceText = referenceLine(h);
  const sourceNode = h.source?.url
    ? el('a', { href: h.source.url, target: '_blank', rel: 'noopener noreferrer' }, sourceText, icon('external', 14),
        el('span', { class: 'sr-only' }, ` ${t('opensNew')}`))
    : el('span', {}, sourceText);
  const note = tr(h.verification?.note);

  return el('article', { class: `hadith${daily ? ' hadith--daily' : ''}`, id: `h-${h.id}` },
    el('p', { class: 'hadith__ar', lang: 'ar', dir: 'rtl' }, h.arabic),
    translations(h),
    el('div', { class: 'hadith__meta' },
      el('p', { class: 'hadith__line' }, el('span', { class: 'meta-label' }, t('source')), sourceNode),
      h.narrator && el('p', { class: 'hadith__line' }, el('span', { class: 'meta-label' }, t('narrator')), tr(h.narrator)),
      el('p', { class: 'hadith__line hadith__chips' },
        h.category && el('span', { class: 'chip-static' }, categoryLabel(h.category)),
        status && status !== 'reviewed' && el('span', { class: `badge badge--t-${status}` }, t(trStatusKey[status]))),
      el('details', { class: 'hadith__verify' },
        el('summary', {}, verificationBadge(h.verification.status), el('span', { class: 'hadith__verify-hint' }, t('verify.details'))),
        el('div', { class: 'hadith__verify-body' },
          note && el('p', {}, note),
          h.translation?.translator && el('p', {}, t('translatedBy', { who: h.translation.translator })),
          h.verification?.checkedAt && el('p', {}, t('checkedOn', { date: fmtDate(h.verification.checkedAt) }))))),
    el('div', { class: 'hadith__actions' },
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button',
        onclick: async () => toast((await copyText(hadithPlainText(h))) ? t('copied') : t('copyFailed')) },
      icon('copy', 16), t('copy')),
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => shareHadith(h) }, icon('share', 16), t('share')),
      el('a', { class: 'btn btn--ghost btn--sm', href: url('hadiths', { id: h.id }) }, icon('link', 16), t('permalink'))));
}

/** Compact clickable quote for grids and "related" lists. */
export function hadithQuote(h) {
  const tl = h.translation?.[getLang()] || h.translation?.fa || h.translation?.en || '';
  return el('a', { class: 'quote-card', href: url('hadiths', { id: h.id }) },
    el('span', { class: 'quote-card__ar', lang: 'ar', dir: 'rtl' }, h.arabic),
    el('span', { class: 'quote-card__tr' }, tl),
    el('span', { class: 'quote-card__ref' }, referenceLine(h)));
}
