import { el } from '../util.js';
import { t, fmtDate } from '../i18n.js';
import { url } from '../router.js';
import { hadithCard } from './hadith-card.js';
import { arrow, emptyState } from './ui.js';

/** @param {{date:string,hadith:object,origin:string}[]} timeline newest first */
export function dailyHadithSection(timeline) {
  const section = el('section', { class: 'daily', id: 'daily', 'aria-labelledby': 'daily-h' });
  if (!timeline.length) {
    section.append(emptyState({ title: t('daily.empty') }));
    return section;
  }

  let i = 0;
  const date = el('p', { class: 'daily__date' });
  const slot = el('div', { class: 'daily__slot', 'aria-live': 'polite' });
  const older = el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('daily.older') }, arrow(false, 20));
  const newer = el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('daily.newer') }, arrow(true, 20));

  const paint = () => {
    const entry = timeline[i];
    date.textContent = i === 0 ? t('daily.todayDate', { date: fmtDate(entry.date) }) : fmtDate(entry.date);
    slot.replaceChildren(hadithCard(entry.hadith, { daily: true }));
    older.disabled = i >= timeline.length - 1;
    newer.disabled = i <= 0;
  };
  older.addEventListener('click', () => { if (i < timeline.length - 1) { i += 1; paint(); } });
  newer.addEventListener('click', () => { if (i > 0) { i -= 1; paint(); } });

  section.append(
    el('div', { class: 'daily__frame' },
      el('span', { class: 'daily__star', 'aria-hidden': 'true' }),
      el('div', { class: 'daily__head' },
        el('div', {}, el('h2', { id: 'daily-h', class: 'daily__title' }, t('daily.title')), date),
        el('div', { class: 'daily__nav' }, older, newer)),
      slot,
      el('p', { class: 'daily__foot' }, el('a', { class: 'link-more', href: url('hadiths') }, t('daily.all'), arrow(true, 16)))));
  paint();
  return section;
}
