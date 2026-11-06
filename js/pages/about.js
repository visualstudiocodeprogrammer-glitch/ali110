import { el } from '../util.js';
import { t, tr, trList } from '../i18n.js';
import { loadAbout } from '../data-loader.js';
import { setMeta } from '../meta.js';
import { sourceList } from '../components/ui.js';
import { pageHead } from './page-head.js';

export async function render(main) {
  setMeta({ title: t('meta.about.title'), description: t('meta.about.desc') });
  const about = await loadAbout();
  main.replaceChildren(el('div', { class: 'container page' },
    pageHead(t('nav.about'), t('about.intro')),
    el('div', { class: 'prose-page' },
      about.sections.map((s) => el('section', { class: 'prose-section', id: s.id, 'aria-labelledby': `${s.id}-h` },
        el('h2', { id: `${s.id}-h` }, tr(s.title)),
        el('div', { class: 'prose' }, trList(s.body).map((p) => el('p', {}, p))),
        sourceList(s.sources))))));
}
